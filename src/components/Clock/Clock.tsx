import { clockParts } from '../../format/time';
import { toRfc3339 } from '../../domain/departures';
import styles from './Clock.module.css';

interface ClockProps {
  date: Date;
}

/** Device-locale time with the 12-hour period set small, so columns of times keep their grid. */
export function Clock({ date }: ClockProps) {
  const { time, period } = clockParts(date);
  return (
    <time dateTime={toRfc3339(date)}>
      {time}
      {period !== '' && <span className={styles.period}>{period}</span>}
    </time>
  );
}
