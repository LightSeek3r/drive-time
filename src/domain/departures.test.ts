import { describe, expect, it } from 'vitest';
import {
  buildSlots,
  deltaMin,
  overageSec,
  resolveBase,
  summarise,
  toDisplayMinutes,
  toEstimate,
  toRfc3339,
  type DepartureSummary,
} from './departures';
import type { SlotEstimate } from './types';

function estimateAt(departAtIso: string, durationSec: number, offsetMin = 0): SlotEstimate {
  return toEstimate(
    { offsetMin, departAt: new Date(departAtIso) },
    { durationSec, freeFlowSec: durationSec, distanceM: 10_000 },
  );
}

/** Builds estimates for consecutive 15-min slots from 08:00 Paris time with the given durations. */
function series(durationsSec: number[]): SlotEstimate[] {
  const base = new Date('2026-11-10T08:00:00+01:00');
  return buildSlots(base, 15, durationsSec.length).map((slot, index) =>
    toEstimate(slot, {
      durationSec: durationsSec[index] ?? 0,
      freeFlowSec: 900,
      distanceM: 10_000,
    }),
  );
}

function readySummary(estimates: SlotEstimate[]): DepartureSummary {
  const summary = summarise(estimates);
  if (summary.best === undefined) throw new Error('expected a non-empty summary');
  return summary;
}

describe('test timezone', () => {
  it('runs in Europe/Paris so DST cases are deterministic', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Europe/Paris');
    expect(new Date('2026-01-15T12:00:00Z').getTimezoneOffset()).toBe(-60);
    expect(new Date('2026-07-15T12:00:00Z').getTimezoneOffset()).toBe(-120);
  });
});

describe('resolveBase', () => {
  const now = new Date('2026-11-10T08:07:30+01:00');

  it('uses now for mode "now"', () => {
    expect(resolveBase({ mode: 'now' }, now).getTime()).toBe(now.getTime());
  });

  it('keeps a future start time', () => {
    const at = new Date('2026-11-12T17:30:00+01:00');
    expect(resolveBase({ mode: 'at', at }, now).getTime()).toBe(at.getTime());
  });

  it('clamps a past start time to now', () => {
    const at = new Date('2026-11-10T07:00:00+01:00');
    expect(resolveBase({ mode: 'at', at }, now).getTime()).toBe(now.getTime());
  });

  it('returns a copy, never the caller’s Date instance', () => {
    const at = new Date('2026-11-12T17:30:00+01:00');
    expect(resolveBase({ mode: 'at', at }, now)).not.toBe(at);
    expect(resolveBase({ mode: 'now' }, now)).not.toBe(now);
  });
});

describe('buildSlots', () => {
  it('builds 9 slots 15 minutes apart by default', () => {
    const base = new Date('2026-11-10T08:00:00+01:00');
    const slots = buildSlots(base);
    expect(slots.map((s) => s.offsetMin)).toEqual([0, 15, 30, 45, 60, 75, 90, 105, 120]);
    expect(slots.map((s) => toRfc3339(s.departAt))).toEqual([
      '2026-11-10T08:00:00+01:00',
      '2026-11-10T08:15:00+01:00',
      '2026-11-10T08:30:00+01:00',
      '2026-11-10T08:45:00+01:00',
      '2026-11-10T09:00:00+01:00',
      '2026-11-10T09:15:00+01:00',
      '2026-11-10T09:30:00+01:00',
      '2026-11-10T09:45:00+01:00',
      '2026-11-10T10:00:00+01:00',
    ]);
  });

  it('honours custom step and count', () => {
    const slots = buildSlots(new Date('2026-11-10T08:00:00Z'), 10, 3);
    expect(slots.map((s) => s.departAt.toISOString())).toEqual([
      '2026-11-10T08:00:00.000Z',
      '2026-11-10T08:10:00.000Z',
      '2026-11-10T08:20:00.000Z',
    ]);
  });

  it('keeps absolute 15-minute spacing across spring-forward (2026-03-29, 02:00 -> 03:00)', () => {
    const slots = buildSlots(new Date('2026-03-29T01:30:00+01:00'));
    const gaps = slots.slice(1).map((s, i) => s.departAt.getTime() - slots[i]!.departAt.getTime());
    expect(new Set(gaps)).toEqual(new Set([15 * 60_000]));
    expect(slots.slice(0, 4).map((s) => toRfc3339(s.departAt))).toEqual([
      '2026-03-29T01:30:00+01:00',
      '2026-03-29T01:45:00+01:00',
      '2026-03-29T03:00:00+02:00',
      '2026-03-29T03:15:00+02:00',
    ]);
    expect(toRfc3339(slots[8]!.departAt)).toBe('2026-03-29T04:30:00+02:00');
  });

  it('keeps absolute 15-minute spacing across fall-back (2026-10-25, 03:00 -> 02:00)', () => {
    const slots = buildSlots(new Date('2026-10-25T02:00:00+02:00'));
    expect(slots.map((s) => toRfc3339(s.departAt))).toEqual([
      '2026-10-25T02:00:00+02:00',
      '2026-10-25T02:15:00+02:00',
      '2026-10-25T02:30:00+02:00',
      '2026-10-25T02:45:00+02:00',
      '2026-10-25T02:00:00+01:00',
      '2026-10-25T02:15:00+01:00',
      '2026-10-25T02:30:00+01:00',
      '2026-10-25T02:45:00+01:00',
      '2026-10-25T03:00:00+01:00',
    ]);
  });

  it('rolls over midnight into the next day', () => {
    const slots = buildSlots(new Date('2026-11-10T23:30:00+01:00'));
    expect(toRfc3339(slots[2]!.departAt)).toBe('2026-11-11T00:00:00+01:00');
    expect(toRfc3339(slots[8]!.departAt)).toBe('2026-11-11T01:30:00+01:00');
  });

  it('returns an empty list for count 0', () => {
    expect(buildSlots(new Date(), 15, 0)).toEqual([]);
  });
});

