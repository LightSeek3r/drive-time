import { formatClock } from '../../format/time';
import { useT } from '../../i18n';
import { Icon } from '../Icon/Icon';
import styles from './StatusFooter.module.css';

interface StatusFooterProps {
  updatedAt: Date | null;
  /** Minutes live traffic adds to a typical trip right now; null or 0 hides the note. */
  adjustedByMin?: number | null;
  onRefresh: () => void;
}

export function StatusFooter({ updatedAt, adjustedByMin = null, onRefresh }: StatusFooterProps) {
  const t = useT();
  return (
    <footer className={styles.footer}>
      <p className={styles.note}>
        {t('estimated_from_traffic')}
        {updatedAt !== null && <> · {t('updated_time', { time: formatClock(updatedAt) })}</>}
        {adjustedByMin !== null && adjustedByMin !== 0 && (
          <span className={styles.adjusted}>
            {t('adjusted_note', {
              delta: adjustedByMin > 0 ? `+${adjustedByMin}` : `−${Math.abs(adjustedByMin)}`,
            })}
          </span>
        )}
      </p>
      <button type="button" className={styles.refresh} onClick={onRefresh}>
        <Icon name="refresh" size={16} />
        {t('refresh')}
      </button>
    </footer>
  );
}
