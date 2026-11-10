import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { BrandBand } from './BrandBand';

describe('BrandBand', () => {
  it('names the app and opens settings', async () => {
    const onOpenSettings = vi.fn();
    render(
      <I18nProvider lang="en">
        <BrandBand onOpenSettings={onOpenSettings} />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Home Timer' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });
});
