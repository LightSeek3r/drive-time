import {
  deltaMin,
  overageSec,
  toDisplayMinutes,
  type DepartureSummary,
} from '../../domain/departures';
import type { ProviderErrorKind, SlotEstimate, SlotState } from '../../domain/types';

/** The shared track stands for this many times the slowest trip, so every bar fits with room for its tag. */
export const TRACK_HEADROOM = 1.3;

export type RowEmphasis = 'rest' | 'best' | 'peak';

interface RowBase {
  offsetMin: number;
  departAt: Date;
  /** The departure minute has already passed. */
  spent: boolean;
}

export type ResultRow =
  | (RowBase & { status: 'loading' })
  | (RowBase & { status: 'error'; kind: ProviderErrorKind })
  | (RowBase & {
      status: 'ready';
      arriveAt: Date;
      minutes: number;
      /** Displayed-minute difference from the first slot; null on the first slot itself. */
      delta: number | null;
      /** Trip and overhang as shares (0..1) of the shared track. */
      trip: number;
      over: number;
      emphasis: RowEmphasis;
    });

const MINUTE_MS = 60_000;

function slotOf(state: SlotState) {
  return state.status === 'ready' ? state.estimate.slot : state.slot;
}

function readyRow(
  estimate: SlotEstimate,
  base: RowBase,
  summary: DepartureSummary | undefined,
  track: number,
): ResultRow {
  const { slot } = estimate;
  const best = summary?.best ?? estimate;
  const isFirst = summary !== undefined && summary.first.slot.offsetMin === slot.offsetMin;
  const emphasis: RowEmphasis =
    summary === undefined
      ? 'rest'
      : summary.best.slot.offsetMin === slot.offsetMin
        ? 'best'
        : summary.peak?.slot.offsetMin === slot.offsetMin
          ? 'peak'
          : 'rest';
  return {
    ...base,
    status: 'ready',
    arriveAt: estimate.arriveAt,
    minutes: toDisplayMinutes(estimate.durationSec),
    delta: summary === undefined || isFirst ? null : deltaMin(estimate, summary.first),
    trip: best.durationSec / track,
    over: overageSec(estimate, best) / track,
    emphasis,
  };
}

/** Turns slot states into display rows; all scaling and row state decisions live here. */
export function buildRows(
  slots: readonly SlotState[],
  summary: DepartureSummary | undefined,
  now: Date,
): ResultRow[] {
  const ready = slots.flatMap((state) => (state.status === 'ready' ? [state.estimate] : []));
  const slowestSec = Math.max(0, ...ready.map((estimate) => estimate.durationSec));
  const track = slowestSec * TRACK_HEADROOM;
  const startOfMinute = Math.floor(now.getTime() / MINUTE_MS) * MINUTE_MS;

  return slots.map((state) => {
    const slot = slotOf(state);
    const base: RowBase = {
      offsetMin: slot.offsetMin,
      departAt: slot.departAt,
      spent: slot.departAt.getTime() < startOfMinute,
    };
    if (state.status === 'loading') return { ...base, status: 'loading' };
    if (state.status === 'error') return { ...base, status: 'error', kind: state.kind };
    return readyRow(state.estimate, base, summary, track);
  });
}
