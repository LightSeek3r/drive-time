import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Place } from '../../domain/types';
import { I18nProvider } from '../../i18n';
import { SetPlaceDialog } from './SetPlaceDialog';

const place: Place = {
  id: 'p',
  label: 'Part-Dieu',
  address: 'Part-Dieu, Lyon',
  position: { lat: 45.76, lon: 4.85 },
};

vi.mock('../../hooks/usePlaceSearch', () => ({
  usePlaceSearch: ({ query }: { query: string }) =>
    query.length >= 3
      ? { suggestions: [place], status: 'ready', error: null }
      : { suggestions: [], status: 'idle', error: null },
}));

function setup(target: 'home' | 'work' | null = 'work') {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <I18nProvider lang="en">
      <SetPlaceDialog target={target} lang="en" onSave={onSave} onClose={onClose} />
    </I18nProvider>,
  );
  return { onSave, onClose };
}

describe('SetPlaceDialog', () => {
  it('stays closed without a target', () => {
    setup(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('searches, picks and saves the place under the chosen name', async () => {
    const { onSave } = setup('work');
    expect(screen.getByRole('dialog', { name: 'Set Work' })).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByRole('combobox'), 'par');
    await userEvent.click(screen.getByRole('option', { name: /Part-Dieu/ }));
    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(onSave).toHaveBeenCalledWith('work', place);
  });

  it('closes without saving', async () => {
    const { onSave, onClose } = setup('home');
    await userEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]!);
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
