import { act, renderHook } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

type Success = (position: GeolocationPosition) => void;
type Failure = (error: GeolocationPositionError) => void;

interface PendingRequest {
  success: Success;
  failure: Failure;
}

const pending: PendingRequest[] = [];
const getCurrentPosition = vi.fn(
  (success: Success, failure: Failure | null | undefined, _options?: PositionOptions) => {
    pending.push({ success, failure: failure ?? (() => undefined) });
  },
);

function position(latitude: number, longitude: number, accuracy = 25): GeolocationPosition {
  return { coords: { latitude, longitude, accuracy } } as GeolocationPosition;
}

function failure(code: number): GeolocationPositionError {
  return { code, PERMISSION_DENIED: 1 } as GeolocationPositionError;
}

function setGeolocation(value: unknown) {
  Object.defineProperty(navigator, 'geolocation', { value, configurable: true });
}

beforeEach(() => {
  pending.length = 0;
  getCurrentPosition.mockClear();
  setGeolocation({ getCurrentPosition });
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation');
  vi.restoreAllMocks();
});

describe('useGeolocation', () => {
  it('starts idle without requesting a position', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.state).toEqual({ status: 'idle' });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('reports locating, then ready with position and accuracy', () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate());
    expect(result.current.state).toEqual({ status: 'locating' });
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    });

    act(() => pending[0]?.success(position(45.76, 4.83, 12)));
    expect(result.current.state).toEqual({
      status: 'ready',
      position: { lat: 45.76, lon: 4.83 },
      accuracyM: 12,
    });
  });

  it('maps PERMISSION_DENIED to denied', () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate());
    act(() => pending[0]?.failure(failure(1)));

    expect(result.current.state).toEqual({ status: 'denied' });
  });

  it.each([2, 3])('maps error code %i to error', (code) => {
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate());
    act(() => pending[0]?.failure(failure(code)));

    expect(result.current.state).toEqual({ status: 'error' });
  });

  it('maps a synchronous throw to error', () => {
    getCurrentPosition.mockImplementationOnce(() => {
      throw new Error('insecure context');
    });
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate());

    expect(result.current.state).toEqual({ status: 'error' });
  });

  it('reports unavailable when the Geolocation API is missing', () => {
    setGeolocation(undefined);
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate());

    expect(result.current.state).toEqual({ status: 'unavailable' });
  });

  it('ignores a result superseded by a newer locate() call', () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate());
    act(() => result.current.locate());
    act(() => pending[1]?.success(position(2, 2)));
    act(() => pending[0]?.success(position(1, 1)));

    expect(result.current.state).toMatchObject({ status: 'ready', position: { lat: 2, lon: 2 } });
  });

  it('ignores a stale failure after a newer request succeeded', () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => result.current.locate());
    act(() => result.current.locate());
    act(() => pending[1]?.success(position(2, 2)));
    act(() => pending[0]?.failure(failure(1)));

    expect(result.current.state.status).toBe('ready');
  });

  it('does not update state or warn when a result arrives after unmount', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result, unmount } = renderHook(() => useGeolocation());

    act(() => result.current.locate());
    unmount();
    act(() => pending[0]?.success(position(1, 1)));

    expect(result.current.state).toEqual({ status: 'locating' });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
