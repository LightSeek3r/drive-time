export type Lang = 'en' | 'fr';

export interface LatLng {
  lat: number;
  lon: number;
}

export interface Place {
  id: string;
  /** Short display name, e.g. "Home" or "Part-Dieu". */
  label: string;
  /** Full address line shown under or after the label. */
  address: string;
  position: LatLng;
}

export type SavedPlaceKey = 'home' | 'work';

export type SavedPlaces = Partial<Record<SavedPlaceKey, Place>>;

/** Where the departure times start from. `now` re-evaluates at each refresh. */
export type StartTime = { mode: 'now' } | { mode: 'at'; at: Date };

export interface DepartureSlot {
  /** 0 for the first slot, then 15, 30 … */
  offsetMin: number;
  departAt: Date;
}

export interface RouteEstimate {
  /** Best estimate: historic speeds for that weekday/time, blended with live traffic when near. */
  durationSec: number;
  /** Duration at free-flow speed, no traffic; used for the "typical vs now" context. */
  freeFlowSec: number;
  distanceM: number;
}

export interface SlotEstimate extends RouteEstimate {
  slot: DepartureSlot;
  arriveAt: Date;
}

export type SlotState =
  | { status: 'loading'; slot: DepartureSlot }
  | { status: 'ready'; estimate: SlotEstimate }
  | { status: 'error'; slot: DepartureSlot; kind: ProviderErrorKind };

export type ProviderErrorKind =
  'bad-key' | 'missing-key' | 'rate-limited' | 'no-route' | 'offline' | 'aborted' | 'unknown';

export interface Settings {
  lang: Lang;
  /** TomTom API key. Empty string means unset. */
  apiKey: string;
}

export interface LastTrip {
  from: Place | null;
  to: Place | null;
}
