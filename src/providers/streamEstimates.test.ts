import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSlots } from '../domain/departures';
import type { LatLng, ProviderErrorKind, RouteEstimate, SlotState } from '../domain/types';
import {
  createEstimateCache,
  estimateCacheKey,
  streamEstimates,
  type StreamEstimatesOptions,
} from './streamEstimates';
import { ProviderError, type RouteRequest, type TrafficProvider } from './trafficProvider';

const from: LatLng = { lat: 45.76, lon: 4.83 };
const to: LatLng = { lat: 45.7606, lon: 4.8595 };
const base = new Date('2026-11-10T08:00:00+01:00');
const slots = buildSlots(base);
const T0 = base.getTime();

function routeFor(departAt: Date): RouteEstimate {
  const minutes = (departAt.getTime() - T0) / 60_000;
  return { durationSec: 1_200 + minutes * 10, freeFlowSec: 1_000, distanceM: 12_000 };
}

/** Provider whose calls settle only when the test says so; tracks in-flight count. */
function manualProvider() {
  const calls: { request: RouteRequest; resolve: () => void; reject: (error: unknown) => void }[] =
    [];
  let inFlight = 0;
  let maxInFlight = 0;
  const provider: TrafficProvider = {
    suggest: async () => [],
    route: (request) =>
      new Promise<RouteEstimate>((resolve, reject) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        let settled = false;
        const finish = (settle: () => void) => {
          if (settled) return;
          settled = true;
          inFlight -= 1;
          settle();
        };
        request.signal?.addEventListener('abort', () =>
          finish(() => reject(new ProviderError('aborted'))),
        );
        calls.push({
          request,
          resolve: () => finish(() => resolve(routeFor(request.departAt))),
          reject: (error) => finish(() => reject(error)),
        });
      }),
  };
  return {
    provider,
    calls,
    maxInFlight: () => maxInFlight,
  };
}

/** Provider that settles after a short random delay, so completion order differs from start order. */
function jitteryProvider(fail?: (request: RouteRequest) => ProviderErrorKind | undefined) {
  let inFlight = 0;
  let maxInFlight = 0;
  const requests: RouteRequest[] = [];
  const provider: TrafficProvider = {
    suggest: async () => [],
    route: async (request) => {
      requests.push(request);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
      inFlight -= 1;
      const kind = fail?.(request);
      if (kind !== undefined) throw new ProviderError(kind);
      return routeFor(request.departAt);
    },
  };
  return { provider, requests, maxInFlight: () => maxInFlight };
}

/** Real-timer tests exercise scheduling, not pacing: no spacing and no rate-limit retries. */
const stream = (options: StreamEstimatesOptions) =>
  streamEstimates({ minIntervalMs: 0, rateLimitBackoffMs: [], ...options });

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function finalStates(states: SlotState[]): Map<number, SlotState> {
  const byOffset = new Map<number, SlotState>();
  for (const state of states) {
    const slot = state.status === 'ready' ? state.estimate.slot : state.slot;
    byOffset.set(slot.offsetMin, state);
  }
  return byOffset;
}

