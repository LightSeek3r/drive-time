import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';
import { buildSlots, toEstimate } from '../domain/departures';
import type {
  Place,
  ProviderErrorKind,
  RouteEstimate,
  SlotState,
  StartTime,
} from '../domain/types';
import { streamEstimates, type StreamEstimatesOptions } from '../providers/streamEstimates';
import { deriveError, deriveStatus, useDepartureEstimates } from './useDepartureEstimates';

vi.mock('../providers/streamEstimates', () => ({ streamEstimates: vi.fn() }));

const stream = streamEstimates as Mock<[StreamEstimatesOptions], Promise<void>>;

const home: Place = { id: 'h', label: 'Home', address: '', position: { lat: 45.76, lon: 4.83 } };
const work: Place = {
  id: 'w',
  label: 'Work',
  address: '',
  position: { lat: 45.7606, lon: 4.8595 },
};
// Far future: resolveBase clamps a past `at` to the current time.
const START_AT = new Date('2099-11-10T08:00:00+01:00');
const at: StartTime = { mode: 'at', at: START_AT } as StartTime;
const now: StartTime = { mode: 'now' };

interface ActiveRun {
  options: StreamEstimatesOptions;
  finish: () => void;
}
let runs: ActiveRun[] = [];

function routeFor(index: number): RouteEstimate {
  return { durationSec: (30 + index) * 60, freeFlowSec: 1500, distanceM: 10_000 };
}

function ready(options: StreamEstimatesOptions, index: number): SlotState {
  const slot = options.slots[index];
  if (slot === undefined) throw new Error('no slot');
  return { status: 'ready', estimate: toEstimate(slot, routeFor(index)) };
}

function failed(
  options: StreamEstimatesOptions,
  index: number,
  kind: ProviderErrorKind,
): SlotState {
  const slot = options.slots[index];
  if (slot === undefined) throw new Error('no slot');
  return { status: 'error', slot, kind };
}

function lastRun(): ActiveRun {
  const run = runs[runs.length - 1];
  if (run === undefined) throw new Error('no run started');
  return run;
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
}

