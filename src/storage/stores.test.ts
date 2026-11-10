import { lastTripStore, placesStore, settingsStore } from './stores';

function stubLanguage(language: string) {
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(language);
}

function resetStores() {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
}

beforeEach(resetStores);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('stores', () => {
  it('places default to an empty record', () => {
    expect(placesStore.get()).toEqual({});
  });

  it('lastTrip defaults to both endpoints null', () => {
    expect(lastTripStore.get()).toEqual({ from: null, to: null });
  });

  it('settings default to French for fr-* browsers', () => {
    stubLanguage('fr-CA');
    resetStores();

    expect(settingsStore.get()).toEqual({ lang: 'fr', apiKey: '' });
  });

  it('settings default to English otherwise', () => {
    stubLanguage('de-DE');
    resetStores();

    expect(settingsStore.get()).toEqual({ lang: 'en', apiKey: '' });
  });

  it('persists under ht:v1 keys', () => {
    settingsStore.set({ lang: 'fr', apiKey: 'k' });
    placesStore.set({});
    lastTripStore.set({ from: null, to: null });

    expect(localStorage.getItem('ht:v1:settings')).not.toBeNull();
    expect(localStorage.getItem('ht:v1:places')).not.toBeNull();
    expect(localStorage.getItem('ht:v1:lastTrip')).not.toBeNull();
  });

  it('falls back to defaults when stored data fails validation', () => {
    localStorage.setItem('ht:v1:settings', JSON.stringify({ version: 1, data: { lang: 'xx' } }));
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'ht:v1:settings', storageArea: localStorage }),
    );

    expect(settingsStore.get()).toEqual({ lang: 'en', apiKey: '' });
  });
});
