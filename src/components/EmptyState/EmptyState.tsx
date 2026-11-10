import { useT } from '../../i18n';
import { RoadMark } from '../BrandBand/RoadMark';
import styles from './EmptyState.module.css';

export function EmptyState() {
  const t = useT();
  return (
    <div className={styles.empty}>
      <RoadMark />
      <p className={styles.text}>{t('empty_route')}</p>
    </div>
  );
}
