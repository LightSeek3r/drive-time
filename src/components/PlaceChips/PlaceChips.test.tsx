import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Place, SavedPlaces } from '../../domain/types';
import { I18nProvider } from '../../i18n';
import { PlaceChips } from './PlaceChips';

const work: Place = {
  id: 'w',
  label: 'Part-Dieu',
  address: 'Part-Dieu, Lyon',
  position: { lat: 45.76, lon: 4.85 },
};

function setup(saved: SavedPlaces, activePlace: Place | null = null) {
  const onUse = vi.fn();
  const onSetUp = vi.fn();
  render(
    <I18nProvider lang="en">
      <PlaceChips saved={saved} activePlace={activePlace} onUse={onUse} onSetUp={onSetUp} />
    </I18nProvider>,
  );
  return { onUse, onSetUp };
}

describe('PlaceChips', () => {
  it('uses a saved place when its chip is pressed', async () => {
    const { onUse } = setup({ work });
    await userEvent.click(screen.getByRole('button', { name: 'Work' }));
    expect(onUse).toHaveBeenCalledWith(work);
  });

  it('marks the chip whose place fills the active field', () => {
    setup({ work }, work);
    expect(screen.getByRole('button', { name: 'Work' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers to set up an unsaved place instead of using it', async () => {
    const { onSetUp, onUse } = setup({ work });
    await userEvent.click(screen.getByRole('button', { name: 'Set Home' }));
    expect(onSetUp).toHaveBeenCalledWith('home');
    expect(onUse).not.toHaveBeenCalled();
  });
});
