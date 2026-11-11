import type { ProviderErrorKind } from '../../domain/types';
import type { Messages } from '../../i18n/fr';

export type Recovery = 'retry' | 'none';

export const ERROR_COPY: Record<
  Exclude<ProviderErrorKind, 'aborted'>,
  { text: keyof Messages; recovery: Recovery }
> = {
  unavailable: { text: 'error_unavailable', recovery: 'retry' },
  'rate-limited': { text: 'error_rate_limited', recovery: 'retry' },
  'no-route': { text: 'error_no_route', recovery: 'none' },
  offline: { text: 'error_offline', recovery: 'retry' },
  unknown: { text: 'error_unknown', recovery: 'retry' },
};
