import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { formatHour } from '../../format/time';
import { I18nProvider } from '../../i18n';
import { TimePickerSheet } from './TimePickerSheet';

// 07:31 rounds up to 07:35, the earliest pickable time.
const now = new Date(2026, 10, 10, 7, 31);

function setup(initial = new Date(2026, 10, 10, 7, 45)) {
  const onApply = vi.fn();
  const onClose = vi.fn();
  render(
    <I18nProvider lang="en">
      <TimePickerSheet open now={now} initial={initial} onApply={onApply} onClose={onClose} />
    </I18nProvider>,
  );
  return { onApply, onClose };
}

describe('TimePickerSheet', () => {
  it('opens on the given time and previews it', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Leave at' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^Today/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: formatHour(7) })).toBeChecked();
    expect(screen.getByRole('radio', { name: '45' })).toBeChecked();
    expect(screen.getByText(/^Today, 7[:.]45/)).toBeInTheDocument();
  });

  it('offers a week of days starting today', () => {
    setup();
    const days = screen.getByRole('group', { name: 'Day' });
    expect(within(days).getAllByRole('radio')).toHaveLength(7);
    expect(within(days).getAllByRole('radio')[0]).toBeChecked();
    expect(screen.getByRole('radio', { name: /^Tomorrow/ })).not.toBeChecked();
  });

  it('disables times that have already passed today', () => {
    setup();
    expect(screen.getByRole('radio', { name: formatHour(6) })).toBeDisabled();
    expect(screen.getByRole('radio', { name: formatHour(7) })).toBeEnabled();
    expect(screen.getByRole('radio', { name: '30' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: '35' })).toBeEnabled();
  });

  it('frees every time once a later day is chosen', async () => {
    setup();
    await userEvent.click(screen.getByRole('radio', { name: /^Tomorrow/ }));
    expect(screen.getByRole('radio', { name: formatHour(6) })).toBeEnabled();
    expect(screen.getByRole('radio', { name: '30' })).toBeEnabled();
  });

  it('falls back to the earliest time when going back to today lands in the past', async () => {
    setup(new Date(2026, 10, 11, 6, 0));
    expect(screen.getByRole('radio', { name: /^Tomorrow/ })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /^Today/ }));
    expect(screen.getByText(/^Today, 7[:.]35/)).toBeInTheDocument();
  });

  it('applies the chosen day, hour and minute', async () => {
    const { onApply } = setup();
    await userEvent.click(screen.getByRole('radio', { name: /^Tomorrow/ }));
    await userEvent.click(screen.getByRole('radio', { name: formatHour(8) }));
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Minute' })).getByRole('radio', { name: '15' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Set time' }));
    expect(onApply).toHaveBeenCalledWith(new Date(2026, 10, 11, 8, 15));
  }, 15_000);

  it('discards the choice on Cancel', async () => {
    const { onApply, onClose } = setup();
    await userEvent.click(screen.getByRole('radio', { name: formatHour(9) }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('moves between days with the arrow keys', async () => {
    setup();
    screen.getByRole('radio', { name: /^Today/ }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: /^Tomorrow/ })).toBeChecked();
  });
});
