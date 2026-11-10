import { formatClock } from '../../format/time';
import { useT } from '../../i18n';
import { Icon } from '../Icon/Icon';
import styles from './StatusFooter.module.css';

interface StatusFooterProps {
  updatedAt: Date | null;
  onRefresh: () => void;
}

export function StatusFooter({ updatedAt, onRefresh }: StatusFooterProps) {
  const t = useT();
  return (
    <footer className={styles.footer}>
      <p className={styles.note}>
        {t('estimated_from_traffic')}
        {updatedAt !== null && <> · {t('updated_time', { time: formatClock(updatedAt) })}</>}
      </p>
      <button type="button" className={styles.refresh} onClick={onRefresh}>
        <Icon name="refresh" size={16} />
        {t('refresh')}
      </button>
    </footer>
  );
}
