import type { DepartureSlot, RouteEstimate, SlotEstimate, StartTime } from './types';

const MINUTE_MS = 60_000;
const PEAK_THRESHOLD_MIN = 2;

export function resolveBase(start: StartTime, now: Date): Date {
  if (start.mode === 'now' || start.at.getTime() < now.getTime()) {
    return new Date(now.getTime());
  }
  return new Date(start.at.getTime());
}

/** Slots are absolute instants (base + n·step), so a DST change inside the window shifts wall-clock labels, not spacing. */
export function buildSlots(base: Date, stepMin = 15, count = 9): DepartureSlot[] {
  return Array.from({ length: count }, (_, index) => {
    const offsetMin = index * stepMin;
    return { offsetMin, departAt: new Date(base.getTime() + offsetMin * MINUTE_MS) };
  });
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, '0');
}

/** RFC 3339 in the device's local time, with the offset in force at that instant. */
export function toRfc3339(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('toRfc3339: invalid date');
  }
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMin);
  const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${day}T${time}${sign}${pad(Math.floor(absOffset / 60))}:${pad(absOffset % 60)}`;
}

export function toEstimate(slot: DepartureSlot, route: RouteEstimate): SlotEstimate {
  return {
    ...route,
    slot,
    arriveAt: new Date(slot.departAt.getTime() + route.durationSec * 1000),
  };
}

/**
 * Minutes as displayed: nearest minute (half rounds up), never 0 for a non-zero trip.
 * Every comparison below works on these displayed minutes so the UI's numbers always add up.
 */
export function toDisplayMinutes(seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.max(1, Math.round(seconds / 60));
}

/** Displayed-minute difference; positive means `estimate` is slower than `first`. */
export function deltaMin(estimate: SlotEstimate, first: SlotEstimate): number {
  return toDisplayMinutes(estimate.durationSec) - toDisplayMinutes(first.durationSec);
}

/** Seconds slower than `best`, for the overhang bar; 0 when the displayed minutes are equal. */
export function overageSec(estimate: SlotEstimate, best: SlotEstimate): number {
  if (toDisplayMinutes(estimate.durationSec) <= toDisplayMinutes(best.durationSec)) return 0;
  return estimate.durationSec - best.durationSec;
}

export interface EmptySummary {
  best: undefined;
}

export interface DepartureSummary {
  /** Fastest displayed duration; ties go to the earliest departure. */
  best: SlotEstimate;
  /** Earliest departure among the estimates. */
  first: SlotEstimate;
  /** Slowest slot, only when it is at least 2 displayed minutes slower than `best`. */
  peak: SlotEstimate | undefined;
  /** True when no later slot beats the first one: the UI says "leave now / at start". */
  bestIsFirst: boolean;
  /** Displayed minutes `best` saves against `first`; 0 when `bestIsFirst`. */
  savedVsFirstMin: number;
}

export function summarise(estimates: readonly SlotEstimate[]): DepartureSummary | EmptySummary {
  const byDeparture = [...estimates].sort(
    (a, b) => a.slot.departAt.getTime() - b.slot.departAt.getTime(),
  );
  const first = byDeparture[0];
  if (first === undefined) return { best: undefined };

  let best = first;
  let slowest = first;
  for (const estimate of byDeparture) {
    const minutes = toDisplayMinutes(estimate.durationSec);
    if (minutes < toDisplayMinutes(best.durationSec)) best = estimate;
    if (minutes > toDisplayMinutes(slowest.durationSec)) slowest = estimate;
  }

  return {
    best,
    first,
    peak: deltaMin(slowest, best) >= PEAK_THRESHOLD_MIN ? slowest : undefined,
    bestIsFirst: best === first,
    savedVsFirstMin: deltaMin(first, best),
  };
}
