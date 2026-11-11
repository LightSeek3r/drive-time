import { useId, useState } from 'react';
import type { Lang, Settings } from '../../domain/types';
import { useT } from '../../i18n';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Sheet } from '../Sheet/Sheet';
import styles from './SettingsSheet.module.css';

const LANGUAGES: ReadonlyArray<{ value: Lang; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

interface SettingsSheetProps {
  open: boolean;
  settings: Settings;
  onSave: (next: Settings) => void;
  onClose: () => void;
}

interface SettingsFormProps {
  settings: Settings;
  titleId: string;
  onSave: (next: Settings) => void;
  onClose: () => void;
}

function SettingsForm({ settings, titleId, onSave, onClose }: SettingsFormProps) {
  const t = useT();
  const langName = useId();
  const [lang, setLang] = useState<Lang>(settings.lang);

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ lang });
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {t('settings_title')}
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          <Icon name="close" size={22} />
          <span className="sr-only">{t('settings_close')}</span>
        </button>
      </div>

      <fieldset className={styles.group}>
        <legend className={styles.label}>{t('settings_language')}</legend>
        <div className={styles.langs}>
          {LANGUAGES.map((option) => (
            <label key={option.value} className={styles.lang}>
              <input
                type="radio"
                name={langName}
                value={option.value}
                checked={lang === option.value}
                onChange={() => setLang(option.value)}
                className={styles.langInput}
              />
              <span className={styles.langText}>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className={styles.privacy}>{t('settings_privacy')}</p>

      <div className={styles.actions}>
        <Button variant="quiet" onClick={onClose}>
          {t('settings_close')}
        </Button>
        <Button type="submit">{t('settings_save')}</Button>
      </div>
    </form>
  );
}

export function SettingsSheet({ open, settings, onSave, onClose }: SettingsSheetProps) {
  const titleId = useId();
  return (
    <Sheet open={open} onClose={onClose} titleId={titleId}>
      <SettingsForm settings={settings} titleId={titleId} onSave={onSave} onClose={onClose} />
    </Sheet>
  );
}
