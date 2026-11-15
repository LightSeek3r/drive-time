// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { handleApiRequest, type Env, type Fetcher } from './proxy';

const ORIGIN = 'https://drive-time.unit42.fr';
const KEY = 'server-secret';
const SAME_ORIGIN = { 'Sec-Fetch-Site': 'same-origin' };
const ROUTE = '/api/routing/1/calculateRoute/45.764043,4.835659:48.856614,2.352222/json';
const SEARCH = '/api/search/2/search/lyon%20gare.json';

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    TOMTOM_API_KEY: KEY,
    API_RATE_LIMITER: { limit: () => Promise.resolve({ success: true }) },
    ...overrides,
  };
}

function upstreamOk() {
  return vi.fn<Parameters<Fetcher>, ReturnType<Fetcher>>(() =>
    Promise.resolve(
      new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json' } }),
    ),
  );
}

interface CallOptions {
  method?: string;
  headers?: Record<string, string>;
  env?: Env;
  fetchImpl?: ReturnType<typeof upstreamOk>;
}

async function call(
  path: string,
  {
    method = 'GET',
    headers = SAME_ORIGIN,
    env = makeEnv(),
    fetchImpl = upstreamOk(),
  }: CallOptions = {},
) {
  const response = await handleApiRequest(
    new Request(`${ORIGIN}${path}`, { method, headers }),
    env,
    fetchImpl,
  );
  return { response, fetchImpl };
}

function upstreamUrl(fetchImpl: ReturnType<typeof upstreamOk>): URL {
  const first = fetchImpl.mock.calls[0];
  if (first === undefined) throw new Error('TomTom was not called');
  return new URL(first[0]);
}

describe('handleApiRequest', () => {
  it('maps a routing call to TomTom and adds the server key', async () => {
    const { response, fetchImpl } = await call(
      `${ROUTE}?departAt=2026-11-10T09:00:00%2B01:00&traffic=true&routeType=fastest`,
    );
    const url = upstreamUrl(fetchImpl);
    expect(response.status).toBe(200);
    expect(url.origin + url.pathname).toBe(
      'https://api.tomtom.com/routing/1/calculateRoute/45.764043,4.835659:48.856614,2.352222/json',
    );
    expect(url.searchParams.get('departAt')).toBe('2026-11-10T09:00:00+01:00');
    expect(url.searchParams.get('traffic')).toBe('true');
    expect(url.searchParams.get('key')).toBe(KEY);
  });

  it('maps a search call and keeps the query segment encoded', async () => {
    const { fetchImpl } = await call(
      `${SEARCH}?typeahead=true&limit=6&language=fr-FR&lat=45.7&lon=4.8`,
    );
    const url = upstreamUrl(fetchImpl);
    expect(url.origin + url.pathname).toBe(
      'https://api.tomtom.com/search/2/search/lyon%20gare.json',
    );
    expect([...url.searchParams.keys()].sort()).toEqual(
      ['key', 'language', 'lat', 'limit', 'lon', 'typeahead'].sort(),
    );
  });

  it('never forwards a key supplied by the client', async () => {
    const { fetchImpl } = await call(`${ROUTE}?key=attacker&traffic=true`);
    expect(upstreamUrl(fetchImpl).searchParams.getAll('key')).toEqual([KEY]);
  });

  it('drops params outside the endpoint allowlist', async () => {
    const route = await call(`${ROUTE}?traffic=true&avoid=tollRoads&limit=100&typeahead=true`);
    expect([...upstreamUrl(route.fetchImpl).searchParams.keys()].sort()).toEqual([
      'key',
      'traffic',
    ]);

    const search = await call(
      `${SEARCH}?language=en-GB&departAt=2026-11-10T09:00:00Z&traffic=true`,
    );
    expect([...upstreamUrl(search.fetchImpl).searchParams.keys()].sort()).toEqual([
      'key',
      'language',
    ]);
  });

  it.each([
    '/',
    '/index.html',
    '/api',
    '/api/other',
    '/api/routing/1/calculateRoute/45.7,4.8:48.8,2.3/xml',
    '/api/routing/1/calculateRoute/a,b:c,d/json',
    '/api/routing/1/calculateRoute/45.7,4.8:48.8,2.3/json/extra',
    '/api/routing/1/calculateRoute/../../other/json',
    '/api/search/2/search/a/b.json',
    '/api/search/2/search/.json',
    `/api/search/2/search/${'a'.repeat(301)}.json`,
    '/api/search/2/geocode/lyon.json',
  ])('answers 404 without calling TomTom for %s', async (path) => {
    const { response, fetchImpl } = await call(path);
    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each(['POST', 'PUT', 'DELETE', 'PATCH'])('answers 405 for %s', async (method) => {
    const { response, fetchImpl } = await call(ROUTE, { method });
    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('GET');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ['no origin headers', {}],
    ['cross-site fetch', { 'Sec-Fetch-Site': 'cross-site' }],
    ['same-site fetch', { 'Sec-Fetch-Site': 'same-site' }],
    ['address bar navigation', { 'Sec-Fetch-Site': 'none' }],
    ['foreign Origin', { Origin: 'https://evil.example' }],
  ])('answers 403 for %s', async (_label, headers) => {
    const { response, fetchImpl } = await call(ROUTE, { headers });
    expect(response.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts an Origin header equal to its own origin', async () => {
    const { response } = await call(ROUTE, { headers: { Origin: ORIGIN } });
    expect(response.status).toBe(200);
  });

  it.each([undefined, '', '   '])('answers 503 when the secret is %j', async (secret) => {
    const { response, fetchImpl } = await call(ROUTE, {
      env: makeEnv({ TOMTOM_API_KEY: secret }),
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'proxy-not-configured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('passes TomTom status, body and content type through, and nothing else', async () => {
    const fetchImpl = vi.fn<Parameters<Fetcher>, ReturnType<Fetcher>>(() =>
      Promise.resolve(
        new Response('{"detailedError":{"code":"NO_ROUTE_FOUND"}}', {
          status: 400,
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Tracking-ID': 'abc',
          },
        }),
      ),
    );
    const { response } = await call(ROUTE, { fetchImpl });
    expect(response.status).toBe(400);
    expect(await response.text()).toBe('{"detailedError":{"code":"NO_ROUTE_FOUND"}}');
    expect(response.headers.get('Content-Type')).toBe('application/json;charset=UTF-8');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(response.headers.get('Tracking-ID')).toBeNull();
  });

  it('answers 429 when the caller is over the rate limit, keyed by client IP', async () => {
    const limit = vi.fn(() => Promise.resolve({ success: false }));
    const { response, fetchImpl } = await call(ROUTE, {
      headers: { ...SAME_ORIGIN, 'CF-Connecting-IP': '203.0.113.7' },
      env: makeEnv({ API_RATE_LIMITER: { limit } }),
    });
    expect(response.status).toBe(429);
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not spend rate-limit budget on rejected requests', async () => {
    const limit = vi.fn(() => Promise.resolve({ success: true }));
    const env = makeEnv({ API_RATE_LIMITER: { limit } });
    await call('/api/other', { env });
    await call(ROUTE, { env, headers: {} });
    await call(ROUTE, { env, method: 'POST' });
    expect(limit).not.toHaveBeenCalled();
  });

  it('answers 502 when TomTom cannot be reached', async () => {
    const fetchImpl = vi.fn<Parameters<Fetcher>, ReturnType<Fetcher>>(() =>
      Promise.reject(new TypeError('fetch failed')),
    );
    const { response } = await call(ROUTE, { fetchImpl });
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'upstream-unreachable' });
  });
});
