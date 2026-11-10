import { CURRENT_LOCATION_ID, samePlace } from '../../domain/places';
import type { Lang, Place, SavedPlaceKey, SavedPlaces } from '../../domain/types';
import type { GeoState } from '../../hooks/useGeolocation';
import { useT } from '../../i18n';
import { Icon } from '../Icon/Icon';
import { PlaceChips } from '../PlaceChips/PlaceChips';
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
  apiKey: string;
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
  return (['home', 'work'] as const).find((key) => {
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
  apiKey,
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

  return (
    <section className={styles.route}>
      <div className={styles.fields}>
        <div className={styles.stack}>
          <PlaceSearchField
            shape="top"
            label={t('from')}
            placeholder={isSample ? t('sample_home') : undefined}
            value={from}
            tag={tagOf(from)}
            apiKey={apiKey}
            lang={lang}
            near={to?.position}
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
            label={t('to')}
            placeholder={isSample ? t('sample_work') : undefined}
            value={to}
            tag={tagOf(to)}
            apiKey={apiKey}
            lang={lang}
            near={from?.position}
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

      <PlaceChips
        saved={saved}
        activePlace={activePlace}
        onUse={(place) => onPick(activeField, place)}
        onSetUp={onSetUp}
      />
      {canSave && <SaveAsPrompt onSave={onSaveAs} />}
    </section>
  );
}
