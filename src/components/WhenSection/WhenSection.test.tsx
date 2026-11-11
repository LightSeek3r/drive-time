import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StartTime } from '../../domain/types';
import { formatHour } from '../../format/time';
import { I18nProvider } from '../../i18n';
import { WhenSection } from './WhenSection';

const now = new Date(2026, 10, 10, 7, 31);

function setup(start: StartTime) {
  const onChange = vi.fn();
  render(
    <I18nProvider lang="en">
      <WhenSection start={start} now={now} onChange={onChange} />
    </I18nProvider>,
  );
  return { onChange };
}

describe('WhenSection', () => {
  it('reflects the start mode in the segmented control', () => {
    setup({ mode: 'now' });
    expect(screen.getByRole('radio', { name: 'Now' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Leave at…' })).not.toBeChecked();
  });

  it('switches to Leave at on the next quarter hour', async () => {
    const { onChange } = setup({ mode: 'now' });
    await userEvent.click(screen.getByRole('radio', { name: 'Leave at…' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'at', at: new Date(2026, 10, 10, 7, 45) });
  });

  it('switches back to Now', async () => {
    const { onChange } = setup({ mode: 'at', at: new Date(2026, 10, 10, 9, 0) });
    await userEvent.click(screen.getByRole('radio', { name: 'Now' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'now' });
  });

  it('shows the chosen day and time', () => {
    setup({ mode: 'at', at: new Date(2026, 10, 10, 7, 45) });
    expect(screen.getByText(/^Today, .*7[:.]45/)).toBeInTheDocument();
  });

  it('opens the picker when Leave at is chosen', async () => {
    setup({ mode: 'now' });
    expect(screen.queryByRole('dialog', { name: 'Leave at' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Leave at…' }));
    expect(screen.getByRole('dialog', { name: 'Leave at' })).toBeInTheDocument();
  });

  it('sets a start time from the picker', async () => {
    const { onChange } = setup({ mode: 'now' });
    await userEvent.click(screen.getByRole('button', { name: 'Change departure time' }));
    await userEvent.click(screen.getByRole('radio', { name: /^Tomorrow/ }));
    await userEvent.click(screen.getByRole('radio', { name: formatHour(8) }));
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Minute' })).getByRole('radio', { name: '15' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Set time' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'at', at: new Date(2026, 10, 11, 8, 15) });
    expect(screen.queryByRole('dialog', { name: 'Leave at' })).not.toBeInTheDocument();
  }, 15_000);

  it('leaves the start time alone when the picker is cancelled', async () => {
    const { onChange } = setup({ mode: 'now' });
    await userEvent.click(screen.getByRole('button', { name: 'Change departure time' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
