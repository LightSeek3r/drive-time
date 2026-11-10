import { useSyncExternalStore } from 'react';
import type { Place, SavedPlaceKey, SavedPlaces } from '../domain/types';
import { placesStore } from '../storage/stores';

function save(key: SavedPlaceKey, place: Place): void {
  placesStore.set({ ...placesStore.get(), [key]: place });
}

function clear(key: SavedPlaceKey): void {
  const next = { ...placesStore.get() };
  delete next[key];
  placesStore.set(next);
}

export function useSavedPlaces(): {
  places: SavedPlaces;
  save: (key: SavedPlaceKey, place: Place) => void;
  clear: (key: SavedPlaceKey) => void;
} {
  const places = useSyncExternalStore(placesStore.subscribe, placesStore.get);
  return { places, save, clear };
}
