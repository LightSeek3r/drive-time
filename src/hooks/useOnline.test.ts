import { act, renderHook } from '@testing-library/react';
import { useOnline } from './useOnline';

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'onLine');
});

describe('useOnline', () => {
  it('reads navigator.onLine and follows online/offline events', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);

    setOnLine(false);
    expect(result.current).toBe(false);

    setOnLine(true);
    expect(result.current).toBe(true);
  });

  it('stops listening on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnline());

    unmount();

    expect(remove).toHaveBeenCalledWith('online', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function));
    remove.mockRestore();
  });
});
