import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './Banner.module.css';

export type BannerTone = 'info' | 'warning' | 'error';

interface BannerAction {
  label: string;
  onClick: () => void;
}

interface BannerProps {
  tone: BannerTone;
  icon: IconName;
  /** Omit for static notices; only messages that appear on their own should be live. */
  role?: 'status' | 'alert';
  children: ReactNode;
  action?: BannerAction;
}

export function Banner({ tone, icon, role, children, action }: BannerProps) {
  return (
    <div className={`${styles.banner} ${styles[tone]}`} role={role}>
      <Icon name={icon} size={20} className={styles.icon} />
      <p className={styles.text}>{children}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
