const QUARTER_MS = 15 * 60_000;

export interface ClockParts {
  time: string;
  period: string;
}

const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

/** Device-locale clock text split so a 12-hour period (AM/PM) can be set smaller than the digits. */
export function clockParts(date: Date): ClockParts {
  const parts = clockFormat.formatToParts(date);
  const period = parts.find((part) => part.type === 'dayPeriod')?.value ?? '';
  const time = parts
    .filter((part) => part.type !== 'dayPeriod')
    .map((part) => part.value)
    .join('')
    .trim();
  return { time, period };
}

export function formatClock(date: Date): string {
  const { time, period } = clockParts(date);
  return period === '' ? time : `${time} ${period}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const DAY_MS = 86_400_000;

export interface DayLabels {
  today: string;
  tomorrow: string;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export function formatDay(date: Date, now: Date, labels: DayLabels): string {
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
  if (dayDiff === 0) return labels.today;
  if (dayDiff === 1) return labels.tomorrow;
  return dateFormat.format(date);
}

const hourFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

/** The hour as the device locale writes it ("8 AM", "08"), for a picker column. */
export function formatHour(hour: number): string {
  return hourFormat.format(new Date(2000, 0, 1, hour));
}

export function formatWeekday(date: Date): string {
  return weekdayFormat.format(date);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole calendar days from `from` to `date`, ignoring the time of day. */
export function dayOffset(date: Date, from: Date): number {
  return Math.round((startOfDay(date) - startOfDay(from)) / DAY_MS);
}

/** `date` rounded up to the next `stepMin` boundary, seconds dropped. */
export function ceilToStep(date: Date, stepMin: number): Date {
  const step = stepMin * 60_000;
  return new Date(Math.ceil(date.getTime() / step) * step);
}

export function nextQuarterHour(now: Date): Date {
  return new Date(Math.ceil(now.getTime() / QUARTER_MS) * QUARTER_MS);
}
