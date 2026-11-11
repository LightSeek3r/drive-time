import { act, renderHook } from '@testing-library/react';
import type { Lang, Place } from '../domain/types';
import {
  ProviderError,
  type SuggestRequest,
  type TrafficProvider,
} from '../providers/trafficProvider';
import { usePlaceSearch } from './usePlaceSearch';

const suggest = vi.fn<[SuggestRequest], Promise<Place[]>>();
const provider: TrafficProvider = {
  suggest,
  route: () => Promise.reject(new Error('unused')),
};

vi.mock('./useTrafficProvider', () => ({ useTrafficProvider: () => provider }));

const lyon: Place = {
  id: '1',
  label: 'Lyon',
  address: 'Lyon, France',
  position: { lat: 45.76, lon: 4.83 },
};

interface Props {
  query: string;
  lang?: Lang;
}

function render(initial: Props) {
  return renderHook(({ query, lang = 'en' }: Props) => usePlaceSearch({ query, lang }), {
    initialProps: initial,
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  suggest.mockReset();
  suggest.mockResolvedValue([lyon]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePlaceSearch', () => {
  it('does nothing below three trimmed characters', async () => {
    const { result } = render({ query: '  ly ' });

    await advance(1000);

    expect(suggest).not.toHaveBeenCalled();
    expect(result.current).toEqual({ suggestions: [], status: 'idle', error: null });
  });

  it('debounces 300 ms, then returns the suggestions', async () => {
    const { result } = render({ query: ' lyon ' });
    expect(result.current.status).toBe('loading');

    await advance(299);
    expect(suggest).not.toHaveBeenCalled();

    await advance(1);
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest.mock.calls[0]?.[0]).toMatchObject({ query: 'lyon', lang: 'en' });
    expect(result.current).toMatchObject({ suggestions: [lyon], status: 'ready', error: null });
  });

  it('sends only the last query of a typing burst', async () => {
    const { rerender } = render({ query: 'lyo' });
    await advance(200);
    rerender({ query: 'lyon' });
    await advance(200);
    rerender({ query: 'lyon p' });
    await advance(300);

    expect(suggest).toHaveBeenCalledTimes(1);
    expect(suggest.mock.calls[0]?.[0].query).toBe('lyon p');
  });

  it('aborts the in-flight request and ignores its late result when the query changes', async () => {
    let resolveFirst: (places: Place[]) => void = () => undefined;
    suggest.mockImplementationOnce(
      () => new Promise<Place[]>((resolve) => (resolveFirst = resolve)),
    );
    const other: Place = { ...lyon, id: '2', label: 'Paris' };
    const { result, rerender } = render({ query: 'lyon' });
    await advance(300);
    const firstSignal = suggest.mock.calls[0]?.[0].signal;

    suggest.mockResolvedValueOnce([other]);
    rerender({ query: 'paris' });
    expect(firstSignal?.aborted).toBe(true);
    await advance(300);
    await act(async () => resolveFirst([lyon]));

    expect(result.current.suggestions).toEqual([other]);
  });

  it('keeps the previous suggestions visible while the next query loads', async () => {
    const { result, rerender } = render({ query: 'lyon' });
    await advance(300);

    rerender({ query: 'lyons' });

    expect(result.current).toMatchObject({ suggestions: [lyon], status: 'loading' });
  });

  it('surfaces provider errors', async () => {
    suggest.mockRejectedValue(new ProviderError('unavailable'));
    const { result } = render({ query: 'lyon' });

    await advance(300);

    expect(result.current).toEqual({ suggestions: [], status: 'error', error: 'unavailable' });
  });

  it('maps non-provider failures to unknown', async () => {
    suggest.mockRejectedValue(new TypeError('boom'));
    const { result } = render({ query: 'lyon' });

    await advance(300);

    expect(result.current.error).toBe('unknown');
  });

  it('does not surface an aborted rejection as an error', async () => {
    suggest.mockRejectedValue(new ProviderError('aborted'));
    const { result } = render({ query: 'lyon' });

    await advance(300);

    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('loading');
  });

  it('clears results when the query is cleared', async () => {
    const { result, rerender } = render({ query: 'lyon' });
    await advance(300);
    expect(result.current.suggestions).toEqual([lyon]);

    rerender({ query: '' });

    expect(result.current).toEqual({ suggestions: [], status: 'idle', error: null });
  });

  it('answers an identical repeat query from the cache', async () => {
    const { result, rerender } = render({ query: 'lyon' });
    await advance(300);
    rerender({ query: 'ly' });
    await advance(300);

    rerender({ query: 'lyon' });

    expect(result.current).toMatchObject({ suggestions: [lyon], status: 'ready' });
    await advance(1000);
    expect(suggest).toHaveBeenCalledTimes(1);
  });

  it('does not reuse the cache across languages', async () => {
    const { rerender } = render({ query: 'lyon', lang: 'en' });
    await advance(300);

    rerender({ query: 'lyon', lang: 'fr' });
    await advance(300);

    expect(suggest).toHaveBeenCalledTimes(2);
  });

  it('aborts on unmount', async () => {
    const { unmount } = render({ query: 'lyon' });
    await advance(300);

    unmount();

    expect(suggest.mock.calls[0]?.[0].signal?.aborted).toBe(true);
  });
});
