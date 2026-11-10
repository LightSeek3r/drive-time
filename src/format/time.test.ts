import { describe, expect, it } from 'vitest';
import {
  clockParts,
  formatDay,
  fromLocalInputValue,
  nextQuarterHour,
  toLocalInputValue,
} from './time';

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

  it('round-trips the datetime-local value in device time', () => {
    const date = new Date(2026, 10, 12, 7, 45);
    expect(toLocalInputValue(date)).toBe('2026-11-12T07:45');
    expect(fromLocalInputValue('2026-11-12T07:45')?.getTime()).toBe(date.getTime());
    expect(fromLocalInputValue('')).toBeNull();
  });

  it('rounds up to the next quarter hour', () => {
    expect(nextQuarterHour(new Date(2026, 10, 10, 7, 31)).getMinutes()).toBe(45);
    expect(nextQuarterHour(new Date(2026, 10, 10, 7, 45)).getMinutes()).toBe(45);
  });
});
