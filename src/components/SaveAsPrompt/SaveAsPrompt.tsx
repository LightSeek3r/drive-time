import type { SavedPlaceKey } from '../../domain/types';
import { useT } from '../../i18n';
import styles from './SaveAsPrompt.module.css';

const KEYS: readonly SavedPlaceKey[] = ['home', 'work'];

interface SaveAsPromptProps {
  onSave: (key: SavedPlaceKey) => void;
}

export function SaveAsPrompt({ onSave }: SaveAsPromptProps) {
  const t = useT();
  return (
    <div className={styles.prompt}>
      {KEYS.map((key) => (
        <button key={key} type="button" className={styles.save} onClick={() => onSave(key)}>
          {t('save_as', { name: t(key) })}
        </button>
      ))}
    </div>
  );
}
