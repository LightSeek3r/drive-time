import { useId, useState } from 'react';
import type { Lang, Settings } from '../../domain/types';
import { useT } from '../../i18n';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Sheet } from '../Sheet/Sheet';
import styles from './SettingsSheet.module.css';

const KEY_URL = 'https://developer.tomtom.com/';

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
  const keyId = useId();
  const hintId = useId();
  const langName = useId();
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [lang, setLang] = useState<Lang>(settings.lang);
  const [keyVisible, setKeyVisible] = useState(false);

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ apiKey: apiKey.trim(), lang });
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

      <div className={styles.group}>
        <label htmlFor={keyId} className={styles.label}>
          {t('settings_api_key_label')}
        </label>
        <div className={styles.keyRow}>
          <input
            id={keyId}
            className={styles.input}
            type={keyVisible ? 'text' : 'password'}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={hintId}
            data-1p-ignore
            data-lpignore="true"
          />
          <button
            type="button"
            className={styles.reveal}
            aria-pressed={keyVisible}
            onClick={() => setKeyVisible((visible) => !visible)}
          >
            <Icon name={keyVisible ? 'eyeOff' : 'eye'} size={20} />
            <span className="sr-only">
              {keyVisible ? t('settings_hide_key') : t('settings_show_key')}
            </span>
          </button>
        </div>
        <p id={hintId} className={styles.hint}>
          {t('settings_api_key_hint')}{' '}
          <a href={KEY_URL} target="_blank" rel="noopener noreferrer">
            {t('settings_get_free_key')}
          </a>
        </p>
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
