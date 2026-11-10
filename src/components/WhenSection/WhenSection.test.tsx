import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { StartTime } from '../../domain/types';
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

  it('sets a start time from the native input and never allows the past', () => {
    const { onChange } = setup({ mode: 'now' });
    const input = screen.getByLabelText('Leave at');
    expect(input).toHaveAttribute('type', 'datetime-local');
    expect(input).toHaveAttribute('min', '2026-11-10T07:31');
    fireEvent.change(input, { target: { value: '2026-11-11T08:15' } });
    expect(onChange).toHaveBeenCalledWith({ mode: 'at', at: new Date(2026, 10, 11, 8, 15) });
  });

  it('opens the picker from Change', async () => {
    setup({ mode: 'now' });
    const input = screen.getByLabelText('Leave at') as HTMLInputElement;
    const showPicker = vi.fn();
    input.showPicker = showPicker;
    await userEvent.click(screen.getByRole('button', { name: 'Change departure time' }));
    expect(showPicker).toHaveBeenCalledOnce();
  });
});
