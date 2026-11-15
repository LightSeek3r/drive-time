import type { Lang, LastTrip, SavedPlaces, Settings } from '../domain/types';
import { DEFAULT_WINDOW } from '../domain/window';
import { createLocalStore } from './localStore';
import { validateLastTrip, validateSavedPlaces, validateSettings } from './validators';

function detectLang(): Lang {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('fr')
    ? 'fr'
    : 'en';
}

export const placesStore = createLocalStore<SavedPlaces>({
  key: 'ht:v1:places',
  version: 1,
  defaults: () => ({}),
  validate: validateSavedPlaces,
});

export const settingsStore = createLocalStore<Settings>({
  key: 'ht:v1:settings',
  version: 1,
  defaults: () => ({ lang: detectLang(), ...DEFAULT_WINDOW }),
  validate: validateSettings,
});

export const lastTripStore = createLocalStore<LastTrip>({
  key: 'ht:v1:lastTrip',
  version: 1,
  defaults: () => ({ from: null, to: null }),
  validate: validateLastTrip,
});