describe('streamEstimates', () => {
  it('emits loading for every slot first, then one ready state per slot', async () => {
    const { provider } = jitteryProvider();
    const states: SlotState[] = [];
    await stream({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      cache: createEstimateCache(),
    });

    expect(states).toHaveLength(18);
    expect(states.slice(0, 9).map((s) => s.status)).toEqual(Array(9).fill('loading'));
    expect(states.slice(9).every((s) => s.status === 'ready')).toBe(true);
    const ready = finalStates(states).get(30);
    expect(ready).toMatchObject({ status: 'ready', estimate: { durationSec: 1_500 } });
    if (ready?.status !== 'ready') throw new Error('expected ready');
    expect(ready.estimate.arriveAt.getTime()).toBe(T0 + 30 * 60_000 + 1_500_000);
  });

  it.each([1, 3, 5])('never exceeds a concurrency of %i', async (concurrency) => {
    const { provider, requests, maxInFlight } = jitteryProvider();
    await stream({
      provider,
      from,
      to,
      slots,
      onSlot: () => {},
      concurrency,
      cache: createEstimateCache(),
    });
    expect(maxInFlight()).toBe(concurrency);
    expect(requests.map((r) => r.departAt.getTime()).sort()).toEqual(
      slots.map((s) => s.departAt.getTime()).sort(),
    );
  });

  it('serves a repeat run from the cache without calling the provider', async () => {
    const cache = createEstimateCache();
    const first = jitteryProvider();
    await stream({ provider: first.provider, from, to, slots, onSlot: () => {}, cache });

    const second = jitteryProvider();
    const states: SlotState[] = [];
    await stream({
      provider: second.provider,
      // Same place to 4 decimals (~11 m): still a hit.
      from: { lat: 45.76001, lon: 4.83002 },
      to,
      slots,
      onSlot: (s) => states.push(s),
      cache,
    });
    expect(second.requests).toHaveLength(0);
    expect([...finalStates(states).values()].every((s) => s.status === 'ready')).toBe(true);
  });

  it('bypasses cache reads on refresh but stores the fresh results', async () => {
    const cache = createEstimateCache();
    await stream({
      provider: jitteryProvider().provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache,
    });

    const refresh = jitteryProvider();
    await stream({
      provider: refresh.provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache,
      bypassCache: true,
    });
    expect(refresh.requests).toHaveLength(9);
    expect(cache.get(estimateCacheKey(from, to, slots[0]!.departAt), Date.now())).toBeDefined();
  });

  it('expires cached estimates after 5 minutes', async () => {
    const cache = createEstimateCache();
    let clock = 1_000_000;
    const now = () => clock;
    await stream({
      provider: jitteryProvider().provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache,
      now,
    });

    clock += 5 * 60_000 - 1;
    const fresh = jitteryProvider();
    await stream({
      provider: fresh.provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache,
      now,
    });
    expect(fresh.requests).toHaveLength(0);

    clock += 1;
    const stale = jitteryProvider();
    await stream({
      provider: stale.provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache,
      now,
    });
    expect(stale.requests).toHaveLength(9);
  });

  it('keys the cache by departure minute', () => {
    const at = new Date('2026-11-10T08:15:00+01:00');
    const sameMinute = new Date('2026-11-10T08:15:59+01:00');
    const nextMinute = new Date('2026-11-10T08:16:00+01:00');
    expect(estimateCacheKey(from, to, at)).toBe(estimateCacheKey(from, to, sameMinute));
    expect(estimateCacheKey(from, to, at)).not.toBe(estimateCacheKey(from, to, nextMinute));
    expect(estimateCacheKey(from, to, at)).not.toBe(estimateCacheKey(to, from, at));
  });

  it('stops promptly on abort: no further provider calls and no onSlot after abort', async () => {
    const { provider, calls } = manualProvider();
    const controller = new AbortController();
    const states: SlotState[] = [];
    const done = stream({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      signal: controller.signal,
      cache: createEstimateCache(),
    });

    await flush();
    expect(calls).toHaveLength(3);
    calls[0]!.resolve();
    await flush();
    expect(calls).toHaveLength(4);
    const emittedBeforeAbort = states.length;

    controller.abort();
    await done;
    expect(calls).toHaveLength(4);
    expect(states).toHaveLength(emittedBeforeAbort);
    expect(emittedBeforeAbort).toBe(10);
  });

  it('emits nothing and calls nothing when already aborted', async () => {
    const { provider, calls } = manualProvider();
    const states: SlotState[] = [];
    await stream({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      signal: AbortSignal.abort(),
      cache: createEstimateCache(),
    });
    expect(calls).toHaveLength(0);
    expect(states).toHaveLength(0);
  });

  it.each(['bad-key', 'missing-key', 'rate-limited'] as const)(
    'stops scheduling after %s and marks the remaining slots with it',
    async (kind) => {
      const { provider, calls } = manualProvider();
      const states: SlotState[] = [];
      const done = stream({
        provider,
        from,
        to,
        slots,
        onSlot: (s) => states.push(s),
        cache: createEstimateCache(),
      });
      await flush();
      calls[0]!.reject(new ProviderError(kind));
      await flush();
      // The two requests already in flight still settle normally.
      calls[1]!.resolve();
      calls[2]!.reject(new ProviderError(kind));
      await done;

      expect(calls).toHaveLength(3);
      const final = finalStates(states);
      expect(final.size).toBe(9);
      expect(final.get(15)?.status).toBe('ready');
      for (const offset of [0, 30, 45, 60, 75, 90, 105, 120]) {
        expect(final.get(offset)).toMatchObject({ status: 'error', kind });
      }
    },
  );

  it('keeps going after a per-slot error such as no-route', async () => {
    const { provider, requests } = jitteryProvider((r) =>
      r.departAt.getTime() === slots[1]!.departAt.getTime() ? 'no-route' : undefined,
    );
    const states: SlotState[] = [];
    await stream({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      cache: createEstimateCache(),
    });
    expect(requests).toHaveLength(9);
    const final = finalStates(states);
    expect(final.get(15)).toMatchObject({ status: 'error', kind: 'no-route' });
    expect([...final.values()].filter((s) => s.status === 'ready')).toHaveLength(8);
  });

  it('maps a non-ProviderError rejection to unknown', async () => {
    const provider: TrafficProvider = {
      suggest: async () => [],
      route: async () => {
        throw new Error('boom');
      },
    };
    const states: SlotState[] = [];
    await stream({
      provider,
      from,
      to,
      slots: slots.slice(0, 1),
      onSlot: (s) => states.push(s),
      cache: createEstimateCache(),
    });
    expect(states[states.length - 1]).toMatchObject({ status: 'error', kind: 'unknown' });
  });

  it('does not cache failures', async () => {
    const cache = createEstimateCache();
    const failing = jitteryProvider(() => 'no-route');
    await stream({ provider: failing.provider, from, to, slots, onSlot: () => {}, cache });
    const retry = jitteryProvider();
    await stream({ provider: retry.provider, from, to, slots, onSlot: () => {}, cache });
    expect(retry.requests).toHaveLength(9);
  });

  it('resolves immediately for no slots', async () => {
    const { provider, calls } = manualProvider();
    await stream({
      provider,
      from,
      to,
      slots: [],
      onSlot: () => {},
      cache: createEstimateCache(),
    });
    expect(calls).toHaveLength(0);
  });
});

