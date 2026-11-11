import { useId, useState } from 'react';
import type { StartTime } from '../../domain/types';
import { formatClock, formatDay, nextQuarterHour } from '../../format/time';
import { useT } from '../../i18n';
import { Icon } from '../Icon/Icon';
import { TimePickerSheet } from '../TimePickerSheet/TimePickerSheet';
import styles from './WhenSection.module.css';

interface WhenSectionProps {
  start: StartTime;
  now: Date;
  onChange: (start: StartTime) => void;
}

export function WhenSection({ start, now, onChange }: WhenSectionProps) {
  const t = useT();
  const groupName = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const shown = start.mode === 'at' ? start.at : now;
  const dayLabel = formatDay(shown, now, { today: t('today'), tomorrow: t('tomorrow') });

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
            onChange={() => {
              onChange({ mode: 'at', at: nextQuarterHour(now) });
              setPickerOpen(true);
            }}
          />
          <span className={styles.optionText}>{t('leaveAt')}</span>
        </label>
      </fieldset>

      <button
        type="button"
        className={styles.time}
        data-active={start.mode === 'at'}
        aria-haspopup="dialog"
        aria-label={t('when_change_label')}
        onClick={() => setPickerOpen(true)}
      >
        <Icon name="clock" size={16} className={styles.icon} />
        <span className={styles.value}>
          {dayLabel}, {formatClock(shown)}
        </span>
        <Icon name="edit" size={16} className={styles.edit} />
      </button>

      <TimePickerSheet
        open={pickerOpen}
        now={now}
        initial={start.mode === 'at' ? start.at : nextQuarterHour(now)}
        onApply={(at) => {
          onChange({ mode: 'at', at });
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  );
}
