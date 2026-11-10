import type { Place, SavedPlaceKey, SavedPlaces } from '../../domain/types';
import { samePlace } from '../../domain/places';
import { useT } from '../../i18n';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './PlaceChips.module.css';

const CHIPS: ReadonlyArray<{ key: SavedPlaceKey; icon: IconName }> = [
  { key: 'home', icon: 'home' },
  { key: 'work', icon: 'work' },
];

interface PlaceChipsProps {
  saved: SavedPlaces;
  /** The place in the field a chip would fill; its chip reads as pressed. */
  activePlace: Place | null;
  onUse: (place: Place) => void;
  onSetUp: (key: SavedPlaceKey) => void;
}

export function PlaceChips({ saved, activePlace, onUse, onSetUp }: PlaceChipsProps) {
  const t = useT();
  return (
    <div className={styles.chips}>
      {CHIPS.map(({ key, icon }) => {
        const place = saved[key];
        const name = t(key);
        if (place === undefined) {
          return (
            <button
              key={key}
              type="button"
              className={styles.chip}
              aria-haspopup="dialog"
              onClick={() => onSetUp(key)}
            >
              <span className={`${styles.pill} ${styles.empty}`}>
                <Icon name="plus" size={16} />
                {t('set_place', { name })}
              </span>
            </button>
          );
        }
        const pressed = activePlace !== null && samePlace(activePlace, place);
        return (
          <button
            key={key}
            type="button"
            className={styles.chip}
            aria-pressed={pressed}
            onClick={() => onUse(place)}
          >
            <span className={styles.pill}>
              <Icon name={icon} size={16} />
              {name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