beforeEach(() => {
  runs = [];
  stream.mockReset();
  stream.mockImplementation(
    (options) =>
      new Promise<void>((resolve) => {
        runs.push({ options, finish: resolve });
      }),
  );
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('deriveStatus / deriveError', () => {
  const slots = buildSlots(new Date('2026-11-10T08:00:00Z'));
  const loading = (i: number): SlotState => ({ status: 'loading', slot: slots[i]! });
  const errored = (i: number, kind: ProviderErrorKind): SlotState => ({
    status: 'error',
    slot: slots[i]!,
    kind,
  });
  const okay = (i: number): SlotState => ({
    status: 'ready',
    estimate: toEstimate(slots[i]!, routeFor(i)),
  });

  it('is idle for no slots', () => {
    expect(deriveStatus([])).toBe('idle');
    expect(deriveError([])).toBeNull();
  });

  it('is loading while any slot is loading, even after a fatal error', () => {
    expect(deriveStatus([okay(0), loading(1)])).toBe('loading');
    expect(deriveError([errored(0, 'unavailable'), loading(1)])).toBe('unavailable');
  });

  it('is done when settled with at least one ready slot and no fatal kind', () => {
    expect(deriveStatus([okay(0), errored(1, 'no-route')])).toBe('done');
    expect(deriveError([okay(0), errored(1, 'unknown')])).toBeNull();
  });

  it('is an error when every slot failed, or any slot hit a fatal kind', () => {
    expect(deriveStatus([errored(0, 'no-route'), errored(1, 'no-route')])).toBe('error');
    expect(deriveError([errored(0, 'no-route'), errored(1, 'no-route')])).toBe('no-route');
    expect(deriveStatus([okay(0), errored(1, 'rate-limited')])).toBe('error');
  });
});

describe('useDepartureEstimates', () => {
  it.each([
    ['neither place', null, null],
    ['only from', home, null],
    ['only to', null, work],
  ])('serves sample data without network when %s is set', (_label, from, to) => {
    const { result } = renderHook(() => useDepartureEstimates({ from, to, start: at }));

    expect(stream).not.toHaveBeenCalled();
    expect(result.current.isSample).toBe(true);
    expect(result.current.status).toBe('done');
    expect(result.current.slots).toHaveLength(9);
    expect(result.current.baseTime).toEqual(START_AT);
    expect(result.current.summary?.savedVsFirstMin).toBe(6);
    expect(result.current.updatedAt).toBeNull();
  });

  it('keeps sample data referentially stable across rerenders', () => {
    const { result, rerender } = renderHook(() =>
      useDepartureEstimates({ from: null, to: null, start: now }),
    );
    const { slots, baseTime } = result.current;

    rerender();

    expect(result.current.slots).toBe(slots);
    expect(result.current.baseTime).toBe(baseTime);
  });

  it('seeds nine loading slots, streams results in, then reports done with a summary', async () => {
    const { result } = renderHook(() => useDepartureEstimates({ from: home, to: work, start: at }));

    expect(stream).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('loading');
    expect(result.current.slots.map((s) => s.status)).toEqual(Array(9).fill('loading'));
    expect(result.current.summary).toBeUndefined();

    const { options, finish } = lastRun();
    act(() => {
      options.onSlot(ready(options, 3));
    });
    expect(result.current.slots[3]?.status).toBe('ready');
    expect(result.current.slots.filter((s) => s.status === 'loading')).toHaveLength(8);

    await act(async () => {
      for (let i = 0; i < 9; i += 1) options.onSlot(ready(options, i));
      finish();
    });

    expect(result.current.status).toBe('done');
    expect(result.current.summary?.first.slot.offsetMin).toBe(0);
    expect(result.current.updatedAt).toBeInstanceOf(Date);
    expect(result.current.baseTime).toEqual(options.slots[0]?.departAt);
  });

  it('passes rounded positions to the stream and bypasses the cache only after refresh', () => {
    const { result } = renderHook(() => useDepartureEstimates({ from: home, to: work, start: at }));
    expect(lastRun().options).toMatchObject({
      from: { lat: 45.76, lon: 4.83 },
      to: { lat: 45.7606, lon: 4.8595 },
      bypassCache: false,
    });

    act(() => result.current.refresh());

    expect(stream).toHaveBeenCalledTimes(2);
    expect(lastRun().options.bypassCache).toBe(true);
  });

  it('maps a fatal kind to error and status', () => {
    const { result } = renderHook(() => useDepartureEstimates({ from: home, to: work, start: at }));
    const { options } = lastRun();

    act(() => {
      for (let i = 0; i < 9; i += 1) options.onSlot(failed(options, i, 'unavailable'));
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('unavailable');
    expect(result.current.summary).toBeUndefined();
  });

  it('reports no-route only when every slot failed that way', () => {
    const { result } = renderHook(() => useDepartureEstimates({ from: home, to: work, start: at }));
    const { options } = lastRun();

    act(() => {
      for (let i = 0; i < 8; i += 1) options.onSlot(failed(options, i, 'no-route'));
      options.onSlot(ready(options, 8));
    });
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('done');

    act(() => options.onSlot(failed(options, 8, 'no-route')));
    expect(result.current.error).toBe('no-route');
    expect(result.current.status).toBe('error');
  });

  it('does not rerun for a new Place object at the same position', () => {
    const { rerender } = renderHook(
      ({ from }) => useDepartureEstimates({ from, to: work, start: at }),
      { initialProps: { from: home } },
    );

    rerender({ from: { ...home, position: { ...home.position, lat: 45.760001 } } });
    rerender({ from: { ...home } });

    expect(stream).toHaveBeenCalledTimes(1);
  });

  it('aborts the previous run and drops its stale state when the destination changes', () => {
    const { result, rerender } = renderHook(
      ({ to }) => useDepartureEstimates({ from: home, to, start: at }),
      { initialProps: { to: work } },
    );
    const first = lastRun();
    act(() => {
      first.options.onSlot(ready(first.options, 0));
    });

    rerender({ to: { ...work, id: 'x', position: { lat: 45.8, lon: 4.9 } } });

    expect(first.options.signal?.aborted).toBe(true);
    expect(stream).toHaveBeenCalledTimes(2);
    expect(lastRun().options.signal?.aborted).toBe(false);
    expect(result.current.slots.map((s) => s.status)).toEqual(Array(9).fill('loading'));
  });

  it('does not stamp updatedAt when an aborted run finishes late', async () => {
    const { result, rerender } = renderHook(
      ({ to }) => useDepartureEstimates({ from: home, to, start: at }),
      { initialProps: { to: work } },
    );
    const first = lastRun();

    rerender({ to: { ...work, id: 'x', position: { lat: 45.8, lon: 4.9 } } });
    await act(async () => {
      first.finish();
    });

    expect(result.current.updatedAt).toBeNull();
  });

  it('reruns when the chosen start time changes', () => {
    const { rerender } = renderHook(
      ({ start }) => useDepartureEstimates({ from: home, to: work, start }),
      { initialProps: { start: at } },
    );

    rerender({ start: { mode: 'at', at: new Date('2099-11-10T09:00:00+01:00') } });
    rerender({ start: now });

    expect(stream).toHaveBeenCalledTimes(3);
  });

  it('resolves a now start once per run, not per render', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T08:00:00Z'));
    const { result, rerender } = renderHook(() =>
      useDepartureEstimates({ from: home, to: work, start: { mode: 'now' } }),
    );
    const base = result.current.baseTime;

    vi.setSystemTime(new Date('2026-11-10T08:03:00Z'));
    rerender();

    expect(stream).toHaveBeenCalledTimes(1);
    expect(result.current.baseTime).toEqual(new Date('2026-11-10T08:00:00Z'));
    expect(result.current.baseTime).toBe(base);

    act(() => result.current.refresh());
    expect(result.current.baseTime).toEqual(new Date('2026-11-10T08:03:00Z'));
  });

  it('aborts the run on unmount', () => {
    const { unmount } = renderHook(() =>
      useDepartureEstimates({ from: home, to: work, start: at }),
    );
    const { options } = lastRun();

    unmount();

    expect(options.signal?.aborted).toBe(true);
  });

  it('does not start offline, then runs when the connection returns', () => {
    setOnline(false);
    const { result } = renderHook(() => useDepartureEstimates({ from: home, to: work, start: at }));

    expect(stream).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ slots: [], status: 'error', error: 'offline' });

    setOnline(true);

    expect(stream).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('loading');
  });

  it('keeps ready results and fails the unfinished ones when the connection drops mid-run', () => {
    const { result } = renderHook(() => useDepartureEstimates({ from: home, to: work, start: at }));
    const { options } = lastRun();
    act(() => {
      options.onSlot(ready(options, 0));
    });

    setOnline(false);

    expect(options.signal?.aborted).toBe(true);
    expect(stream).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe('offline');
    expect(result.current.status).toBe('error');
    expect(result.current.slots[0]?.status).toBe('ready');
    expect(result.current.slots[1]).toMatchObject({ status: 'error', kind: 'offline' });
    expect(result.current.summary?.best.slot.offsetMin).toBe(0);
  });

  it('keeps sample data while offline', () => {
    setOnline(false);
    const { result } = renderHook(() => useDepartureEstimates({ from: null, to: null, start: at }));

    expect(result.current.status).toBe('done');
    expect(result.current.error).toBeNull();
  });
});

describe('useDepartureEstimates under StrictMode', () => {
  it('aborts the mount-time run and completes with the surviving one', async () => {
    const { result } = renderHook(
      () => useDepartureEstimates({ from: home, to: work, start: at }),
      { wrapper: StrictMode },
    );

    const [discarded, surviving] = runs;
    expect(runs).toHaveLength(2);
    expect(discarded?.options.signal?.aborted).toBe(true);
    expect(surviving?.options.signal?.aborted).toBe(false);

    await act(async () => {
      discarded?.finish();
      for (let index = 0; index < 9; index += 1) {
        surviving?.options.onSlot(ready(surviving.options, index));
      }
      surviving?.finish();
    });

    expect(result.current.status).toBe('done');
    expect(result.current.error).toBeNull();
    expect(result.current.slots.every((state) => state.status === 'ready')).toBe(true);
    expect(result.current.updatedAt).not.toBeNull();
  });
});
