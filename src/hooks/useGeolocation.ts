import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLng } from '../domain/types';

export type GeoState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'ready'; position: LatLng; accuracyM: number }
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'error' };

const OPTIONS: PositionOptions = { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 };

export function useGeolocation(): { state: GeoState; locate: () => void } {
  const [state, setState] = useState<GeoState>({ status: 'idle' });
  // Bumped per request and on unmount, so late callbacks can tell they are stale.
  const latestRequest = useRef(0);

  useEffect(
    () => () => {
      latestRequest.current += 1;
    },
    [],
  );

  const locate = useCallback(() => {
    const request = ++latestRequest.current;
    const settle = (next: GeoState) => {
      if (request === latestRequest.current) setState(next);
    };

    if (!navigator.geolocation) {
      setState({ status: 'unavailable' });
      return;
    }
    setState({ status: 'locating' });
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          settle({
            status: 'ready',
            position: { lat: coords.latitude, lon: coords.longitude },
            accuracyM: coords.accuracy,
          }),
        (failure) =>
          settle({ status: failure.code === failure.PERMISSION_DENIED ? 'denied' : 'error' }),
        OPTIONS,
      );
    } catch {
      // Some browsers throw synchronously (e.g. insecure context) instead of calling the error callback.
      settle({ status: 'error' });
    }
  }, []);

  return { state, locate };
}
