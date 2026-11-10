import { useT } from '../../i18n';
import { Icon } from '../Icon/Icon';
import styles from './BrandBand.module.css';
import { RoadMark } from './RoadMark';

interface BrandBandProps {
  onOpenSettings: () => void;
}

export function BrandBand({ onOpenSettings }: BrandBandProps) {
  const t = useT();
  return (
    <header className={styles.band}>
      <h1 className={styles.brand}>
        <RoadMark />
        {t('appName')}
      </h1>
      <button type="button" className={styles.settings} onClick={onOpenSettings}>
        <Icon name="settings" size={22} />
        <span className="sr-only">{t('settings')}</span>
      </button>
    </header>
  );
}
