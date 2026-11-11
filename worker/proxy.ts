const UPSTREAM = 'https://api.tomtom.com/';

const COORD = String.raw`-?\d{1,3}(?:\.\d{1,8})?`;

interface Endpoint {
  /** Capture group 1 is the TomTom path, without the `/api/` prefix. */
  pattern: RegExp;
  params: readonly string[];
}

// Only the two calls the app makes, so the key cannot be spent on any other TomTom endpoint.
const ENDPOINTS: readonly Endpoint[] = [
  {
    pattern: new RegExp(
      `^/api/(routing/1/calculateRoute/${COORD},${COORD}:${COORD},${COORD}/json)$`,
    ),
    params: ['departAt', 'traffic', 'computeTravelTimeFor', 'routeType', 'travelMode'],
  },
  {
    pattern: /^\/api\/(search\/2\/search\/[^/]{1,300}\.json)$/,
    params: ['typeahead', 'limit', 'language', 'lat', 'lon'],
  },
];

export type Fetcher = (input: string) => Promise<Response>;

export interface Env {
  TOMTOM_API_KEY?: string;
  API_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

// A speed bump against other sites embedding the proxy: non-browser clients can forge both headers.
// The rate limit is the real guard.
function isSameOrigin(request: Request, url: URL): boolean {
  const site = request.headers.get('Sec-Fetch-Site');
  if (site !== null) return site === 'same-origin';
  return request.headers.get('Origin') === url.origin;
}

export async function handleApiRequest(
  request: Request,
  env: Env,
  fetchImpl: Fetcher = fetch,
): Promise<Response> {
  if (request.method !== 'GET') return json({ error: 'method-not-allowed' }, 405, { Allow: 'GET' });

  const url = new URL(request.url);
  let upstreamPath: string | undefined;
  let allowed: readonly string[] = [];
  for (const endpoint of ENDPOINTS) {
    const match = endpoint.pattern.exec(url.pathname);
    if (match?.[1] !== undefined) {
      upstreamPath = match[1];
      allowed = endpoint.params;
      break;
    }
  }
  if (upstreamPath === undefined) return json({ error: 'not-found' }, 404);

  if (!isSameOrigin(request, url)) return json({ error: 'forbidden' }, 403);

  const apiKey = env.TOMTOM_API_KEY?.trim();
  if (!apiKey) return json({ error: 'proxy-not-configured' }, 503);

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success } = await env.API_RATE_LIMITER.limit({ key: ip });
  if (!success) return json({ error: 'rate-limited' }, 429, { 'Retry-After': '60' });

  const upstreamUrl = new URL(upstreamPath, UPSTREAM);
  for (const name of allowed) {
    const value = url.searchParams.get(name);
    if (value !== null) upstreamUrl.searchParams.set(name, value);
  }
  upstreamUrl.searchParams.set('key', apiKey);

  let upstream: Response;
  try {
    upstream = await fetchImpl(upstreamUrl.toString());
  } catch {
    return json({ error: 'upstream-unreachable' }, 502);
  }

  // Copy only the content type: TomTom's other headers (CORS, tracking ids) mean nothing to our own origin.
  const headers = new Headers({ 'Cache-Control': 'no-store' });
  const contentType = upstream.headers.get('Content-Type');
  if (contentType !== null) headers.set('Content-Type', contentType);
  return new Response(upstream.body, { status: upstream.status, headers });
}
