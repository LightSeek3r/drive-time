import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSlots, summarise, toEstimate, type DepartureSummary } from '../../domain/departures';
import { I18nProvider } from '../../i18n';
import { AnswerPanel } from './AnswerPanel';

function summaryOf(minutes: number[]): DepartureSummary {
  const base = new Date(2026, 10, 10, 7, 45);
  const estimates = buildSlots(base, 15, minutes.length).map((slot, index) =>
    toEstimate(slot, {
      durationSec: (minutes[index] ?? 0) * 60,
      freeFlowSec: 1500,
      distanceM: 14000,
    }),
  );
  const summary = summarise(estimates);
  if (summary.best === undefined) throw new Error('fixture needs estimates');
  return summary;
}

function renderPanel(ui: ReactElement) {
  return render(<I18nProvider lang="en">{ui}</I18nProvider>);
}

describe('AnswerPanel', () => {
  it('leads with the best departure and compares it with the first slot and the peak', () => {
    renderPanel(
      <AnswerPanel
        state="ready"
        announceKey="route-1"
        isSample={false}
        startMode="at"
        summary={summaryOf([33, 37, 42, 40, 36, 32, 30, 29, 27])}
      />,
    );
    const headline = screen.getByRole('heading', { level: 2 });
    expect(headline).toHaveTextContent(/^Leave .*9[:.]45/);
    expect(screen.getByText(/arrive .*10[:.]12 — .*faster than/)).toHaveTextContent(
      /27 min, arrive .*10[:.]12 — 6 min faster than .*7[:.]45/,
    );
    expect(screen.getByText(/less than the/)).toHaveTextContent(
      /15 min less than the .*8[:.]15 peak/,
    );
  });

  it('says the first slot is fastest when nothing later beats it (start now)', () => {
    renderPanel(
      <AnswerPanel
        state="ready"
        announceKey="route-1"
        isSample={false}
        startMode="now"
        summary={summaryOf([27, 28, 29, 30, 31, 32, 33, 34, 35])}
      />,
    );
    expect(screen.getByText('Leave now is your fastest option')).toBeInTheDocument();
    expect(screen.queryByText(/faster than/)).not.toBeInTheDocument();
  });

  it('words the same case for a chosen start time without saying now', () => {
    renderPanel(
      <AnswerPanel
        state="ready"
        announceKey="route-1"
        isSample={false}
        startMode="at"
        summary={summaryOf([27, 28, 29, 30, 31, 32, 33, 34, 35])}
      />,
    );
    expect(screen.getByText('Your start time is the fastest option')).toBeInTheDocument();
  });

  it('omits the peak comparison when no slot is meaningfully slower', () => {
    renderPanel(
      <AnswerPanel
        state="ready"
        announceKey="route-1"
        isSample={false}
        startMode="at"
        summary={summaryOf([28, 28, 28, 28, 28, 28, 28, 28, 27])}
      />,
    );
    expect(screen.queryByText(/peak/)).not.toBeInTheDocument();
  });

  it('labels sample data', () => {
    renderPanel(
      <AnswerPanel
        state="ready"
        announceKey="route-1"
        isSample
        startMode="now"
        summary={summaryOf([33, 30, 27, 30, 33, 36, 39, 42, 45])}
      />,
    );
    expect(screen.getByText('SAMPLE DATA')).toBeInTheDocument();
  });

  it('shows a busy skeleton while loading and keeps the visual panel out of the live region', () => {
    const { container } = renderPanel(<AnswerPanel state="loading" isSample={false} />);
    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(container.querySelector('section')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

describe('AnswerPanel announcement', () => {
  const view = (minutes: number[], announceKey = 'route-1') => (
    <I18nProvider lang="en">
      <AnswerPanel
        state="ready"
        isSample={false}
        startMode="at"
        announceKey={announceKey}
        summary={summaryOf(minutes)}
      />
    </I18nProvider>
  );
  const curve = [33, 37, 42, 40, 36, 32, 30, 29, 27];

  it('speaks the headline and trip once, in one status region', () => {
    render(view(curve));
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/^Leave .*9[:.]45. 27 min, arrive .*10[:.]12$/);
    expect(status).toHaveClass('sr-only');
  });

  it('stays quiet when a refresh yields the same best slot with different minutes', () => {
    const { rerender } = render(view(curve));
    const before = screen.getByRole('status').textContent;
    rerender(view([34, 38, 43, 41, 37, 33, 31, 30, 28]));
    expect(screen.getByRole('status').textContent).toBe(before);
  });

  it('speaks again when the best slot moves', () => {
    const { rerender } = render(view(curve));
    const before = screen.getByRole('status').textContent;
    rerender(view([30, 28, 29, 31, 32, 33, 34, 35, 36]));
    expect(screen.getByRole('status').textContent).not.toBe(before);
  });

  it('speaks again when the route or start time changes', () => {
    const { rerender } = render(view(curve));
    expect(screen.getByRole('status').textContent).toContain('27 min');
    rerender(view([34, 38, 43, 41, 37, 33, 31, 30, 28], 'route-2'));
    expect(screen.getByRole('status').textContent).toContain('28 min');
  });
});
