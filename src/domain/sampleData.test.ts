import { toDisplayMinutes, summarise } from './departures';
import { sampleEstimates } from './sampleData';

const base = new Date('2026-11-10T08:00:00+01:00');

describe('sampleEstimates', () => {
  it('returns nine slots 15 minutes apart starting at base', () => {
    const estimates = sampleEstimates(base);

    expect(estimates).toHaveLength(9);
    expect(estimates.map((e) => e.slot.offsetMin)).toEqual([0, 15, 30, 45, 60, 75, 90, 105, 120]);
    expect(estimates[0]?.slot.departAt).toEqual(base);
    expect(estimates.map((e) => toDisplayMinutes(e.durationSec))).toEqual([
      33, 37, 42, 40, 36, 32, 30, 29, 27,
    ]);
  });

  it('covers a wider, finer window along the same curve', () => {
    const estimates = sampleEstimates(base, 10, 19);

    expect(estimates).toHaveLength(19);
    expect(estimates[18]?.slot.offsetMin).toBe(180);
    expect(toDisplayMinutes(estimates[0]?.durationSec ?? 0)).toBe(33);
    // 30 min is a knot of the 15-min curve, so a 10-min grid hits it exactly.
    expect(toDisplayMinutes(estimates[3]?.durationSec ?? 0)).toBe(42);
    expect(toDisplayMinutes(estimates[18]?.durationSec ?? 0)).toBe(25);
    const summary = summarise(estimates);
    // Rounded to whole minutes the curve is flat at 25 from 165 min on; ties go to the earliest.
    expect(summary.best?.slot.offsetMin).toBe(170);
  });

  it('is deterministic for the same base', () => {
    expect(sampleEstimates(base)).toEqual(sampleEstimates(new Date(base.getTime())));
  });

  it('summarises to best = 9th slot, peak = 3rd, 6 minutes saved', () => {
    const estimates = sampleEstimates(base);
    const summary = summarise(estimates);

    expect(summary.best).toBe(estimates[8]);
    if (summary.best === undefined) throw new Error('expected a summary');
    expect(summary.peak).toBe(estimates[2]);
    expect(summary.bestIsFirst).toBe(false);
    expect(summary.savedVsFirstMin).toBe(6);
  });
});
