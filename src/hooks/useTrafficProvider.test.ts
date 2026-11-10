import { renderHook } from '@testing-library/react';
import { useTrafficProvider } from './useTrafficProvider';

describe('useTrafficProvider', () => {
  it('keeps the same provider for the same key and builds a new one when the key changes', () => {
    const { result, rerender } = renderHook(({ apiKey }) => useTrafficProvider(apiKey), {
      initialProps: { apiKey: 'a' },
    });
    const first = result.current;

    rerender({ apiKey: 'a' });
    expect(result.current).toBe(first);

    rerender({ apiKey: 'b' });
    expect(result.current).not.toBe(first);
    expect(typeof result.current.route).toBe('function');
    expect(typeof result.current.suggest).toBe('function');
  });
});
