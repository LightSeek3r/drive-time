import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { StatusFooter } from './StatusFooter';

function setup(updatedAt: Date | null) {
  const onRefresh = vi.fn();
  render(
    <I18nProvider lang="en">
      <StatusFooter updatedAt={updatedAt} onRefresh={onRefresh} />
    </I18nProvider>,
  );
  return { onRefresh };
}

describe('StatusFooter', () => {
  it('says the figures are estimates and when they were updated', () => {
    setup(new Date(2026, 10, 10, 7, 31));
    expect(
      screen.getByText(/Estimated from typical traffic · updated .*7[:.]31/),
    ).toBeInTheDocument();
  });

  it('omits the update time before the first run (sample data)', () => {
    setup(null);
    expect(screen.getByText('Estimated from typical traffic')).toBeInTheDocument();
  });

  it('refreshes on demand', async () => {
    const { onRefresh } = setup(null);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
