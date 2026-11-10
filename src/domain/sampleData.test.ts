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
