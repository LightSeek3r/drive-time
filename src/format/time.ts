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

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** The `YYYY-MM-DDTHH:mm` shape a datetime-local input reads and writes, in device time. */
export function toLocalInputValue(date: Date): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInputValue(value: string): Date | null {
  if (value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function nextQuarterHour(now: Date): Date {
  return new Date(Math.ceil(now.getTime() / QUARTER_MS) * QUARTER_MS);
}
