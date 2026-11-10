import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Place } from '../../domain/types';
import { I18nProvider } from '../../i18n';
import { RouteSection } from './RouteSection';

vi.mock('../../hooks/usePlaceSearch', () => ({
  usePlaceSearch: () => ({ suggestions: [], status: 'idle', error: null }),
}));

const home: Place = {
  id: 'h',
  label: 'Maison',
  address: '14 Rue des Lilas, Lyon',
  position: { lat: 45.75, lon: 4.84 },
};
const work: Place = {
  id: 'w',
  label: 'Bureau',
  address: 'Part-Dieu, Lyon',
  position: { lat: 45.76, lon: 4.85 },
};
const oneOff: Place = {
  id: 'x',
  label: 'Gare',
  address: 'Gare de Perrache, Lyon',
  position: { lat: 45.74, lon: 4.82 },
};

function setup(props: Partial<ComponentProps<typeof RouteSection>> = {}) {
  const handlers = {
    onActivate: vi.fn(),
    onPick: vi.fn(),
    onSwap: vi.fn(),
    onLocate: vi.fn(),
    onSaveAs: vi.fn(),
    onSetUp: vi.fn(),
  };
  render(
    <I18nProvider lang="en">
      <RouteSection
        from={home}
        to={work}
        saved={{ home, work }}
        activeField="to"
        geo={{ status: 'idle' }}
        apiKey="k"
        lang="en"
        isSample={false}
        {...handlers}
        {...props}
      />
    </I18nProvider>,
  );
  return handlers;
}

describe('RouteSection', () => {
  it('fills the active field from a saved chip', async () => {
    const { onPick } = setup({ activeField: 'to' });
    await userEvent.click(screen.getByRole('button', { name: 'Home' }));
    expect(onPick).toHaveBeenCalledWith('to', home);
  });

  it('tracks the last focused field as the chip target', async () => {
    const { onActivate } = setup();
    await userEvent.click(screen.getByRole('combobox', { name: 'From' }));
    expect(onActivate).toHaveBeenCalledWith('from');
  });

  it('opens set-up for an unsaved chip', async () => {
    const { onSetUp } = setup({ saved: { home } });
    await userEvent.click(screen.getByRole('button', { name: 'Set Work' }));
    expect(onSetUp).toHaveBeenCalledWith('work');
  });

  it('offers to save a one-off place, and not a saved one', async () => {
    const { onSaveAs } = setup({ to: oneOff });
    await userEvent.click(screen.getByRole('button', { name: 'Save as Work' }));
    expect(onSaveAs).toHaveBeenCalledWith('work');
  });

  it('does not offer saving when the field holds a saved place', () => {
    setup();
    expect(screen.queryByRole('button', { name: /Save as/ })).not.toBeInTheDocument();
  });

  it('swaps and locates', async () => {
    const { onSwap, onLocate } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Swap origin and destination' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(onSwap).toHaveBeenCalledOnce();
    expect(onLocate).toHaveBeenCalledOnce();
  });

  it('busies the locate button while locating', () => {
    setup({ geo: { status: 'locating' } });
    const button = screen.getByRole('button', { name: 'Locating…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it.each([
    [{ status: 'denied' }, 'Location access was denied'],
    [{ status: 'unavailable' }, 'Location is not available'],
    [{ status: 'error' }, 'Unable to retrieve your location'],
  ] as const)('explains a failed locate (%o)', (geo, message) => {
    setup({ geo });
    expect(screen.getByRole('status')).toHaveTextContent(message);
  });

  it('labels an empty route as a sample while demo data shows, and not otherwise', () => {
    setup({ from: null, to: null, saved: {}, isSample: true });
    expect(screen.getByRole('combobox', { name: 'From' })).toHaveAttribute(
      'placeholder',
      'Sample · Home',
    );
    expect(screen.getByRole('combobox', { name: 'To' })).toHaveAttribute(
      'placeholder',
      'Sample · Work',
    );
  });

  it('keeps the plain search hint outside sample mode', () => {
    setup({ from: null, to: null, saved: {} });
    expect(screen.getByRole('combobox', { name: 'From' })).toHaveAttribute(
      'placeholder',
      'Search places...',
    );
  });
});
