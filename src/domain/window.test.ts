import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WINDOW,
  MAX_SLOTS,
  SPAN_OPTIONS,
  STEP_OPTIONS,
  isValidWindow,
  slotCount,
  withSpan,
  withStep,
} from './window';

describe('window', () => {
  it('counts the first departure too', () => {
    expect(slotCount({ span: 120, step: 15 })).toBe(9);
    expect(slotCount(DEFAULT_WINDOW)).toBe(19);
  });

  it('accepts the default and rejects too many rows or unknown values', () => {
    expect(isValidWindow(DEFAULT_WINDOW)).toBe(true);
    expect(isValidWindow({ span: 180, step: 5 })).toBe(false);
    expect(isValidWindow({ span: 90, step: 10 })).toBe(false);
    expect(isValidWindow({ span: 180, step: 7 })).toBe(false);
  });

  it('every offered pair that passes stays within the cap', () => {
    for (const span of SPAN_OPTIONS) {
      for (const step of STEP_OPTIONS) {
        if (isValidWindow({ span, step }))
          expect(slotCount({ span, step })).toBeLessThanOrEqual(MAX_SLOTS);
      }
    }
  });

  it('withStep shrinks the span when the step is too fine for it', () => {
    expect(withStep({ span: 240, step: 15 }, 5)).toEqual({ span: 120, step: 5 });
    expect(withStep({ span: 180, step: 10 }, 15)).toEqual({ span: 180, step: 15 });
  });

  it('withSpan coarsens the step when the span is too long for it', () => {
    expect(withSpan({ span: 120, step: 5 }, 180)).toEqual({ span: 180, step: 10 });
    expect(withSpan({ span: 120, step: 5 }, 240)).toEqual({ span: 240, step: 10 });
    expect(withSpan({ span: 180, step: 10 }, 120)).toEqual({ span: 120, step: 10 });
  });

  it('always lands on a valid window', () => {
    for (const span of SPAN_OPTIONS) {
      for (const step of STEP_OPTIONS) {
        expect(isValidWindow(withStep({ span, step: 15 }, step))).toBe(true);
        expect(isValidWindow(withSpan({ span: 120, step }, span))).toBe(true);
      }
    }
  });
});
