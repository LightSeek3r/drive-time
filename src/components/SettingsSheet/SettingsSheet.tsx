import { useId, useState } from 'react';
import type { Lang, Settings } from '../../domain/types';
import { SPAN_OPTIONS, STEP_OPTIONS, slotCount, withSpan, withStep } from '../../domain/window';
import { useT } from '../../i18n';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { Sheet } from '../Sheet/Sheet';
import styles from './SettingsSheet.module.css';

const LANGUAGES: ReadonlyArray<{ value: Lang; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

interface ChoicesProps<V extends string | number> {
  legend: string;
  value: V;
  options: ReadonlyArray<{ value: V; label: string }>;
  onChange: (value: V) => void;
}

function Choices<V extends string | number>({ legend, value, options, onChange }: ChoicesProps<V>) {
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.label}>{legend}</legend>
      <div className={styles.choices}>
        {options.map((option) => (
          <label key={option.value} className={styles.choice}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={styles.choiceInput}
            />
            <span className={styles.choiceText}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const SPANS = SPAN_OPTIONS.map((value) => ({ value, label: `${value / 60} h` }));
const STEPS = STEP_OPTIONS.map((value) => ({ value, label: `${value} min` }));

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
  const [lang, setLang] = useState<Lang>(settings.lang);
  const [window, setWindow] = useState({ span: settings.span, step: settings.step });

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ lang, ...window });
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

      <Choices
        legend={t('settings_language')}
        value={lang}
        options={LANGUAGES}
        onChange={setLang}
      />

      <Choices
        legend={t('settings_span')}
        value={window.span}
        options={SPANS}
        onChange={(span) => setWindow(withSpan(window, span))}
      />
      <Choices
        legend={t('settings_step')}
        value={window.step}
        options={STEPS}
        onChange={(step) => setWindow(withStep(window, step))}
      />
      <p className={styles.hint}>{t('settings_window_cost', { n: slotCount(window) })}</p>

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
