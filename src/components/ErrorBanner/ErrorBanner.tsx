import type { ProviderErrorKind } from '../../domain/types';
import { useT } from '../../i18n';
import { Banner } from '../Banner/Banner';
import { ERROR_COPY } from './copy';

interface ErrorBannerProps {
  kind: ProviderErrorKind;
  onOpenSettings: () => void;
  onRetry: () => void;
}

export function ErrorBanner({ kind, onOpenSettings, onRetry }: ErrorBannerProps) {
  const t = useT();
  // An aborted request is the app cancelling itself, never something to tell the user.
  if (kind === 'aborted') return null;
  const { text, recovery } = ERROR_COPY[kind];
  const action =
    recovery === 'settings'
      ? { label: t('error_action_settings'), onClick: onOpenSettings }
      : recovery === 'retry'
        ? { label: t('error_action_retry'), onClick: onRetry }
        : undefined;
  return (
    <Banner tone="error" icon="alert" role="alert" action={action}>
      {t(text)}
    </Banner>
  );
}
