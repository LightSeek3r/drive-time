import { describe, expect, it } from 'vitest';
import { addDays, ceilToStep, clockParts, dayOffset, formatDay, nextQuarterHour } from './time';

const labels = { today: 'Today', tomorrow: 'Tomorrow' };

describe('time format', () => {
  it('splits digits from the day period', () => {
    const parts = clockParts(new Date(2026, 10, 10, 9, 45));
    expect(parts.time).toMatch(/^0?9[:.]45$/);
  });

  it('labels today, tomorrow, then a dated day', () => {
    const now = new Date(2026, 10, 10, 9, 0);
    expect(formatDay(new Date(2026, 10, 10, 23, 0), now, labels)).toBe('Today');
    expect(formatDay(new Date(2026, 10, 11, 0, 5), now, labels)).toBe('Tomorrow');
    expect(formatDay(new Date(2026, 10, 14, 8, 0), now, labels)).not.toBe('Today');
  });

  it('rounds up to the next quarter hour', () => {
    expect(nextQuarterHour(new Date(2026, 10, 10, 7, 31)).getMinutes()).toBe(45);
    expect(nextQuarterHour(new Date(2026, 10, 10, 7, 45)).getMinutes()).toBe(45);
  });

  it('rounds up to a step boundary and drops the seconds', () => {
    const rounded = ceilToStep(new Date(2026, 10, 10, 7, 31, 20), 5);
    expect([rounded.getHours(), rounded.getMinutes(), rounded.getSeconds()]).toEqual([7, 35, 0]);
    expect(ceilToStep(new Date(2026, 10, 10, 7, 35), 5).getMinutes()).toBe(35);
  });

  it('counts calendar days regardless of the time of day', () => {
    const now = new Date(2026, 10, 10, 23, 50);
    expect(dayOffset(new Date(2026, 10, 11, 0, 5), now)).toBe(1);
    expect(dayOffset(new Date(2026, 10, 10, 0, 0), now)).toBe(0);
    expect(addDays(now, 3).getDate()).toBe(13);
  });
});
