import { act, renderHook } from '@testing-library/react';
import type { Place } from '../domain/types';
import { useLastTrip } from './useLastTrip';
import { useSavedPlaces } from './useSavedPlaces';
import { useSettings } from './useSettings';

const home: Place = { id: 'h', label: 'Home', address: 'x', position: { lat: 45.76, lon: 4.83 } };
const work: Place = { id: 'w', label: 'Work', address: 'y', position: { lat: 45.7, lon: 4.8 } };

beforeEach(() => {
  localStorage.clear();
  // Stores cache their snapshot; a null-key storage event is how another tab's clear() looks.
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
  });
});

describe('useSavedPlaces', () => {
  it('starts empty and saves, replaces, and clears places', () => {
    const { result } = renderHook(() => useSavedPlaces());
    expect(result.current.places).toEqual({});

    act(() => result.current.save('home', home));
    act(() => result.current.save('work', work));
    expect(result.current.places).toEqual({ home, work });

    act(() => result.current.clear('home'));
    expect(result.current.places).toEqual({ work });
    expect(JSON.parse(localStorage.getItem('ht:v1:places') ?? '').data).toEqual({ work });
  });

  it('keeps a stable places reference across rerenders', () => {
    const { result, rerender } = renderHook(() => useSavedPlaces());
    const before = result.current.places;

    rerender();

    expect(result.current.places).toBe(before);
  });

  it('updates when another tab writes the key', () => {
    const { result } = renderHook(() => useSavedPlaces());

    act(() => {
      localStorage.setItem('ht:v1:places', JSON.stringify({ version: 1, data: { home } }));
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'ht:v1:places', storageArea: localStorage }),
      );
    });

    expect(result.current.places).toEqual({ home });
  });

  it('shares state between hook instances', () => {
    const a = renderHook(() => useSavedPlaces());
    const b = renderHook(() => useSavedPlaces());

    act(() => a.result.current.save('home', home));

    expect(b.result.current.places).toEqual({ home });
  });
});

describe('useSettings', () => {
  it('stores the language patch', () => {
    const { result } = renderHook(() => useSettings());

    act(() => result.current.update({ lang: 'fr' }));

    expect(result.current.settings).toEqual({ lang: 'fr' });
    expect(JSON.parse(localStorage.getItem('ht:v1:settings') ?? '').data).toEqual({ lang: 'fr' });
  });
});

describe('useLastTrip', () => {
  it('starts empty and stores the trip', () => {
    const { result } = renderHook(() => useLastTrip());
    expect(result.current.trip).toEqual({ from: null, to: null });

    act(() => result.current.setTrip({ from: home, to: work }));

    expect(result.current.trip).toEqual({ from: home, to: work });
  });
});
