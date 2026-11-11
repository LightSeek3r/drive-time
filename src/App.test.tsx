import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { buildSlots, summarise, toEstimate } from './domain/departures';
import type { Place, ProviderErrorKind, SlotState } from './domain/types';
import type { DepartureEstimatesResult } from './hooks/useDepartureEstimates';
import { I18nProvider } from './i18n';
import { lastTripStore, placesStore, settingsStore } from './storage/stores';

const mocks = vi.hoisted(() => ({
  estimates: vi.fn(),
  search: vi.fn(),
  online: vi.fn(),
}));

vi.mock('./hooks/useDepartureEstimates', () => ({ useDepartureEstimates: mocks.estimates }));
vi.mock('./hooks/usePlaceSearch', () => ({ usePlaceSearch: mocks.search }));
vi.mock('./hooks/useOnline', () => ({ useOnline: mocks.online }));

const home: Place = {
  id: 'home',
  label: 'Maison',
  address: '14 Rue des Lilas, Lyon',
  position: { lat: 45.75, lon: 4.84 },
};
const work: Place = {
  id: 'work',
  label: 'Bureau',
  address: 'Part-Dieu, Lyon',
  position: { lat: 45.76, lon: 4.85 },
};

const BASE = new Date(2099, 0, 5, 7, 45);
const MINUTES = [33, 37, 42, 40, 36, 32, 30, 29, 27];

function readySlots(): SlotState[] {
  return buildSlots(BASE, 15, 9).map((slot, index) => ({
    status: 'ready',
    estimate: toEstimate(slot, {
      durationSec: (MINUTES[index] ?? 0) * 60,
      freeFlowSec: 1500,
      distanceM: 14000,
    }),
  }));
}

function resultWith(overrides: Partial<DepartureEstimatesResult> = {}): DepartureEstimatesResult {
  const slots = readySlots();
  const summary = summarise(slots.flatMap((s) => (s.status === 'ready' ? [s.estimate] : [])));
  return {
    slots,
    summary: summary.best === undefined ? undefined : summary,
    status: 'done',
    error: null,
    isSample: false,
    baseTime: BASE,
    updatedAt: new Date(2099, 0, 5, 7, 31),
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderApp() {
  return render(
    <I18nProvider lang="en">
      <App />
    </I18nProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  placesStore.set({});
  lastTripStore.set({ from: null, to: null });
  settingsStore.set({ lang: 'en' });
  mocks.estimates.mockReset().mockReturnValue(resultWith());
  mocks.search.mockReset().mockReturnValue({ suggestions: [], status: 'idle', error: null });
  mocks.online.mockReset().mockReturnValue(true);
});

describe('App', () => {
  it('renders heading', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /Home Timer/i })).toBeInTheDocument();
  });

  it('answers first, then shows nine departures with the best one tagged', () => {
    placesStore.set({ home, work });
    renderApp();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/9[:.]45/);
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('rowheader')).toHaveLength(9);
    expect(within(table).getByText('BEST')).toBeInTheDocument();
  });

  it('starts from the saved places on first launch', () => {
    placesStore.set({ home, work });
    renderApp();
    expect(screen.getByRole('combobox', { name: 'From' })).toHaveValue(
      'Home — 14 Rue des Lilas, Lyon',
    );
    expect(screen.getByRole('combobox', { name: 'To' })).toHaveValue('Work — Part-Dieu, Lyon');
    expect(mocks.estimates).toHaveBeenCalledWith(expect.objectContaining({ from: home, to: work }));
  });

  it('swaps origin and destination', async () => {
    placesStore.set({ home, work });
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Swap origin and destination' }));
    expect(lastTripStore.get()).toEqual({ from: work, to: home });
  });

  it('fills the To field from a saved chip by default, From once it was focused', async () => {
    placesStore.set({ home, work });
    lastTripStore.set({ from: null, to: null });
    renderApp();
    await userEvent.click(screen.getByRole('combobox', { name: 'From' }));
    await userEvent.click(screen.getByRole('button', { name: 'Work' }));
    expect(lastTripStore.get().from).toEqual(work);
  });

  it('labels the sample data until both places are chosen', () => {
    mocks.estimates.mockReturnValue(resultWith({ isSample: true, updatedAt: null }));
    renderApp();
    expect(screen.getByText('SAMPLE DATA')).toBeInTheDocument();
    const notice = screen.getByText(
      "Sample data. Choose where you leave from and where you're going.",
    );
    expect(notice.closest('[role]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add key' })).not.toBeInTheDocument();
  });

  it('saves the language from Settings', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Français' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(settingsStore.get().lang).toBe('fr');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('passes a chosen start time to the estimates', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('radio', { name: 'Leave at…' }));
    expect(mocks.estimates).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: expect.objectContaining({ mode: 'at' }) }),
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Now' }));
    expect(mocks.estimates).toHaveBeenLastCalledWith(
      expect.objectContaining({ start: { mode: 'now' } }),
    );
  });

  it('warns when the device is offline', () => {
    mocks.online.mockReturnValue(false);
    renderApp();
    expect(screen.getByText('You are offline')).toBeInTheDocument();
  });

  it('names an unavailable service and offers a retry', async () => {
    const refresh = vi.fn();
    const error: ProviderErrorKind = 'unavailable';
    mocks.estimates.mockReturnValue(
      resultWith({ summary: undefined, slots: [], status: 'error', error, refresh }),
    );
    placesStore.set({ home, work });
    renderApp();
    expect(screen.getByRole('alert')).toHaveTextContent('The service is unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('asks the estimates hook to refresh', async () => {
    const refresh = vi.fn();
    mocks.estimates.mockReturnValue(resultWith({ refresh }));
    placesStore.set({ home, work });
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('opens a search dialog for an unsaved Home chip and saves the chosen place', async () => {
    mocks.search.mockReturnValue({ suggestions: [home], status: 'ready', error: null });
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Set Home' }));
    const dialog = screen.getByRole('dialog', { name: 'Set Home' });
    await userEvent.type(within(dialog).getByRole('combobox'), 'lil');
    await userEvent.click(within(dialog).getByRole('option', { name: /Maison/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(placesStore.get().home).toEqual(home);
  });
});
