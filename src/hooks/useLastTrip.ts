import { useSyncExternalStore } from 'react';
import type { LastTrip } from '../domain/types';
import { lastTripStore } from '../storage/stores';

function setTrip(trip: LastTrip): void {
  lastTripStore.set(trip);
}

export function useLastTrip(): { trip: LastTrip; setTrip: (trip: LastTrip) => void } {
  const trip = useSyncExternalStore(lastTripStore.subscribe, lastTripStore.get);
  return { trip, setTrip };
}
