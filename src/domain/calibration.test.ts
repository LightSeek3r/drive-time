import { describe, expect, it } from 'vitest';
import { calibrate } from './calibration';
import { buildSlots, toEstimate } from './departures';
import type { RouteEstimate } from './types';

const NOW = new Date('2026-11-10T08:00:00Z');

function estimates(
  base: Date,
  route: (offsetMin: number) => Partial<RouteEstimate>,
  step = 15,
  count = 9,
) {
  return buildSlots(base, step, count).map((slot) =>
    toEstimate(slot, {
      durationSec: 1200,
      freeFlowSec: 900,
      distanceM: 10_000,
      historicSec: 1200,
      liveSec: 1200,
      ...route(slot.offsetMin),
    }),
  );
}

describe('calibrate', () => {
  it('leaves everything alone when live matches typical', () => {
    const result = calibrate(
      estimates(NOW, () => ({})),
      NOW,
    );
    expect(result.nowDeltaMin).toBe(0);
    expect(result.estimates.map((e) => e.durationSec)).toEqual(Array(9).fill(1200));
  });

  it('applies the full live ratio now and fades it for later departures', () => {
    const result = calibrate(
      estimates(NOW, (m) => (m === 0 ? { liveSec: 1800 } : {})),
      NOW,
    );
    const [first, , third, , fifth, , , , last] = result.estimates;
    expect(first?.durationSec).toBeCloseTo(1800);
    expect(result.nowDeltaMin).toBe(10);
    // 30 min ahead: 1200 * (1 + 0.5 * e^-0.5)
    expect(third?.durationSec).toBeCloseTo(1200 * (1 + 0.5 * Math.exp(-0.5)));
    expect(fifth?.durationSec).toBeLessThan(third?.durationSec ?? 0);
    expect(last?.durationSec).toBeGreaterThan(1200);
    expect(first?.adjusted).toBe(true);
  });

  it('works downwards when roads are clearer than usual', () => {
    const result = calibrate(
      estimates(NOW, (m) => (m === 0 ? { liveSec: 1000 } : {})),
      NOW,
    );
    expect(result.estimates[0]?.durationSec).toBeCloseTo(1000);
    expect(result.nowDeltaMin).toBe(-3);
  });

  it('clamps an extreme ratio', () => {
    const high = calibrate(
      estimates(NOW, (m) => (m === 0 ? { liveSec: 12_000 } : {})),
      NOW,
    );
    expect(high.estimates[0]?.durationSec).toBeCloseTo(1200 * 2.5);
    const low = calibrate(
      estimates(NOW, (m) => (m === 0 ? { liveSec: 10 } : {})),
      NOW,
    );
    expect(low.estimates[0]?.durationSec).toBeCloseTo(1200 * 0.7);
  });

  it('starts from historic, not from the blended duration', () => {
    const result = calibrate(
      estimates(NOW, (m) => ({ durationSec: 1500, ...(m === 0 ? { liveSec: 1500 } : {}) })),
      NOW,
    );
    // ratio 1.25 at t=0 on historic 1200 = 1500, not 1500 * 1.25.
    expect(result.estimates[0]?.durationSec).toBeCloseTo(1500);
  });

  it('recomputes the arrival from the adjusted duration', () => {
    const result = calibrate(
      estimates(NOW, (m) => (m === 0 ? { liveSec: 1800 } : {})),
      NOW,
    );
    const first = result.estimates[0];
    expect(first?.arriveAt.getTime()).toBe(NOW.getTime() + 1800 * 1000);
  });

  it('does nothing when the start is far from now', () => {
    const later = new Date(NOW.getTime() + 60 * 60_000);
    const input = estimates(later, (m) => (m === 0 ? { liveSec: 1800 } : {}));
    const result = calibrate(input, NOW);
    expect(result.nowDeltaMin).toBeNull();
    expect(result.estimates).toEqual(input);
  });

  it('anchors a start a few minutes ahead', () => {
    const soon = new Date(NOW.getTime() + 5 * 60_000);
    const result = calibrate(
      estimates(soon, (m) => (m === 0 ? { liveSec: 1800 } : {})),
      NOW,
    );
    expect(result.nowDeltaMin).toBe(10);
    expect(result.estimates[0]?.durationSec).toBeLessThan(1800);
  });

  it('does nothing without live or historic figures', () => {
    const input = estimates(NOW, () => ({ historicSec: undefined }));
    expect(calibrate(input, NOW).nowDeltaMin).toBeNull();
    const noLive = estimates(NOW, () => ({ liveSec: undefined }));
    expect(calibrate(noLive, NOW).nowDeltaMin).toBeNull();
  });

  it('keeps a row without a historic figure as it was', () => {
    const input = estimates(NOW, (m) =>
      m === 0 ? { liveSec: 1800 } : m === 15 ? { historicSec: undefined, durationSec: 1234 } : {},
    );
    const row = calibrate(input, NOW).estimates[1];
    expect(row?.durationSec).toBe(1234);
    expect(row?.adjusted).toBeUndefined();
  });

  it('handles an empty list', () => {
    expect(calibrate([], NOW)).toEqual({ estimates: [], nowDeltaMin: null });
  });
});