describe('toRfc3339', () => {
  it('formats with the local offset and seconds, no milliseconds', () => {
    expect(toRfc3339(new Date('2026-11-10T07:15:09.987Z'))).toBe('2026-11-10T08:15:09+01:00');
  });

  it('uses the summer offset in summer', () => {
    expect(toRfc3339(new Date('2026-07-01T06:00:00Z'))).toBe('2026-07-01T08:00:00+02:00');
  });

  it('rolls the local date at New Year', () => {
    expect(toRfc3339(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01T00:30:00+01:00');
  });

  it('rejects an invalid date instead of emitting "NaN"', () => {
    expect(() => toRfc3339(new Date('nope'))).toThrow(RangeError);
  });
});

describe('toEstimate', () => {
  it('computes arriveAt = departAt + duration and keeps the route fields', () => {
    const estimate = estimateAt('2026-11-10T08:00:00+01:00', 1_530);
    expect(toRfc3339(estimate.arriveAt)).toBe('2026-11-10T08:25:30+01:00');
    expect(estimate).toMatchObject({ durationSec: 1_530, freeFlowSec: 1_530, distanceM: 10_000 });
  });

  it('computes arrival across fall-back on absolute time', () => {
    const estimate = estimateAt('2026-10-25T02:45:00+02:00', 30 * 60);
    expect(toRfc3339(estimate.arriveAt)).toBe('2026-10-25T02:15:00+01:00');
  });
});

describe('toDisplayMinutes (rounding rule)', () => {
  it('rounds to the nearest minute, half up', () => {
    expect(toDisplayMinutes(29 * 60 + 29)).toBe(29);
    expect(toDisplayMinutes(29 * 60 + 30)).toBe(30);
    expect(toDisplayMinutes(90)).toBe(2);
  });

  it('never shows 0 min for a real trip', () => {
    expect(toDisplayMinutes(20)).toBe(1);
    expect(toDisplayMinutes(0)).toBe(0);
  });
});

describe('summarise', () => {
  it('returns an undefined best for no estimates', () => {
    expect(summarise([]).best).toBeUndefined();
  });

  it('treats a single estimate as best and first', () => {
    const [only] = series([1_200]);
    const summary = summarise([only!]);
    expect(summary).toEqual({
      best: only,
      first: only,
      peak: undefined,
      bestIsFirst: true,
      savedVsFirstMin: 0,
    });
  });

  it('picks the fastest slot and the minutes it saves over the first', () => {
    const estimates = series([30 * 60, 34 * 60, 25 * 60 + 10, 27 * 60]);
    const summary = readySummary(estimates);
    expect(summary.best.slot.offsetMin).toBe(30);
    expect(summary.first.slot.offsetMin).toBe(0);
    expect(summary.bestIsFirst).toBe(false);
    expect(summary.savedVsFirstMin).toBe(5);
    expect(summary.peak?.slot.offsetMin).toBe(15);
  });

  it('breaks ties on displayed minutes toward the earliest departure', () => {
    // 25:10 and 24:50 both display as 25 min, so the earlier slot wins.
    const summary = summarise(series([30 * 60, 25 * 60 + 10, 24 * 60 + 50]));
    expect(summary.best?.slot.offsetMin).toBe(15);
  });

  it('says best is first when no slot beats it by a displayed minute', () => {
    // 20 s faster would round to "0 min faster"; the first slot stays best instead.
    const summary = readySummary(series([20 * 60 + 10, 19 * 60 + 50, 21 * 60]));
    expect(summary.bestIsFirst).toBe(true);
    expect(summary.best).toBe(summary.first);
    expect(summary.savedVsFirstMin).toBe(0);
  });

  it('omits the peak unless it is at least 2 displayed minutes slower than best', () => {
    expect(readySummary(series([20 * 60, 21 * 60, 20 * 60])).peak).toBeUndefined();
    expect(readySummary(series([20 * 60, 22 * 60, 20 * 60])).peak?.slot.offsetMin).toBe(15);
  });

  it('does not depend on input order (estimates stream in as they settle)', () => {
    const estimates = series([30 * 60, 34 * 60, 25 * 60]);
    const summary = readySummary([...estimates].reverse());
    expect(summary.best.slot.offsetMin).toBe(30);
    expect(summary.first.slot.offsetMin).toBe(0);
  });

  it('uses the earliest ready slot as first when slot 0 is missing', () => {
    const [, second, third] = series([0, 22 * 60, 20 * 60]);
    const summary = readySummary([third!, second!]);
    expect(summary.first).toBe(second);
    expect(summary.savedVsFirstMin).toBe(2);
  });
});

describe('deltaMin and overageSec', () => {
  const [first, slower, faster, sameMinute] = series([
    20 * 60,
    23 * 60 + 40,
    18 * 60,
    18 * 60 + 25,
  ]);

  it('reports displayed-minute differences against the first slot', () => {
    expect(deltaMin(slower!, first!)).toBe(4);
    expect(deltaMin(faster!, first!)).toBe(-2);
    expect(deltaMin(first!, first!)).toBe(0);
  });

  it('reports raw overhang seconds beyond best, 0 within the same displayed minute', () => {
    expect(overageSec(slower!, faster!)).toBe(5 * 60 + 40);
    expect(overageSec(faster!, faster!)).toBe(0);
    expect(overageSec(sameMinute!, faster!)).toBe(0);
  });
});