/** Provider that records the fake-clock time of each call and answers from a script. */
function scriptedProvider(
  outcome: (callIndex: number) => ProviderErrorKind | undefined = () => undefined,
  holdMs = 0,
) {
  const startedAt: number[] = [];
  const departures: number[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const provider: TrafficProvider = {
    suggest: async () => [],
    route: async (request) => {
      const index = startedAt.length;
      startedAt.push(Date.now());
      departures.push(request.departAt.getTime());
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      if (holdMs > 0) await new Promise((resolve) => setTimeout(resolve, holdMs));
      inFlight -= 1;
      const kind = outcome(index);
      if (kind !== undefined) throw new ProviderError(kind);
      return routeFor(request.departAt);
    },
  };
  return { provider, startedAt, departures, maxInFlight: () => maxInFlight };
}

function gaps(times: readonly number[]): number[] {
  return times.slice(1).map((t, i) => t - times[i]!);
}

describe('streamEstimates pacing and rate-limit backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('spaces request starts by minIntervalMs: 9 slots take 8 intervals', async () => {
    const { provider, startedAt } = scriptedProvider();
    const t0 = Date.now();
    let finished = false;
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache: createEstimateCache(),
    }).then(() => {
      finished = true;
    });

    await vi.advanceTimersByTimeAsync(1_999);
    expect(finished).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await done;

    expect(startedAt.map((t) => t - t0)).toEqual([
      0, 250, 500, 750, 1_000, 1_250, 1_500, 1_750, 2_000,
    ]);
  });

  it('honors a custom minIntervalMs', async () => {
    const { provider, startedAt } = scriptedProvider();
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache: createEstimateCache(),
      minIntervalMs: 100,
    });
    await vi.advanceTimersByTimeAsync(800);
    await done;
    expect(gaps(startedAt)).toEqual(Array(8).fill(100));
  });

  it('still honors the concurrency cap when requests outlast the interval', async () => {
    const { provider, startedAt, maxInFlight } = scriptedProvider(() => undefined, 1_000);
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache: createEstimateCache(),
      concurrency: 3,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await done;
    expect(startedAt).toHaveLength(9);
    expect(maxInFlight()).toBe(3);
    expect(Math.min(...gaps(startedAt))).toBeGreaterThanOrEqual(250);
  });

  it('retries a one-off rate limit and yields a ready slot', async () => {
    const { provider, startedAt, departures } = scriptedProvider((i) =>
      i === 0 ? 'rate-limited' : undefined,
    );
    const states: SlotState[] = [];
    const t0 = Date.now();
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      cache: createEstimateCache(),
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await done;

    expect(startedAt).toHaveLength(10);
    expect(departures[1]).toBe(departures[0]);
    const final = finalStates(states);
    expect(final.size).toBe(9);
    expect([...final.values()].every((s) => s.status === 'ready')).toBe(true);
    expect(states.some((s) => s.status === 'error')).toBe(false);
    // The rate limit is global: no slot starts during the 1 s backoff.
    expect(startedAt.slice(1).every((t) => t - t0 >= 1_000)).toBe(true);
    expect(Math.min(...gaps(startedAt))).toBeGreaterThanOrEqual(250);
  });

  it('exhausts the backoff retries, then short-circuits the remaining slots', async () => {
    const { provider, startedAt, departures } = scriptedProvider(() => 'rate-limited');
    const states: SlotState[] = [];
    const t0 = Date.now();
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      cache: createEstimateCache(),
      concurrency: 1,
    });
    await vi.advanceTimersByTimeAsync(3_000);
    await done;

    expect(startedAt.map((t) => t - t0)).toEqual([0, 1_000, 3_000]);
    expect(new Set(departures).size).toBe(1);
    const final = finalStates(states);
    expect(final.size).toBe(9);
    for (const state of final.values()) {
      expect(state).toMatchObject({ status: 'error', kind: 'rate-limited' });
    }

    await vi.advanceTimersByTimeAsync(10_000);
    expect(startedAt).toHaveLength(3);
  });

  it('uses custom rateLimitBackoffMs', async () => {
    const { provider, startedAt } = scriptedProvider(() => 'rate-limited');
    const t0 = Date.now();
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache: createEstimateCache(),
      concurrency: 1,
      rateLimitBackoffMs: [400],
    });
    await vi.advanceTimersByTimeAsync(400);
    await done;
    expect(startedAt.map((t) => t - t0)).toEqual([0, 400]);
  });

  it.each(['bad-key', 'missing-key'] as const)('does not retry %s', async (kind) => {
    const { provider, startedAt } = scriptedProvider(() => kind);
    const states: SlotState[] = [];
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      cache: createEstimateCache(),
      concurrency: 1,
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await done;
    expect(startedAt).toHaveLength(1);
    const final = finalStates(states);
    expect(final.size).toBe(9);
    for (const state of final.values()) expect(state).toMatchObject({ status: 'error', kind });
  });

  it('does not retry no-route and keeps going', async () => {
    const { provider, startedAt } = scriptedProvider((i) => (i === 1 ? 'no-route' : undefined));
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: () => {},
      cache: createEstimateCache(),
    });
    await vi.advanceTimersByTimeAsync(2_000);
    await done;
    expect(startedAt).toHaveLength(9);
  });

  it('aborts during a pacing wait: no further calls, no onSlot, no dangling timers', async () => {
    const { provider, startedAt } = scriptedProvider();
    const controller = new AbortController();
    const states: SlotState[] = [];
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      signal: controller.signal,
      cache: createEstimateCache(),
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(startedAt).toHaveLength(1);
    const emitted = states.length;

    controller.abort();
    await done;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(startedAt).toHaveLength(1);
    expect(states).toHaveLength(emitted);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborts during a rate-limit backoff: no retry, no onSlot, no dangling timers', async () => {
    const { provider, startedAt } = scriptedProvider(() => 'rate-limited');
    const controller = new AbortController();
    const states: SlotState[] = [];
    const done = streamEstimates({
      provider,
      from,
      to,
      slots,
      onSlot: (s) => states.push(s),
      signal: controller.signal,
      cache: createEstimateCache(),
      concurrency: 1,
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(startedAt).toHaveLength(1);
    const emitted = states.length;

    controller.abort();
    await done;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(startedAt).toHaveLength(1);
    expect(states).toHaveLength(emitted);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not pace cache hits', async () => {
    const cache = createEstimateCache();
    const missing = slots[4]!;
    for (const slot of slots) {
      if (slot !== missing) {
        cache.set(estimateCacheKey(from, to, slot.departAt), routeFor(slot.departAt), Date.now());
      }
    }
    const { provider, startedAt } = scriptedProvider();
    const states: SlotState[] = [];
    // No timer advance: any pacing wait would hang this await.
    await streamEstimates({ provider, from, to, slots, onSlot: (s) => states.push(s), cache });
    expect(startedAt).toHaveLength(1);
    expect([...finalStates(states).values()].every((s) => s.status === 'ready')).toBe(true);
  });
});
