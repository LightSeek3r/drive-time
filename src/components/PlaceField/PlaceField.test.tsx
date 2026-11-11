import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Place } from '../../domain/types';
import { I18nProvider } from '../../i18n';
import { PlaceField, type SearchStatus } from './PlaceField';

const places: Place[] = [
  { id: 'a', label: 'Part-Dieu', address: 'Part-Dieu, Lyon', position: { lat: 45.76, lon: 4.85 } },
  { id: 'b', label: 'Perrache', address: 'Perrache, Lyon', position: { lat: 45.75, lon: 4.82 } },
];

function Harness({
  suggestions = places,
  status = 'ready',
  onSelect,
}: {
  suggestions?: Place[];
  status?: SearchStatus;
  onSelect: (place: Place) => void;
}) {
  const [value, setValue] = useState<Place | null>(null);
  return (
    <I18nProvider lang="en">
      <PlaceField
        label="To"
        value={value}
        suggestions={suggestions}
        status={status}
        onQueryChange={vi.fn()}
        onSelect={(place) => {
          setValue(place);
          onSelect(place);
        }}
      />
    </I18nProvider>
  );
}

describe('PlaceField combobox', () => {
  it('exposes combobox semantics and opens a listbox while typing', async () => {
    render(<Harness onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: 'To' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(input, 'par');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('moves with the arrow keys and picks with Enter', async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'par');
    await userEvent.keyboard('{ArrowDown}');
    const [first, second] = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', first!.id);
    await userEvent.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', second!.id);
    expect(second).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', second!.id);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(places[1]);
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape without choosing', async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'par');
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('selects a suggestion by pointer', async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    await userEvent.type(screen.getByRole('combobox'), 'per');
    await userEvent.click(screen.getByRole('option', { name: /Perrache/ }));
    expect(onSelect).toHaveBeenCalledWith(places[1]);
  });

  it('says so when nothing matches', async () => {
    render(<Harness suggestions={[]} status="ready" onSelect={vi.fn()} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('No places found');
  });

  it('shows the given message when the search fails', async () => {
    render(
      <I18nProvider lang="en">
        <PlaceField
          label="To"
          value={null}
          suggestions={[]}
          status="error"
          errorMessage="Key missing"
          onQueryChange={vi.fn()}
          onSelect={vi.fn()}
        />
      </I18nProvider>,
    );
    await userEvent.type(screen.getByRole('combobox'), 'abc');
    expect(screen.getByRole('status')).toHaveTextContent('Key missing');
  });
});

describe('PlaceField saved-place shortcuts', () => {
  function renderWithShortcut() {
    const onChoose = vi.fn();
    const run = vi.fn();
    render(
      <I18nProvider lang="en">
        <PlaceField
          label="To"
          value={null}
          suggestions={[]}
          status="idle"
          onQueryChange={vi.fn()}
          onSelect={vi.fn()}
          shortcuts={[
            {
              id: 'saved-home',
              label: 'Home',
              address: '14 Rue des Lilas, Lyon',
              icon: 'home',
              onChoose,
              edit: { label: 'Change Home', run },
            },
            { id: 'set-work', label: 'Set Work', icon: 'plus', setup: true, onChoose: vi.fn() },
          ]}
        />
      </I18nProvider>,
    );
    return { onChoose, run };
  }

  it('edits a saved place from its own button without choosing it', async () => {
    const { onChoose, run } = renderWithShortcut();
    await userEvent.click(screen.getByRole('combobox', { name: 'To' }));
    await userEvent.click(screen.getByRole('button', { name: 'Change Home' }));
    expect(run).toHaveBeenCalledOnce();
    expect(onChoose).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'To' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('offers no edit button on a place that is not saved yet', async () => {
    renderWithShortcut();
    await userEvent.click(screen.getByRole('combobox', { name: 'To' }));
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('edits the highlighted saved place with ArrowRight', async () => {
    const { onChoose, run } = renderWithShortcut();
    await userEvent.click(screen.getByRole('combobox', { name: 'To' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(run).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    expect(run).toHaveBeenCalledOnce();
    expect(onChoose).not.toHaveBeenCalled();
  });
});
