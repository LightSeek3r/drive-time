import { toRfc3339 } from '../domain/departures';
import type { Lang, LatLng, Place, RouteEstimate } from '../domain/types';
import {
  ProviderError,
  type RouteRequest,
  type SuggestRequest,
  type TrafficProvider,
} from './trafficProvider';

const ROUTING_URL = 'https://api.tomtom.com/routing/1/calculateRoute/';
const SEARCH_URL = 'https://api.tomtom.com/search/2/search/';
const SUGGEST_LIMIT = 6;

const SEARCH_LANGUAGE: Record<Lang, string> = { en: 'en-GB', fr: 'fr-FR' };

// MAP_MATCHING_FAILURE = a point is not near a drivable road; to the user that is also "no route".
const NO_ROUTE_CODES = /NO_ROUTE_FOUND|MAP_MATCHING_FAILURE/;
// Search docs list "Rate or volume limit exceeded" as a 403 cause; it must not read as a bad key.
const QUOTA_403 = /limit|qps|quota/i;

export interface TomTomOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export function createTomTomProvider({ apiKey, fetchImpl }: TomTomOptions): TrafficProvider {
  const key = apiKey.trim();
  // A plain call, never `opts.fetchImpl(...)`: browsers throw "Illegal invocation" when fetch's `this` is not window.
  const doFetch: typeof fetch = fetchImpl ?? ((input, init) => fetch(input, init));

  async function getJson(url: URL, signal: AbortSignal | undefined): Promise<unknown> {
    if (key === '') throw new ProviderError('missing-key', 'TomTom API key is not set');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new ProviderError('offline', 'Device is offline');
    }
    url.searchParams.set('key', key);
    try {
      const response = await doFetch(url.toString(), { signal });
      if (!response.ok) throw await httpError(response);
      return await response.json();
    } catch (error) {
      throw toProviderError(error, signal);
    }
  }

  return {
    async route({ from, to, departAt, signal }: RouteRequest): Promise<RouteEstimate> {
      const url = new URL(`${ROUTING_URL}${formatPoint(from)}:${formatPoint(to)}/json`);
      url.searchParams.set('departAt', toRfc3339(departAt));
      url.searchParams.set('traffic', 'true');
      url.searchParams.set('computeTravelTimeFor', 'all');
      url.searchParams.set('routeType', 'fastest');
      url.searchParams.set('travelMode', 'car');
      return parseRoute(await getJson(url, signal));
    },

    async suggest({ query, lang, near, signal }: SuggestRequest): Promise<Place[]> {
      const trimmed = query.trim();
      if (trimmed === '') return [];
      const url = new URL(`${SEARCH_URL}${encodeURIComponent(trimmed)}.json`);
      url.searchParams.set('typeahead', 'true');
      url.searchParams.set('limit', String(SUGGEST_LIMIT));
      url.searchParams.set('language', SEARCH_LANGUAGE[lang]);
      if (near) {
        url.searchParams.set('lat', near.lat.toFixed(6));
        url.searchParams.set('lon', near.lon.toFixed(6));
      }
      return parseSearch(await getJson(url, signal));
    },
  };
}

