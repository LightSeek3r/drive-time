import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildSlots, resolveBase, summarise, type DepartureSummary } from '../domain/departures';
import { sampleEstimates } from '../domain/sampleData';
import type {
  DepartureSlot,
  LatLng,
  Place,
  ProviderErrorKind,
  SlotState,
  StartTime,
} from '../domain/types';
import { streamEstimates } from '../providers/streamEstimates';
import { useOnline } from './useOnline';
import { useStablePoint } from './useStablePoint';
import { useTrafficProvider } from './useTrafficProvider';

export type EstimatesStatus = 'idle' | 'loading' | 'done' | 'error';

export interface DepartureEstimatesInput {
  from: Place | null;
  to: Place | null;
  start: StartTime;
  apiKey: string;
}

export interface DepartureEstimatesResult {
  /** 9 entries once from, to are set (or sample mode); [] otherwise. Order = departure order. */
  slots: SlotState[];
  /** summarise() over the READY estimates; undefined while idle/loading or when nothing is ready. */
  summary: DepartureSummary | undefined;
  status: EstimatesStatus;
  /** Set when a fatal error stopped the run (bad-key, missing-key, rate-limited, offline) or every slot failed. */
  error: ProviderErrorKind | null;
  /** true when apiKey is empty and the data is the built-in sample, so the UI labels it SAMPLE DATA. */
  isSample: boolean;
  /** The instant the first slot departs (resolveBase of `start` at the last run). */
  baseTime: Date | null;
  /** When the last run finished (null before, and always null for sample data). */
  updatedAt: Date | null;
  /** Re-run now, bypassing the 5-minute cache; for the Refresh button. */
  refresh(): void;
}

interface RunState {
  /** Inputs this run belongs to; a mismatch means the stored slots are for a previous trip. */
  runKey: string;
  slots: SlotState[];
  baseTime: Date | null;
  updatedAt: Date | null;
}

const EMPTY_RUN: RunState = { runKey: '', slots: [], baseTime: null, updatedAt: null };

// streamEstimates stops scheduling on these and stamps every remaining slot with the same kind.
const FATAL_KINDS: ReadonlySet<ProviderErrorKind> = new Set([
  'bad-key',
  'missing-key',
  'rate-limited',
]);

function slotOf(state: SlotState): DepartureSlot {
  return state.status === 'ready' ? state.estimate.slot : state.slot;
}

function replaceSlot(slots: readonly SlotState[], next: SlotState): SlotState[] {
  const { offsetMin } = slotOf(next);
  return slots.map((state) => (slotOf(state).offsetMin === offsetMin ? next : state));
}

/** A fatal kind wins even mid-run; any other kind only counts once every slot failed. */
export function deriveError(slots: readonly SlotState[]): ProviderErrorKind | null {
  const kinds = slots.flatMap((state) => (state.status === 'error' ? [state.kind] : []));
  const fatal = kinds.find((kind) => FATAL_KINDS.has(kind));
  if (fatal !== undefined) return fatal;
  const everySlotFailed = slots.length > 0 && kinds.length === slots.length;
  return everySlotFailed ? (kinds[0] ?? null) : null;
}

export function deriveStatus(slots: readonly SlotState[]): EstimatesStatus {
  if (slots.length === 0) return 'idle';
  if (slots.some((state) => state.status === 'loading')) return 'loading';
  return deriveError(slots) === null ? 'done' : 'error';
}

function summariseReady(slots: readonly SlotState[]): DepartureSummary | undefined {
  const ready = slots.flatMap((state) => (state.status === 'ready' ? [state.estimate] : []));
  const summary = summarise(ready);
  return summary.best === undefined ? undefined : summary;
}

function markLoadingOffline(state: SlotState): SlotState {
  return state.status === 'loading'
    ? { status: 'error', slot: state.slot, kind: 'offline' }
    : state;
}

function pointKey(point: LatLng | null): string {
  return point === null ? '-' : `${point.lat},${point.lon}`;
}

