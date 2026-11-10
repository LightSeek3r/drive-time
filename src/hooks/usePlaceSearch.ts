import { useEffect, useRef, useState } from 'react';
import type { Lang, LatLng, Place, ProviderErrorKind } from '../domain/types';
import { ProviderError } from '../providers/trafficProvider';
import { useStablePoint } from './useStablePoint';
import { useTrafficProvider } from './useTrafficProvider';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export type PlaceSearchStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PlaceSearchInput {
  query: string;
  apiKey: string;
  lang: Lang;
  near?: LatLng;
}

export interface PlaceSearchResult {
  suggestions: Place[];
  status: PlaceSearchStatus;
  error: ProviderErrorKind | null;
}

interface SearchState {
  /** The request `result` answers; a mismatch with the current request means a newer one is pending. */
  requestKey: string;
  result: PlaceSearchResult;
}

const NO_SUGGESTIONS: Place[] = [];
const IDLE_RESULT: PlaceSearchResult = { suggestions: NO_SUGGESTIONS, status: 'idle', error: null };
const MISSING_KEY_RESULT: PlaceSearchResult = {
  suggestions: NO_SUGGESTIONS,
  status: 'error',
  error: 'missing-key',
};
function ready(suggestions: Place[]): PlaceSearchResult {
  return { suggestions, status: 'ready', error: null };
}

const IDLE_STATE: SearchState = { requestKey: '', result: IDLE_RESULT };

export function usePlaceSearch({ query, apiKey, lang, near }: PlaceSearchInput): PlaceSearchResult {
  const key = apiKey.trim();
  const provider = useTrafficProvider(key);
  const nearPoint = useStablePoint(near);
  const trimmed = query.trim();
  const searchable = trimmed.length >= MIN_QUERY_LENGTH;
  const requestKey = `${lang}|${nearPoint ? `${nearPoint.lat},${nearPoint.lon}` : '-'}|${trimmed}`;

  const [state, setState] = useState<SearchState>(IDLE_STATE);
  const lastSuccess = useRef<{ requestKey: string; suggestions: Place[] } | null>(null);

  useEffect(() => {
    if (!searchable || key === '') {
      // Drops stale suggestions so a retyped query does not briefly show the old list.
      setState(IDLE_STATE);
      return;
    }
    const cached = lastSuccess.current;
    if (cached?.requestKey === requestKey) {
      setState({ requestKey, result: ready(cached.suggestions) });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      provider
        .suggest({ query: trimmed, lang, near: nearPoint ?? undefined, signal: controller.signal })
        .then(
          (suggestions) => {
            if (controller.signal.aborted) return;
            lastSuccess.current = { requestKey, suggestions };
            setState({ requestKey, result: ready(suggestions) });
          },
          (failure: unknown) => {
            if (controller.signal.aborted) return;
            const kind = failure instanceof ProviderError ? failure.kind : 'unknown';
            if (kind === 'aborted') return;
            setState({
              requestKey,
              result: { suggestions: NO_SUGGESTIONS, status: 'error', error: kind },
            });
          },
        );
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchable, key, requestKey, provider, trimmed, lang, nearPoint]);

  if (!searchable) return IDLE_RESULT;
  if (key === '') return MISSING_KEY_RESULT;
  if (state.requestKey !== requestKey) {
    // Keep the previous list on screen while the next one is debounced or in flight.
    return { suggestions: state.result.suggestions, status: 'loading', error: null };
  }
  return state.result;
}
