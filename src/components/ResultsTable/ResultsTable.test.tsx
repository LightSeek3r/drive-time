import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSlots, summarise, toEstimate } from '../../domain/departures';
import type { SlotState } from '../../domain/types';
import { I18nProvider } from '../../i18n';
import { ResultsTable } from './ResultsTable';
import { buildRows } from './rows';

const BASE = new Date(2026, 10, 10, 7, 45);
const MINUTES = [33, 37, 42, 40, 36, 32, 30, 29, 27];

function slots(): SlotState[] {
  return buildSlots(BASE, 15, 9).map((slot, index) => ({
    status: 'ready',
    estimate: toEstimate(slot, {
      durationSec: (MINUTES[index] ?? 0) * 60,
      freeFlowSec: 1500,
      distanceM: 14000,
    }),
  }));
}

function renderTable(
  states: SlotState[],
  now = new Date(2026, 10, 10, 7, 30),
  reduced = false,
  onSelect?: (departAt: Date) => void,
) {
  const ready = states.flatMap((s) => (s.status === 'ready' ? [s.estimate] : []));
  const summary = summarise(ready);
  const rows = buildRows(states, summary.best === undefined ? undefined : summary, now);
  return render(
    <I18nProvider lang="en">
      <ResultsTable rows={rows} drawKey="now" reducedMotion={reduced} onSelect={onSelect} />
    </I18nProvider>,
  );
}

describe('ResultsTable', () => {
  it('is a real table with a caption, five columns and nine body rows', () => {
    renderTable(slots());
    const table = screen.getByRole('table', { name: /Departure times/ });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(5);
    expect(within(table).getAllByRole('row')).toHaveLength(10);
    expect(within(table).getAllByRole('rowheader')).toHaveLength(9);
  });

  it('restarts the list at a tapped departure, but not at the first row', async () => {
    const onSelect = vi.fn();
    renderTable(slots(), undefined, false, onSelect);
    const rows = screen.getAllByRole('row').slice(1);

    await userEvent.click(rows[3]!);
    expect(onSelect).toHaveBeenLastCalledWith(new Date(2026, 10, 10, 8, 30));

    await userEvent.click(within(rows[2]!).getByRole('button', { name: /Start the list at/ }));
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith(new Date(2026, 10, 10, 8, 15));

    expect(within(rows[0]!).queryByRole('button')).not.toBeInTheDocument();
    await userEvent.click(rows[0]!);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('does not offer departures that already passed', () => {
    renderTable(slots(), new Date(2026, 10, 10, 8, 20), false, vi.fn());
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[1]!).queryByRole('button')).not.toBeInTheDocument();
    expect(within(rows[4]!).getByRole('button')).toBeInTheDocument();
  });

  it('scrolls the best row into view on request', async () => {
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function scrollIntoView(this: Element) {
      scrolled.push(this);
    };
    renderTable(slots());
    await userEvent.click(screen.getByRole('button', { name: 'Go to best time' }));
    expect(scrolled).toEqual([screen.getAllByRole('row')[9]]);
  });

  it('keeps the jump link in the layout but out of reach while there is no later best row', () => {
    renderTable(
      slots().map((state) => ({
        ...state,
        status: 'loading',
        slot: state.status === 'ready' ? state.estimate.slot : state.slot,
      })) as SlotState[],
    );
    const link = screen.getByText('Go to best time');
    expect(link).toBeDisabled();
    expect(link).toHaveAttribute('aria-hidden', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });

  it('explains the bar colours in a legend', () => {
    renderTable(slots());
    expect(screen.getByText('Trip at its fastest')).toBeInTheDocument();
    expect(screen.getByText('Extra minutes from traffic')).toBeInTheDocument();
  });

  it('tags the best row with text and the peak row with PEAK', () => {
    renderTable(slots());
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[8]!).getByText('BEST')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('PEAK')).toBeInTheDocument();
    expect(screen.getAllByText('BEST')).toHaveLength(1);
  });

  it('prints minutes and signed differences against the first slot', () => {
    renderTable(slots());
    const rows = screen.getAllByRole('row').slice(1);
    const cells = within(rows[8]!).getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('27');
    expect(cells[3]).toHaveTextContent('−6');
    expect(within(rows[1]!).getAllByRole('cell')[3]).toHaveTextContent('+4');
    expect(within(rows[0]!).getAllByRole('cell')[3]).toHaveTextContent('—');
  });

  it('shows a skeleton for loading rows and a retry hint for failed ones', () => {
    const base = buildSlots(BASE, 15, 3);
    renderTable([
      { status: 'loading', slot: base[0]! },
      { status: 'error', slot: base[1]!, kind: 'unknown' },
      { status: 'loading', slot: base[2]! },
    ]);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveAttribute('aria-busy', 'true');
    expect(within(rows[1]!).getByText('Could not load · Refresh')).toBeInTheDocument();
  });

  it('strikes through departures whose time has passed', () => {
    renderTable(slots(), new Date(2026, 10, 10, 8, 5));
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]!.className).toMatch(/spent/);
    expect(rows[1]!.className).toMatch(/spent/);
    expect(rows[2]!.className).not.toMatch(/spent/);
  });

  it('marks every bar as still under reduced motion', () => {
    renderTable(slots(), new Date(2026, 10, 10, 7, 30), true);
    for (const road of screen.getAllByTestId('road')) expect(road.className).toMatch(/still/);
  });

  it('draws bars that stay in the shared scale: the trip is as wide in every row', () => {
    renderTable(slots());
    const trips = screen
      .getAllByTestId('road')
      .map((road) => road.style.getPropertyValue('--trip'));
    expect(new Set(trips).size).toBe(1);
  });
});
