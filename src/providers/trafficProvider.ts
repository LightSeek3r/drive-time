import type { LatLng, Lang, Place, ProviderErrorKind, RouteEstimate } from '../domain/types';

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;

  constructor(kind: ProviderErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'ProviderError';
    this.kind = kind;
  }
}

export interface SuggestRequest {
  query: string;
  lang: Lang;
  /** Bias results toward this point (usually the user's location or origin). */
  near?: LatLng;
  signal?: AbortSignal;
}

export interface RouteRequest {
  from: LatLng;
  to: LatLng;
  departAt: Date;
  signal?: AbortSignal;
}

/** The seam between the app and a routing vendor. TomTom is the only implementation in v1. */
export interface TrafficProvider {
  /** Place autocomplete. Rejects with ProviderError. */
  suggest(request: SuggestRequest): Promise<Place[]>;
  /** One departure time -> one estimate. Rejects with ProviderError. */
  route(request: RouteRequest): Promise<RouteEstimate>;
}
