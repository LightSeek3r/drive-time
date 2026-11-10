import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ProviderErrorKind } from '../../domain/types';
import { I18nProvider } from '../../i18n';
import { en } from '../../i18n/en';
import { ErrorBanner } from './ErrorBanner';

function setup(kind: ProviderErrorKind) {
  const onOpenSettings = vi.fn();
  const onRetry = vi.fn();
  const view = render(
    <I18nProvider lang="en">
      <ErrorBanner kind={kind} onOpenSettings={onOpenSettings} onRetry={onRetry} />
    </I18nProvider>,
  );
  return { ...view, onOpenSettings, onRetry };
}

describe('ErrorBanner', () => {
  it.each([
    ['bad-key', en.error_bad_key],
    ['missing-key', en.error_missing_key],
    ['rate-limited', en.error_rate_limited],
    ['no-route', en.error_no_route],
    ['offline', en.error_offline],
    ['unknown', en.error_unknown],
  ] as const)('names the problem for %s', (kind, message) => {
    setup(kind);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('offers Settings for a key problem', async () => {
    const { onOpenSettings } = setup('bad-key');
    await userEvent.click(screen.getByRole('button', { name: en.error_action_settings }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('offers a retry when waiting can fix it', async () => {
    const { onRetry } = setup('rate-limited');
    await userEvent.click(screen.getByRole('button', { name: en.error_action_retry }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has no button when only a different search helps', () => {
    setup('no-route');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('stays silent for an aborted request', () => {
    const { container } = setup('aborted');
    expect(container).toBeEmptyDOMElement();
  });
});
