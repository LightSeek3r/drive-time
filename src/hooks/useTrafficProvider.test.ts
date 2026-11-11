import { renderHook } from '@testing-library/react';
import { useTrafficProvider } from './useTrafficProvider';

describe('useTrafficProvider', () => {
  it('keeps the same provider across rerenders', () => {
    const { result, rerender } = renderHook(() => useTrafficProvider());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(typeof result.current.route).toBe('function');
    expect(typeof result.current.suggest).toBe('function');
  });
});