function sampleRun(start: StartTime): RunState {
  const baseTime = resolveBase(start, new Date());
  const slots = sampleEstimates(baseTime).map<SlotState>((estimate) => ({
    status: 'ready',
    estimate,
  }));
  return { runKey: '', slots, baseTime, updatedAt: null };
}

export function useDepartureEstimates({
  from,
  to,
  start,
  apiKey,
}: DepartureEstimatesInput): DepartureEstimatesResult {
  const key = apiKey.trim();
  const isSample = key === '';
  const online = useOnline();
  const provider = useTrafficProvider(key);
  const fromPoint = useStablePoint(from?.position);
  const toPoint = useStablePoint(to?.position);
  const startMs = start.mode === 'at' ? start.at.getTime() : null;
  const stableStart = useMemo<StartTime>(
    () => (startMs === null ? { mode: 'now' } : { mode: 'at', at: new Date(startMs) }),
    [startMs],
  );

  const [refreshCount, setRefreshCount] = useState(0);
  const handledRefreshCount = useRef(0);
  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);

  const [run, setRun] = useState<RunState>(EMPTY_RUN);
  const runKey = `${pointKey(fromPoint)}>${pointKey(toPoint)}@${startMs ?? 'now'}#${refreshCount}`;

  useEffect(() => {
    if (isSample || fromPoint === null || toPoint === null || !online) return;

    const controller = new AbortController();
    const baseTime = resolveBase(stableStart, new Date());
    const slots = buildSlots(baseTime);
    // Only the run that follows a refresh() click skips the cache; later input changes reuse it.
    const bypassCache = refreshCount !== handledRefreshCount.current;
    handledRefreshCount.current = refreshCount;

    setRun({
      runKey,
      slots: slots.map((slot) => ({ status: 'loading', slot })),
      baseTime,
      updatedAt: null,
    });

    void streamEstimates({
      provider,
      from: fromPoint,
      to: toPoint,
      slots,
      bypassCache,
      signal: controller.signal,
      onSlot: (state) => {
        // The run was seeded with every slot loading, so the stream's own loading events add nothing.
        if (state.status === 'loading') return;
        setRun((prev) => ({ ...prev, slots: replaceSlot(prev.slots, state) }));
      },
    }).then(() => {
      if (!controller.signal.aborted) setRun((prev) => ({ ...prev, updatedAt: new Date() }));
    });

    return () => controller.abort();
  }, [isSample, fromPoint, toPoint, online, stableStart, provider, runKey, refreshCount]);

  // Sample data needs no network, so it is derived (never an empty first frame) instead of run in the effect.
  // refreshCount is a dependency only so Refresh re-resolves a 'now' base.
  const sample = useMemo(
    () => (isSample ? sampleRun(stableStart) : EMPTY_RUN),
    [isSample, stableStart, refreshCount],
  );

  const hasPlaces = fromPoint !== null && toPoint !== null;
  const offline = !isSample && hasPlaces && !online;
  // Inputs changed but the effect has not seeded the new run yet: do not flash the previous trip.
  const pending = !isSample && hasPlaces && online && run.runKey !== runKey;
  const source = isSample ? sample : !hasPlaces || pending ? EMPTY_RUN : run;

  const view = useMemo(() => {
    const slots = offline ? source.slots.map(markLoadingOffline) : source.slots;
    const error = offline ? 'offline' : deriveError(slots);
    const slotStatus = deriveStatus(slots);
    const status: EstimatesStatus = pending
      ? 'loading'
      : error !== null && slotStatus !== 'loading'
        ? 'error'
        : slotStatus;
    const summary = status === 'idle' || status === 'loading' ? undefined : summariseReady(slots);
    return { slots, error, status, summary };
  }, [source.slots, offline, pending]);

  return {
    ...view,
    isSample,
    baseTime: source.baseTime,
    updatedAt: source.updatedAt,
    refresh,
  };
}
