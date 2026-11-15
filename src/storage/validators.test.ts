import type { Place } from '../domain/types';
import {
  validateLastTrip,
  validatePlace,
  validateSavedPlaces,
  validateSettings,
} from './validators';

const place: Place = {
  id: 'p1',
  label: 'Home',
  address: '1 Rue de la Paix, Lyon',
  position: { lat: 45.76, lon: 4.83 },
};

describe('validatePlace', () => {
  it('accepts a valid place, including an empty address', () => {
    expect(validatePlace(place)).toEqual(place);
    expect(validatePlace({ ...place, address: '' })).toEqual({ ...place, address: '' });
  });

  it('accepts coordinates on the range boundaries', () => {
    const corner = { ...place, position: { lat: -90, lon: 180 } };

    expect(validatePlace(corner)).toEqual(corner);
  });

  it('drops unknown extra properties', () => {
    expect(validatePlace({ ...place, extra: 1 })).toEqual(place);
  });

  it.each([
    ['null', null],
    ['a string', 'home'],
    ['an array', [place]],
    ['an empty id', { ...place, id: '' }],
    ['a blank label', { ...place, label: '  ' }],
    ['a numeric id', { ...place, id: 3 }],
    ['a missing address', { id: 'p1', label: 'Home', position: place.position }],
    ['a missing position', { id: 'p1', label: 'Home', address: 'x' }],
    ['latitude out of range', { ...place, position: { lat: 91, lon: 0 } }],
    ['longitude out of range', { ...place, position: { lat: 0, lon: -181 } }],
    ['NaN latitude', { ...place, position: { lat: NaN, lon: 0 } }],
    ['infinite longitude', { ...place, position: { lat: 0, lon: Infinity } }],
    ['string coordinates', { ...place, position: { lat: '45', lon: '4' } }],
  ])('rejects %s', (_name, raw) => {
    expect(validatePlace(raw)).toBeNull();
  });
});

describe('validateSavedPlaces', () => {
  it('accepts empty, partial, and full records', () => {
    expect(validateSavedPlaces({})).toEqual({});
    expect(validateSavedPlaces({ home: place })).toEqual({ home: place });
    expect(validateSavedPlaces({ home: place, work: place })).toEqual({ home: place, work: place });
  });

  it('ignores unknown keys', () => {
    expect(validateSavedPlaces({ home: place, gym: place })).toEqual({ home: place });
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a string', 'x'],
    ['an invalid place', { home: { ...place, id: '' } }],
    ['a null place', { work: null }],
  ])('rejects %s', (_name, raw) => {
    expect(validateSavedPlaces(raw)).toBeNull();
  });
});

describe('validateSettings', () => {
  it('accepts valid settings', () => {
    expect(validateSettings({ lang: 'fr', span: 240, step: 15 })).toEqual({
      lang: 'fr',
      span: 240,
      step: 15,
    });
  });

  it('fills the default window for settings saved before it existed', () => {
    expect(validateSettings({ lang: 'en' })).toEqual({ lang: 'en', span: 180, step: 10 });
  });

  it('falls back to the default window for an unusable pair', () => {
    expect(validateSettings({ lang: 'en', span: 180, step: 5 })).toEqual({
      lang: 'en',
      span: 180,
      step: 10,
    });
    expect(validateSettings({ lang: 'en', span: 'x', step: null })).toEqual({
      lang: 'en',
      span: 180,
      step: 10,
    });
  });

  it('drops the API key that earlier versions stored', () => {
    expect(validateSettings({ lang: 'fr', apiKey: 'abc' })).toEqual({
      lang: 'fr',
      span: 180,
      step: 10,
    });
  });

  it.each([
    ['null', null],
    ['an unsupported language', { lang: 'de' }],
    ['a missing language', {}],
    ['an array', ['en', '']],
  ])('rejects %s', (_name, raw) => {
    expect(validateSettings(raw)).toBeNull();
  });
});

describe('validateLastTrip', () => {
  it('accepts null and place endpoints', () => {
    expect(validateLastTrip({ from: null, to: null })).toEqual({ from: null, to: null });
    expect(validateLastTrip({ from: place, to: null })).toEqual({ from: place, to: null });
    expect(validateLastTrip({ from: place, to: place })).toEqual({ from: place, to: place });
  });

  it.each([
    ['null', null],
    ['a missing from', { to: null }],
    ['a missing to', { from: null }],
    ['an invalid from', { from: { ...place, label: '' }, to: null }],
    ['a string to', { from: null, to: 'home' }],
  ])('rejects %s', (_name, raw) => {
    expect(validateLastTrip(raw)).toBeNull();
  });
});
