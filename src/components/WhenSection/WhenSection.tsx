import { useId, useRef } from 'react';
import type { StartTime } from '../../domain/types';
import {
  formatClock,
  formatDay,
  fromLocalInputValue,
  nextQuarterHour,
  toLocalInputValue,
} from '../../format/time';
import { useT } from '../../i18n';
import { Icon } from '../Icon/Icon';
import styles from './WhenSection.module.css';

interface WhenSectionProps {
  start: StartTime;
  now: Date;
  onChange: (start: StartTime) => void;
}

export function WhenSection({ start, now, onChange }: WhenSectionProps) {
  const t = useT();
  const groupName = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = start.mode === 'at' ? start.at : now;
  const pickerValue = toLocalInputValue(start.mode === 'at' ? start.at : nextQuarterHour(now));
  const dayLabel = formatDay(shown, now, { today: t('today'), tomorrow: t('tomorrow') });

  const openPicker = () => {
    const input = inputRef.current;
    if (input === null) return;
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.focus();
  };

  return (
    <section className={styles.when}>
      <fieldset className={styles.seg}>
        <legend className="sr-only">{t('when_legend')}</legend>
        <label className={styles.option}>
          <input
            type="radio"
            name={groupName}
            className={styles.radio}
            checked={start.mode === 'now'}
            onChange={() => onChange({ mode: 'now' })}
          />
          <span className={styles.optionText}>{t('now')}</span>
        </label>
        <label className={styles.option}>
          <input
            type="radio"
            name={groupName}
            className={styles.radio}
            checked={start.mode === 'at'}
            onChange={() => onChange({ mode: 'at', at: nextQuarterHour(now) })}
          />
          <span className={styles.optionText}>{t('leaveAt')}</span>
        </label>
      </fieldset>

      <div className={styles.time} data-active={start.mode === 'at'}>
        <Icon name="clock" size={16} className={styles.icon} />
        <span className={styles.value}>
          {dayLabel}, {formatClock(shown)}
        </span>
        <input
          ref={inputRef}
          type="datetime-local"
          className={styles.native}
          aria-label={t('when_input_label')}
          value={pickerValue}
          min={toLocalInputValue(now)}
          onChange={(event) => {
            const at = fromLocalInputValue(event.target.value);
            if (at !== null) onChange({ mode: 'at', at });
          }}
        />
        <button
          type="button"
          className={styles.change}
          onClick={openPicker}
          aria-label={t('when_change_label')}
        >
          <span className={styles.changeText}>{t('change')}</span>
          <Icon name="edit" size={18} className={styles.changeIcon} />
        </button>
      </div>
    </section>
  );
}
