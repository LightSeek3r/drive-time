import { useMemo } from 'react';
import { roundCoord } from '../domain/places';
import type { LatLng } from '../domain/types';

/** Same rounded coordinates -> same object, so effects keyed on it ignore GPS jitter and fresh Place objects. */
export function useStablePoint(point: LatLng | null | undefined): LatLng | null {
  const lat = point ? roundCoord(point.lat) : null;
  const lon = point ? roundCoord(point.lon) : null;
  return useMemo(() => (lat === null || lon === null ? null : { lat, lon }), [lat, lon]);
}
