import { CURRENT_LOCATION_ID, samePlace } from '../../domain/places';
import type { Lang, Place, SavedPlaceKey, SavedPlaces } from '../../domain/types';
import type { GeoState } from '../../hooks/useGeolocation';
import { useT } from '../../i18n';
import { Icon } from '../Icon/Icon';
import type { PlaceShortcut } from '../PlaceField/PlaceField';
import { PlaceSearchField } from '../PlaceSearchField/PlaceSearchField';
import { SaveAsPrompt } from '../SaveAsPrompt/SaveAsPrompt';
import styles from './RouteSection.module.css';

export type RouteFieldName = 'from' | 'to';

interface RouteSectionProps {
  from: Place | null;
  to: Place | null;
  saved: SavedPlaces;
  activeField: RouteFieldName;
  geo: GeoState;
  lang: Lang;
  /** Demo data is showing: empty fields read as a labelled sample route. */
  isSample: boolean;
  onActivate: (field: RouteFieldName) => void;
  onPick: (field: RouteFieldName, place: Place) => void;
  onSwap: () => void;
  onLocate: () => void;
  onSaveAs: (key: SavedPlaceKey) => void;
  onSetUp: (key: SavedPlaceKey) => void;
}

const SAVED_KEYS = ['home', 'work'] as const;

function geoMessageKey(geo: GeoState) {
  switch (geo.status) {
    case 'denied':
      return 'geolocation_denied';
    case 'unavailable':
      return 'geolocation_unavailable';
    case 'error':
      return 'geolocation_error';
    default:
      return null;
  }
}

function savedName(place: Place | null, saved: SavedPlaces): SavedPlaceKey | undefined {
  if (place === null) return undefined;
  return SAVED_KEYS.find((key) => {
    const candidate = saved[key];
    return candidate !== undefined && samePlace(place, candidate);
  });
}

export function RouteSection({
  from,
  to,
  saved,
  activeField,
  geo,
  lang,
  isSample,
  onActivate,
  onPick,
  onSwap,
  onLocate,
  onSaveAs,
  onSetUp,
}: RouteSectionProps) {
  const t = useT();
  const activePlace = activeField === 'from' ? from : to;
  const canSave =
    activePlace !== null &&
    activePlace.id !== CURRENT_LOCATION_ID &&
    savedName(activePlace, saved) === undefined;
  const geoMessage = geoMessageKey(geo);
  const locating = geo.status === 'locating';
  const tagOf = (place: Place | null) => {
    const key = savedName(place, saved);
    return key === undefined ? undefined : t(key);
  };
  const shortcutsFor = (field: RouteFieldName): PlaceShortcut[] =>
    SAVED_KEYS.map((key) => {
      const place = saved[key];
      if (place === undefined) {
        return {
          id: `set-${key}`,
          label: t('set_place', { name: t(key) }),
          icon: 'plus',
          setup: true,
          onChoose: () => onSetUp(key),
        };
      }
      return {
        id: `saved-${key}`,
        label: t(key),
        address: place.address === '' ? place.label : place.address,
        icon: key,
        onChoose: () => onPick(field, place),
      };
    });

  return (
    <section className={styles.route}>
      <div className={styles.fields}>
        <div className={styles.stack}>
          <PlaceSearchField
            shape="top"
            marker="from"
            label={t('from')}
            placeholder={isSample ? t('sample_home') : undefined}
            value={from}
            tag={tagOf(from)}
            lang={lang}
            near={to?.position}
            shortcuts={shortcutsFor('from')}
            onFocus={() => onActivate('from')}
            onSelect={(place) => onPick('from', place)}
            trailing={
              <button
                type="button"
                className={styles.locate}
                onClick={onLocate}
                disabled={locating}
                aria-busy={locating}
              >
                <Icon
                  name={locating ? 'spinner' : 'locate'}
                  size={20}
                  className={locating ? styles.spin : undefined}
                />
                <span className="sr-only">{locating ? t('locating') : t('useMyLocation')}</span>
              </button>
            }
          />
          <PlaceSearchField
            shape="bottom"
            marker="to"
            label={t('to')}
            placeholder={isSample ? t('sample_work') : undefined}
            value={to}
            tag={tagOf(to)}
            lang={lang}
            near={from?.position}
            shortcuts={shortcutsFor('to')}
            onFocus={() => onActivate('to')}
            onSelect={(place) => onPick('to', place)}
          />
        </div>
        <button type="button" className={styles.swap} onClick={onSwap}>
          <Icon name="swap" size={20} />
          <span className="sr-only">{t('swap')}</span>
        </button>
      </div>

      {geoMessage !== null && (
        <p className={styles.geoMessage} role="status">
          {t(geoMessage)}
        </p>
      )}

      {canSave && <SaveAsPrompt onSave={onSaveAs} />}
    </section>
  );
}
