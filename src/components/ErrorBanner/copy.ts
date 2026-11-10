import type { ProviderErrorKind } from '../../domain/types';
import type { Messages } from '../../i18n/fr';

export type Recovery = 'settings' | 'retry' | 'none';

export const ERROR_COPY: Record<
  Exclude<ProviderErrorKind, 'aborted'>,
  { text: keyof Messages; recovery: Recovery }
> = {
  'bad-key': { text: 'error_bad_key', recovery: 'settings' },
  'missing-key': { text: 'error_missing_key', recovery: 'settings' },
  'rate-limited': { text: 'error_rate_limited', recovery: 'retry' },
  'no-route': { text: 'error_no_route', recovery: 'none' },
  offline: { text: 'error_offline', recovery: 'retry' },
  unknown: { text: 'error_unknown', recovery: 'retry' },
};
