import { toEstimate } from '../domain/departures';
import type {
  DepartureSlot,
  LatLng,
  ProviderErrorKind,
  RouteEstimate,
  SlotState,
} from '../domain/types';
import { ProviderError, type TrafficProvider } from './trafficProvider';

const CACHE_TTL_MS = 5 * 60_000;
const MINUTE_MS = 60_000;
// deliberate: TomTom free tier allows ~5 QPS; starting at most 4 requests/s keeps headroom for search.
const DEFAULT_MIN_INTERVAL_MS = 250;
// Rate limits are usually a per-second window, so a short wait clears them; 2 retries bound the delay at ~3 s.
const DEFAULT_RATE_LIMIT_BACKOFF_MS: readonly number[] = [1_000, 2_000];

/**
 * Errors that will fail every remaining slot the same way; retrying them only burns quota.
 * `rate-limited` is fatal only once its backoff retries are exhausted.
 */
const FATAL_KINDS: ReadonlySet<ProviderErrorKind> = new Set([
  'bad-key',
  'missing-key',
  'rate-limited',
]);

export interface EstimateCache {
  get(key: string, nowMs: number): RouteEstimate | undefined;
  set(key: string, estimate: RouteEstimate, nowMs: number): void;
}

export function createEstimateCache(ttlMs = CACHE_TTL_MS): EstimateCache {
  const entries = new Map<string, { estimate: RouteEstimate; expiresAt: number }>();
  return {
    get(key, nowMs) {
      const entry = entries.get(key);
      if (entry === undefined) return undefined;
      if (entry.expiresAt <= nowMs) {
        entries.delete(key);
        return undefined;
      }
      return entry.estimate;
    },
    set(key, estimate, nowMs) {
      // deliberate: O(n) sweep per write; ~9 entries per refresh keeps n tiny, switch to an LRU if it ever holds > ~1000.
      for (const [k, entry] of entries) {
        if (entry.expiresAt <= nowMs) entries.delete(k);
      }
      entries.set(key, { estimate, expiresAt: nowMs + ttlMs });
    },
  };
}

export const defaultEstimateCache: EstimateCache = createEstimateCache();

/** ~11 m position precision and minute departure precision: a repeat lookup a few seconds later hits. */
export function estimateCacheKey(from: LatLng, to: LatLng, departAt: Date): string {
  const point = ({ lat, lon }: LatLng) => `${lat.toFixed(4)},${lon.toFixed(4)}`;
  return `${point(from)}|${point(to)}|${Math.floor(departAt.getTime() / MINUTE_MS)}`;
}

export interface StreamEstimatesOptions {
  provider: TrafficProvider;
  from: LatLng;
  to: LatLng;
  slots: readonly DepartureSlot[];
  onSlot: (state: SlotState) => void;
  signal?: AbortSignal;
  concurrency?: number;
  /** Minimum gap between request starts across all slots; cache hits do not consume one. Default 250. */
  minIntervalMs?: number;
  /** Waits before each retry of a rate-limited slot; also delays every other slot. Default [1000, 2000]. */
  rateLimitBackoffMs?: readonly number[];
  cache?: EstimateCache;
  /** Skip cache reads (manual Refresh); fresh results are still written back. */
  bypassCache?: boolean;
  /** Clock for cache expiry and request pacing. */
  now?: () => number;
}

/** Resolves after `ms`, or immediately on abort; leaves no timer or listener behind either way. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Emits `loading` for every slot, then one `ready`/`error` per slot as it settles (in settle order).
 * Request starts are spaced `minIntervalMs` apart; `rate-limited` rejections are retried after `rateLimitBackoffMs`.
 * Never rejects for provider failures; emits nothing once `signal` is aborted.
 */
export async function streamEstimates({
  provider,
  from,
  to,
  slots,
  onSlot,
  signal,
  concurrency = 3,
  minIntervalMs = DEFAULT_MIN_INTERVAL_MS,
  rateLimitBackoffMs = DEFAULT_RATE_LIMIT_BACKOFF_MS,
  cache = defaultEstimateCache,
  bypassCache = false,
  now = () => Date.now(),
}: StreamEstimatesOptions): Promise<void> {
  let next = 0;
  let fatalKind: ProviderErrorKind | undefined;
  let nextStartAt = 0;

  const emit = (state: SlotState) => {
    if (!signal?.aborted) onSlot(state);
  };
  const canSchedule = () => !signal?.aborted && fatalKind === undefined && next < slots.length;

  for (const slot of slots) emit({ status: 'loading', slot });

  // Re-checks after every sleep: a backoff may have pushed the clock while this slot was waiting.
  const waitForTurn = async (): Promise<void> => {
    for (let wait = nextStartAt - now(); wait > 0; wait = nextStartAt - now()) {
      await sleep(wait, signal);
      if (signal?.aborted) return;
    }
    nextStartAt = now() + minIntervalMs;
  };

  // A rate limit applies to the whole key, so every slot waits, not just the one that was rejected.
  const holdAllSlots = (ms: number) => {
    nextStartAt = Math.max(nextStartAt, now() + ms);
  };

  const settle = async (slot: DepartureSlot): Promise<void> => {
    const key = estimateCacheKey(from, to, slot.departAt);
    const cached = bypassCache ? undefined : cache.get(key, now());
    if (cached !== undefined) {
      emit({ status: 'ready', estimate: toEstimate(slot, cached) });
      return;
    }
    for (let attempt = 0; ; attempt += 1) {
      await waitForTurn();
      if (signal?.aborted) return;
      if (fatalKind !== undefined) {
        emit({ status: 'error', slot, kind: fatalKind });
        return;
      }
      try {
        const route = await provider.route({ from, to, departAt: slot.departAt, signal });
        cache.set(key, route, now());
        emit({ status: 'ready', estimate: toEstimate(slot, route) });
        return;
      } catch (error) {
        const kind = error instanceof ProviderError ? error.kind : 'unknown';
        const backoffMs = rateLimitBackoffMs[attempt];
        const retryable = kind === 'rate-limited' && backoffMs !== undefined;
        if (retryable && fatalKind === undefined && !signal?.aborted) {
          holdAllSlots(backoffMs);
          continue;
        }
        emit({ status: 'error', slot, kind });
        if (FATAL_KINDS.has(kind) && fatalKind === undefined) {
          fatalKind = kind;
          for (const skipped of slots.slice(next)) emit({ status: 'error', slot: skipped, kind });
          next = slots.length;
        }
        return;
      }
    }
  };

  const worker = async (): Promise<void> => {
    while (canSchedule()) {
      const slot = slots[next++];
      if (slot !== undefined) await settle(slot);
    }
  };

  const workerCount = Math.min(Math.max(1, Math.floor(concurrency)), slots.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
}
