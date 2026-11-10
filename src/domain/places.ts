import type { LatLng, Place } from './types';

const SAME_PLACE_TOLERANCE = 1e-4;

export const CURRENT_LOCATION_ID = 'current-location';

export function roundCoord(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

export function currentLocationPlace(position: LatLng, label: string): Place {
  return { id: CURRENT_LOCATION_ID, label, address: '', position };
}

export function samePlace(a: Place, b: Place): boolean {
  return (
    a.id === b.id ||
    (Math.abs(a.position.lat - b.position.lat) < SAME_PLACE_TOLERANCE &&
      Math.abs(a.position.lon - b.position.lon) < SAME_PLACE_TOLERANCE)
  );
}
