import { currentLocationPlace, roundCoord, samePlace } from './places';
import type { Place } from './types';

const home: Place = { id: 'a', label: 'Home', address: 'x', position: { lat: 45.76, lon: 4.83 } };

describe('roundCoord', () => {
  it('rounds to 4 decimal places', () => {
    expect(roundCoord(45.123456)).toBe(45.1235);
    expect(roundCoord(-4.83004)).toBe(-4.83);
  });
});

describe('currentLocationPlace', () => {
  it('builds a place with the fixed current-location id', () => {
    expect(currentLocationPlace({ lat: 1, lon: 2 }, 'My location')).toEqual({
      id: 'current-location',
      label: 'My location',
      address: '',
      position: { lat: 1, lon: 2 },
    });
  });
});

describe('samePlace', () => {
  it('matches by id even when positions differ', () => {
    expect(samePlace(home, { ...home, position: { lat: 0, lon: 0 } })).toBe(true);
  });

  it('matches different ids at nearly the same position', () => {
    const near = { ...home, id: 'b', position: { lat: 45.76004, lon: 4.83004 } };

    expect(samePlace(home, near)).toBe(true);
  });

  it('distinguishes different ids at distinct positions', () => {
    const far = { ...home, id: 'b', position: { lat: 45.7602, lon: 4.83 } };

    expect(samePlace(home, far)).toBe(false);
  });
});
