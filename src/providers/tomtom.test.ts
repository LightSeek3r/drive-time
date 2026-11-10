import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RouteRequest } from './trafficProvider';
import { ProviderError } from './trafficProvider';
import { createTomTomProvider } from './tomtom';
import error401 from './__fixtures__/error-401.json';
import error403 from './__fixtures__/error-403.xml?raw';
import error403Quota from './__fixtures__/error-403-quota.xml?raw';
import error429 from './__fixtures__/error-429.xml?raw';
import routeBadInput from './__fixtures__/route-bad-input.json';
import routeEmpty from './__fixtures__/route-empty.json';
import routeMalformed from './__fixtures__/route-malformed.json';
import routeMapMatching from './__fixtures__/route-map-matching-failure.json';
import routeNoRoute from './__fixtures__/route-no-route.json';
import routeNoFreeFlow from './__fixtures__/route-success-no-freeflow.json';
import routeSuccess from './__fixtures__/route-success.json';
import searchEmpty from './__fixtures__/search-empty.json';
import searchMalformed from './__fixtures__/search-malformed.json';
import searchSuccess from './__fixtures__/search-success.json';

const API_KEY = 'secret-key-123';

const routeRequest: RouteRequest = {
  from: { lat: 45.76, lon: 4.83 },
  to: { lat: 45.7606, lon: 4.8595 },
  departAt: new Date('2026-11-10T08:15:00+01:00'),
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function xml(body: string, status: number): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/xml' } });
}

function fakeFetch(respond: () => Response | Promise<Response>) {
  const urls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    urls.push(String(input));
    return respond();
  };
  return { fetchImpl, urls };
}

async function rejection(promise: Promise<unknown>): Promise<ProviderError> {
  const error: unknown = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  if (!(error instanceof ProviderError))
    throw new Error(`expected ProviderError, got ${String(error)}`);
  return error;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createTomTomProvider().route', () => {
  it('maps a successful route summary', async () => {
    const { fetchImpl } = fakeFetch(() => json(routeSuccess));
    const provider = createTomTomProvider({ apiKey: API_KEY, fetchImpl });
    await expect(provider.route(routeRequest)).resolves.toEqual({
      durationSec: 1563,
      freeFlowSec: 1180,
      distanceM: 12840,
    });
  });

  it('falls back to durationSec when noTrafficTravelTimeInSeconds is absent', async () => {
    const { fetchImpl } = fakeFetch(() => json(routeNoFreeFlow));
    const provider = createTomTomProvider({ apiKey: API_KEY, fetchImpl });
    await expect(provider.route(routeRequest)).resolves.toEqual({
      durationSec: 120,
      freeFlowSec: 120,
      distanceM: 900,
    });
  });

  it('builds the documented URL with departAt percent-encoded, offset "+" as %2B', async () => {
    const { fetchImpl, urls } = fakeFetch(() => json(routeSuccess));
    await createTomTomProvider({ apiKey: API_KEY, fetchImpl }).route(routeRequest);

    expect(urls).toHaveLength(1);
    const raw = urls[0]!;
    expect(raw).toContain('departAt=2026-11-10T08%3A15%3A00%2B01%3A00');
    expect(raw).not.toContain('+01');
    const url = new URL(raw);
    expect(url.origin).toBe('https://api.tomtom.com');
    expect(url.pathname).toBe(
      '/routing/1/calculateRoute/45.760000,4.830000:45.760600,4.859500/json',
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      key: API_KEY,
      departAt: '2026-11-10T08:15:00+01:00',
      traffic: 'true',
      computeTravelTimeFor: 'all',
      routeType: 'fastest',
      travelMode: 'car',
    });
  });

  it('sends the departAt offset in force at that instant (summer time)', async () => {
    const { fetchImpl, urls } = fakeFetch(() => json(routeSuccess));
    await createTomTomProvider({ apiKey: API_KEY, fetchImpl }).route({
      ...routeRequest,
      departAt: new Date('2026-10-25T00:45:00Z'),
    });
    expect(new URL(urls[0]!).searchParams.get('departAt')).toBe('2026-10-25T02:45:00+02:00');
  });

  it('passes the abort signal to fetch', async () => {
    const seen: (AbortSignal | null | undefined)[] = [];
    const fetchImpl: typeof fetch = async (_input, init) => {
      seen.push(init?.signal);
      return json(routeSuccess);
    };
    const controller = new AbortController();
    await createTomTomProvider({ apiKey: API_KEY, fetchImpl }).route({
      ...routeRequest,
      signal: controller.signal,
    });
    expect(seen).toEqual([controller.signal]);
  });

  it.each([
    ['401 (observed live)', () => json(error401, 401), 'bad-key'],
    ['403 not authorized', () => xml(error403, 403), 'bad-key'],
    ['403 quota exceeded', () => xml(error403Quota, 403), 'rate-limited'],
    ['429', () => xml(error429, 429), 'rate-limited'],
    ['400 NO_ROUTE_FOUND', () => json(routeNoRoute, 400), 'no-route'],
    ['400 MAP_MATCHING_FAILURE', () => json(routeMapMatching, 400), 'no-route'],
    ['200 with empty routes', () => json(routeEmpty), 'no-route'],
    ['400 BAD_INPUT', () => json(routeBadInput, 400), 'unknown'],
    ['404 non-JSON body', () => xml('<h1>Not Found</h1>', 404), 'unknown'],
    ['500', () => json({}, 500), 'unknown'],
    ['malformed summary', () => json(routeMalformed), 'unknown'],
    ['invalid JSON', () => new Response('{"routes": [', { status: 200 }), 'unknown'],
  ] as const)('maps %s to %s', async (_label, respond, kind) => {
    const { fetchImpl } = fakeFetch(respond);
    const error = await rejection(
      createTomTomProvider({ apiKey: API_KEY, fetchImpl }).route(routeRequest),
    );
    expect(error.kind).toBe(kind);
    expect(error.message).not.toContain(API_KEY);
  });

  it('maps a fetch TypeError (network failure) to offline', async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    const error = await rejection(
      createTomTomProvider({ apiKey: API_KEY, fetchImpl }).route(routeRequest),
    );
    expect(error.kind).toBe('offline');
  });

  it('reports offline without a request when the browser says it is offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { fetchImpl, urls } = fakeFetch(() => json(routeSuccess));
    const error = await rejection(
      createTomTomProvider({ apiKey: API_KEY, fetchImpl }).route(routeRequest),
    );
    expect(error.kind).toBe('offline');
    expect(urls).toEqual([]);
  });

  it('maps an abort to aborted', async () => {
    const fetchImpl: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('The operation was aborted.', 'AbortError')),
        );
      });
    const controller = new AbortController();
    const pending = createTomTomProvider({ apiKey: API_KEY, fetchImpl }).route({
      ...routeRequest,
      signal: controller.signal,
    });
    controller.abort();
    expect((await rejection(pending)).kind).toBe('aborted');
  });

  it('rejects an empty or blank key with missing-key and makes no request', async () => {
    const { fetchImpl, urls } = fakeFetch(() => json(routeSuccess));
    for (const apiKey of ['', '   ']) {
      const error = await rejection(
        createTomTomProvider({ apiKey, fetchImpl }).route(routeRequest),
      );
      expect(error.kind).toBe('missing-key');
    }
    expect(urls).toEqual([]);
  });
});

