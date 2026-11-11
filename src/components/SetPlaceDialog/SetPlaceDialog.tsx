import { useId, useState } from 'react';
import type { Lang, LatLng, Place, SavedPlaceKey } from '../../domain/types';
import { useT } from '../../i18n';
import { Button } from '../Button/Button';
import { Icon } from '../Icon/Icon';
import { PlaceSearchField } from '../PlaceSearchField/PlaceSearchField';
import { Sheet } from '../Sheet/Sheet';
import styles from './SetPlaceDialog.module.css';

interface SetPlaceDialogProps {
  /** Which saved place is being set; null keeps the dialog closed. */
  target: SavedPlaceKey | null;
  lang: Lang;
  near?: LatLng;
  onSave: (key: SavedPlaceKey, place: Place) => void;
  onClose: () => void;
}

interface FormProps extends Omit<SetPlaceDialogProps, 'target'> {
  target: SavedPlaceKey;
  titleId: string;
}

function SetPlaceForm({ target, titleId, lang, near, onSave, onClose }: FormProps) {
  const t = useT();
  const [chosen, setChosen] = useState<Place | null>(null);
  const title = t('set_place', { name: t(target) });

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (chosen !== null) onSave(target, chosen);
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          <Icon name="close" size={22} />
          <span className="sr-only">{t('settings_close')}</span>
        </button>
      </div>
      <p className={styles.hint}>{t('set_place_hint')}</p>
      <PlaceSearchField
        label={t(target)}
        value={chosen}
        lang={lang}
        near={near}
        onSelect={setChosen}
      />
      <div className={styles.actions}>
        <Button variant="quiet" onClick={onClose}>
          {t('settings_close')}
        </Button>
        <Button type="submit" disabled={chosen === null}>
          {t('settings_save')}
        </Button>
      </div>
    </form>
  );
}

export function SetPlaceDialog({ target, ...rest }: SetPlaceDialogProps) {
  const titleId = useId();
  return (
    <Sheet open={target !== null} onClose={rest.onClose} titleId={titleId}>
      {target !== null && <SetPlaceForm target={target} titleId={titleId} {...rest} />}
    </Sheet>
  );
}
