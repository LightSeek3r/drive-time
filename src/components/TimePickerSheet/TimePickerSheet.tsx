import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  addDays,
  ceilToStep,
  dayOffset,
  formatClock,
  formatDay,
  formatHour,
  formatWeekday,
} from '../../format/time';
import { useT } from '../../i18n';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Sheet } from '../Sheet/Sheet';
import styles from './TimePickerSheet.module.css';

// deliberate: the furthest departAt TomTom accepts is unverified (PRODUCT.md), so the window is one constant.
const DAY_COUNT = 7;
const MINUTE_STEP = 5;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => index * MINUTE_STEP);

interface TimePickerSheetProps {
  open: boolean;
  now: Date;
  /** The time the picker opens on; clamped into the pickable window. */
  initial: Date;
  onApply: (at: Date) => void;
  onClose: () => void;
}

function withTime(day: Date, hour: number, minute: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}

interface ColumnProps {
  legend: string;
  /** Re-centres the chosen entry when it changes. */
  selectedKey: string;
  children: ReactNode;
}

/** A scrolling radio list: native arrow-key selection, with the chosen entry kept in view. */
function Column({ legend, selectedKey, children }: ColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const chosen = list?.querySelector<HTMLElement>('[data-chosen="true"]');
    if (list === null || chosen === null || chosen === undefined) return;
    list.scrollTop = chosen.offsetTop - (list.clientHeight - chosen.offsetHeight) / 2;
  }, [selectedKey]);

  return (
    <fieldset className={styles.column}>
      <legend className={styles.legend}>{legend}</legend>
      <div ref={listRef} className={styles.list}>
        {children}
      </div>
    </fieldset>
  );
}

interface PickerFormProps {
  titleId: string;
  now: Date;
  initial: Date;
  onApply: (at: Date) => void;
  onClose: () => void;
}

function PickerForm({ titleId, now, initial, onApply, onClose }: PickerFormProps) {
  const t = useT();
  const name = useId();
  const earliest = ceilToStep(now, MINUTE_STEP);
  const [selected, setSelected] = useState<Date>(() =>
    initial < earliest || dayOffset(initial, now) >= DAY_COUNT ? earliest : initial,
  );

  const days = Array.from({ length: DAY_COUNT }, (_, index) => addDays(now, index));
  const chosenDay = days[dayOffset(selected, now)] ?? days[0] ?? now;
  const hour = selected.getHours();
  const minute = selected.getMinutes();
  const isPast = (candidate: Date) => candidate < earliest;
  const labels = { today: t('today'), tomorrow: t('tomorrow') };

  // Moving to a slot that has already passed lands on the earliest one instead of being refused.
  const choose = (candidate: Date) => setSelected(isPast(candidate) ? earliest : candidate);

  const dayLabel = (day: Date, index: number) =>
    index === 0 ? labels.today : index === 1 ? labels.tomorrow : formatWeekday(day);

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onApply(selected);
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {t('when_input_label')}
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          <Icon name="close" size={22} />
          <span className="sr-only">{t('settings_close')}</span>
        </button>
      </div>

      <fieldset className={styles.days}>
        <legend className="sr-only">{t('pick_day')}</legend>
        {days.map((day, index) => (
          <label key={day.getTime()} className={styles.day}>
            <input
              type="radio"
              name={`${name}-day`}
              className={styles.radio}
              checked={day.getTime() === chosenDay.getTime()}
              onChange={() => choose(withTime(day, hour, minute))}
            />
            <span className={styles.dayText}>
              <span className={styles.dayName}>{dayLabel(day, index)}</span>
              <span className={styles.dayNumber}>{day.getDate()}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className={styles.time}>
        <Column legend={t('pick_hour')} selectedKey={String(hour)}>
          {HOURS.map((value) => (
            <label key={value} className={styles.entry} data-chosen={value === hour}>
              <input
                type="radio"
                name={`${name}-hour`}
                className={styles.radio}
                checked={value === hour}
                disabled={isPast(withTime(chosenDay, value, 55))}
                onChange={() => choose(withTime(chosenDay, value, minute))}
              />
              <span className={styles.entryText}>{formatHour(value)}</span>
            </label>
          ))}
        </Column>
        <Column legend={t('pick_minute')} selectedKey={String(minute)}>
          {MINUTES.map((value) => (
            <label key={value} className={styles.entry} data-chosen={value === minute}>
              <input
                type="radio"
                name={`${name}-minute`}
                className={styles.radio}
                checked={value === minute}
                disabled={isPast(withTime(chosenDay, hour, value))}
                onChange={() => choose(withTime(chosenDay, hour, value))}
              />
              <span className={styles.entryText}>{String(value).padStart(2, '0')}</span>
            </label>
          ))}
        </Column>
      </div>

      <p className={styles.preview} aria-live="polite">
        {formatDay(selected, now, labels)}, {formatClock(selected)}
      </p>

      <div className={styles.actions}>
        <Button variant="quiet" onClick={onClose}>
          {t('pick_cancel')}
        </Button>
        <Button type="submit">{t('pick_set')}</Button>
      </div>
    </form>
  );
}

export function TimePickerSheet({ open, now, initial, onApply, onClose }: TimePickerSheetProps) {
  const titleId = useId();
  return (
    <Sheet open={open} onClose={onClose} titleId={titleId}>
      <PickerForm
        titleId={titleId}
        now={now}
        initial={initial}
        onApply={onApply}
        onClose={onClose}
      />
    </Sheet>
  );
}
