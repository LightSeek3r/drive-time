/** Departure window: how far ahead the list reaches and how finely it is sampled. */
export interface DepartureWindow {
  /** Length in minutes. */
  span: number;
  /** Minutes between two departures. */
  step: number;
}

export const SPAN_OPTIONS: readonly number[] = [120, 180, 240];
export const STEP_OPTIONS: readonly number[] = [5, 10, 15, 30];
export const DEFAULT_WINDOW: DepartureWindow = { span: 180, step: 10 };
// Each row is one TomTom routing call on a free quota; also keeps the list a scroll, not a wall.
export const MAX_SLOTS = 25;

/** Rows in the window, first departure included. */
export function slotCount({ span, step }: DepartureWindow): number {
  return Math.floor(span / step) + 1;
}

export function isValidWindow(window: DepartureWindow): boolean {
  return (
    SPAN_OPTIONS.includes(window.span) &&
    STEP_OPTIONS.includes(window.step) &&
    slotCount(window) <= MAX_SLOTS
  );
}

/** A new step wins; the span shrinks to the longest one that still fits under the row cap. */
export function withStep(window: DepartureWindow, step: number): DepartureWindow {
  const span = [...SPAN_OPTIONS]
    .reverse()
    .find(
      (candidate) => candidate <= window.span && slotCount({ span: candidate, step }) <= MAX_SLOTS,
    );
  return { span: span ?? Math.min(...SPAN_OPTIONS), step };
}

/** A new span wins; the step grows to the finest one that still fits under the row cap. */
export function withSpan(window: DepartureWindow, span: number): DepartureWindow {
  const step = STEP_OPTIONS.find(
    (candidate) => candidate >= window.step && slotCount({ span, step: candidate }) <= MAX_SLOTS,
  );
  return { span, step: step ?? Math.max(...STEP_OPTIONS) };
}