function formatPoint({ lat, lon }: LatLng): string {
  // toFixed avoids exponent notation (String(1e-7) === "1e-7") in the URL path.
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

async function httpError(response: Response): Promise<ProviderError> {
  const { status } = response;
  if (status === 429) return new ProviderError('rate-limited', 'TomTom HTTP 429');
  if (status === 401 || status === 403) {
    const body = await response.text();
    return status === 403 && QUOTA_403.test(body)
      ? new ProviderError('rate-limited', 'TomTom HTTP 403 (quota)')
      : new ProviderError('bad-key', `TomTom HTTP ${status}`);
  }
  if (status === 400 || status === 404) {
    const code = detailedErrorText(await response.text());
    if (code !== undefined && NO_ROUTE_CODES.test(code)) {
      return new ProviderError('no-route', `TomTom HTTP ${status}: ${code}`);
    }
    return new ProviderError('unknown', `TomTom HTTP ${status}${code ? `: ${code}` : ''}`);
  }
  return new ProviderError('unknown', `TomTom HTTP ${status}`);
}

/** `code` plus `message` of a TomTom JSON error body; docs say to match substrings of either. */
function detailedErrorText(body: string): string | undefined {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return undefined; // not JSON (e.g. the XML gateway errors): nothing to match, caller maps to 'unknown'
  }
  const detail = isRecord(json) ? json.detailedError : undefined;
  if (!isRecord(detail)) return undefined;
  const parts = [detail.code, detail.message].filter((p): p is string => typeof p === 'string');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

function toProviderError(error: unknown, signal: AbortSignal | undefined): ProviderError {
  if (error instanceof ProviderError) return error;
  const name = errorName(error);
  if (signal?.aborted || name === 'AbortError') return new ProviderError('aborted');
  // fetch rejects with TypeError on network failure. TomTom sends CORS headers on 401/403 too
  // (checked live), so a TypeError here is a real network problem, not a masked auth error.
  if (name === 'TypeError') return new ProviderError('offline', 'Network request failed');
  if (name === 'SyntaxError') return new ProviderError('unknown', 'TomTom returned invalid JSON');
  return new ProviderError('unknown', name ? `Unexpected ${name}` : 'Unexpected error');
}

function errorName(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('name' in error)) return undefined;
  return typeof error.name === 'string' ? error.name : undefined;
}

function malformed(what: string): ProviderError {
  return new ProviderError('unknown', `Malformed TomTom ${what} response`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isLatLng(value: unknown): value is LatLng {
  return (
    isRecord(value) &&
    typeof value.lat === 'number' &&
    typeof value.lon === 'number' &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lon) <= 180
  );
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function parseRoute(json: unknown): RouteEstimate {
  const routes = isRecord(json) ? json.routes : undefined;
  if (!Array.isArray(routes)) throw malformed('routing');
  const route: unknown = routes[0];
  if (route === undefined) throw new ProviderError('no-route', 'TomTom returned no routes');
  const summary = isRecord(route) ? route.summary : undefined;
  if (!isRecord(summary)) throw malformed('routing');

  const { travelTimeInSeconds, noTrafficTravelTimeInSeconds, lengthInMeters } = summary;
  if (!isNonNegativeNumber(travelTimeInSeconds) || !isNonNegativeNumber(lengthInMeters)) {
    throw malformed('routing');
  }
  if (
    noTrafficTravelTimeInSeconds !== undefined &&
    !isNonNegativeNumber(noTrafficTravelTimeInSeconds)
  ) {
    throw malformed('routing');
  }
  return {
    durationSec: travelTimeInSeconds,
    freeFlowSec: noTrafficTravelTimeInSeconds ?? travelTimeInSeconds,
    distanceM: lengthInMeters,
  };
}

function parseSearch(json: unknown): Place[] {
  const results = isRecord(json) ? json.results : undefined;
  if (!Array.isArray(results)) throw malformed('search');
  return results.map(parsePlace);
}

function parsePlace(result: unknown): Place {
  if (!isRecord(result) || !isRecord(result.address) || !isLatLng(result.position)) {
    throw malformed('search');
  }
  const id = optionalString(result.id);
  const address = optionalString(result.address.freeformAddress);
  if (id === undefined || address === undefined) throw malformed('search');

  const poiName = isRecord(result.poi) ? optionalString(result.poi.name) : undefined;
  const streetName = optionalString(result.address.streetName);
  const streetNumber = optionalString(result.address.streetNumber);
  const street = streetName && streetNumber ? `${streetNumber} ${streetName}` : streetName;
  const locality =
    optionalString(result.address.municipality) ?? optionalString(result.address.localName);

  return {
    id: `tomtom:${id}`,
    label: poiName ?? street ?? locality ?? address,
    address,
    position: { lat: result.position.lat, lon: result.position.lon },
  };
}