describe('createTomTomProvider().suggest', () => {
  it('maps search results to places', async () => {
    const { fetchImpl } = fakeFetch(() => json(searchSuccess));
    const places = await createTomTomProvider({ apiKey: API_KEY, fetchImpl }).suggest({
      query: 'part dieu',
      lang: 'fr',
    });
    expect(places).toEqual([
      {
        id: 'tomtom:g6JpZK8yNTAwMDkwMDAzNzM1NjahY6NGUkGhdqdVbmlmaWVk',
        label: 'Gare de Lyon Part-Dieu',
        address: 'Place Charles Béraudier, 69003 Lyon',
        position: { lat: 45.76058, lon: 4.85954 },
      },
      {
        id: 'tomtom:ZZ1aAAvMDGwzNTE4ODU2NjE',
        label: '17 Rue du Docteur Bouchut',
        address: '17 Rue du Docteur Bouchut, 69003 Lyon',
        position: { lat: 45.76084, lon: 4.85468 },
      },
      {
        id: 'tomtom:XY1bBBwNDA5ODQ5',
        label: 'Villeurbanne',
        address: 'Villeurbanne',
        position: { lat: 45.76601, lon: 4.8795 },
      },
    ]);
  });

  it('returns an empty list for no results', async () => {
    const { fetchImpl } = fakeFetch(() => json(searchEmpty));
    await expect(
      createTomTomProvider({ apiKey: API_KEY, fetchImpl }).suggest({ query: 'zzqxq', lang: 'en' }),
    ).resolves.toEqual([]);
  });

  it('builds a typeahead search URL with language and location bias', async () => {
    const { fetchImpl, urls } = fakeFetch(() => json(searchEmpty));
    await createTomTomProvider({ apiKey: API_KEY, fetchImpl }).suggest({
      query: ' Rue de la Paix / 12 ',
      lang: 'en',
      near: { lat: 45.76, lon: 4.83 },
    });
    const url = new URL(urls[0]!);
    expect(url.origin).toBe('https://api.tomtom.com');
    expect(url.pathname).toBe('/search/2/search/Rue%20de%20la%20Paix%20%2F%2012.json');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      key: API_KEY,
      typeahead: 'true',
      limit: '6',
      language: 'en-GB',
      lat: '45.760000',
      lon: '4.830000',
    });
  });

  it('uses fr-FR and no bias when none is given', async () => {
    const { fetchImpl, urls } = fakeFetch(() => json(searchEmpty));
    await createTomTomProvider({ apiKey: API_KEY, fetchImpl }).suggest({
      query: 'lyon',
      lang: 'fr',
    });
    const params = new URL(urls[0]!).searchParams;
    expect(params.get('language')).toBe('fr-FR');
    expect(params.has('lat')).toBe(false);
  });

  it('skips the request for a blank query', async () => {
    const { fetchImpl, urls } = fakeFetch(() => json(searchEmpty));
    await expect(
      createTomTomProvider({ apiKey: API_KEY, fetchImpl }).suggest({ query: '  ', lang: 'en' }),
    ).resolves.toEqual([]);
    expect(urls).toEqual([]);
  });

  it('rejects a malformed result with unknown', async () => {
    const { fetchImpl } = fakeFetch(() => json(searchMalformed));
    const error = await rejection(
      createTomTomProvider({ apiKey: API_KEY, fetchImpl }).suggest({ query: 'lyon', lang: 'en' }),
    );
    expect(error.kind).toBe('unknown');
  });

  it('maps 401 to bad-key without leaking the key', async () => {
    const { fetchImpl } = fakeFetch(() => json(error401, 401));
    const error = await rejection(
      createTomTomProvider({ apiKey: API_KEY, fetchImpl }).suggest({ query: 'lyon', lang: 'en' }),
    );
    expect(error.kind).toBe('bad-key');
    expect(error.message).not.toContain(API_KEY);
  });
});
