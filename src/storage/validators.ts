import type {
  LastTrip,
  LatLng,
  Place,
  SavedPlaceKey,
  SavedPlaces,
  Settings,
} from '../domain/types';

const SAVED_PLACE_KEYS: readonly SavedPlaceKey[] = ['home', 'work'];

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

function isNonEmptyString(raw: unknown): raw is string {
  return typeof raw === 'string' && raw.trim() !== '';
}

function isCoordinate(raw: unknown, limit: number): raw is number {
  return typeof raw === 'number' && Number.isFinite(raw) && Math.abs(raw) <= limit;
}

function validateLatLng(raw: unknown): LatLng | null {
  if (!isRecord(raw) || !isCoordinate(raw.lat, 90) || !isCoordinate(raw.lon, 180)) return null;
  return { lat: raw.lat, lon: raw.lon };
}

export function validatePlace(raw: unknown): Place | null {
  if (!isRecord(raw)) return null;
  const position = validateLatLng(raw.position);
  // address may be empty: the "current location" place has no street address.
  if (
    !isNonEmptyString(raw.id) ||
    !isNonEmptyString(raw.label) ||
    typeof raw.address !== 'string'
  ) {
    return null;
  }
  if (!position) return null;
  return { id: raw.id, label: raw.label, address: raw.address, position };
}

export function validateSavedPlaces(raw: unknown): SavedPlaces | null {
  if (!isRecord(raw)) return null;
  const places: SavedPlaces = {};
  for (const key of SAVED_PLACE_KEYS) {
    if (raw[key] === undefined) continue;
    const place = validatePlace(raw[key]);
    if (!place) return null;
    places[key] = place;
  }
  return places;
}

export function validateSettings(raw: unknown): Settings | null {
  if (!isRecord(raw)) return null;
  if (raw.lang !== 'en' && raw.lang !== 'fr') return null;
  return { lang: raw.lang };
}

/** `undefined` signals an invalid value, so it stays distinct from a legitimate `null`. */
function validateNullablePlace(raw: unknown): Place | null | undefined {
  return raw === null ? null : (validatePlace(raw) ?? undefined);
}

export function validateLastTrip(raw: unknown): LastTrip | null {
  if (!isRecord(raw)) return null;
  const from = validateNullablePlace(raw.from);
  const to = validateNullablePlace(raw.to);
  if (from === undefined || to === undefined) return null;
  return { from, to };
}
