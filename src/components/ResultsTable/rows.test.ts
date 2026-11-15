import { describe, expect, it } from 'vitest';
import { buildSlots, summarise, toEstimate } from '../../domain/departures';
import type { SlotState } from '../../domain/types';
import { buildRows, TRACK_HEADROOM } from './rows';

const BASE = new Date(2026, 10, 10, 7, 45);
const MINUTES = [33, 37, 42, 40, 36, 32, 30, 29, 27];

function readySlots(minutes: number[] = MINUTES): SlotState[] {
  return buildSlots(BASE, 15, minutes.length).map((slot, index) => ({
    status: 'ready',
    estimate: toEstimate(slot, {
      durationSec: (minutes[index] ?? 0) * 60,
      freeFlowSec: 1500,
      distanceM: 14000,
    }),
  }));
}

function summaryOf(slots: SlotState[]) {
  const summary = summarise(slots.flatMap((s) => (s.status === 'ready' ? [s.estimate] : [])));
  return summary.best === undefined ? undefined : summary;
}

function ready(rows: ReturnType<typeof buildRows>) {
  return rows.flatMap((row) => (row.status === 'ready' ? [row] : []));
}

describe('buildRows', () => {
  const slots = readySlots();
  const rows = ready(buildRows(slots, summaryOf(slots), new Date(2026, 10, 10, 7, 30)));

  it('marks one best row and one peak row', () => {
    expect(rows.filter((r) => r.emphasis === 'best').map((r) => r.minutes)).toEqual([27]);
    expect(rows.filter((r) => r.emphasis === 'peak').map((r) => r.minutes)).toEqual([42]);
  });

  it('uses one trip width for every row: the best duration on the shared track', () => {
    const track = 42 * 60 * TRACK_HEADROOM;
    for (const row of rows) expect(row.trip).toBeCloseTo((27 * 60) / track, 6);
  });

  it('sizes the overhang from the seconds over the best trip', () => {
    const track = 42 * 60 * TRACK_HEADROOM;
    const peak = rows.find((r) => r.emphasis === 'peak');
    expect(peak?.over).toBeCloseTo((15 * 60) / track, 6);
    expect(rows.find((r) => r.emphasis === 'best')?.over).toBe(0);
  });

  it('keeps every bar inside the track', () => {
    for (const row of rows)
      expect(row.trip + row.over).toBeLessThanOrEqual(1 / TRACK_HEADROOM + 1e-9);
  });

  it('shows no delta on the first slot and signed minutes elsewhere', () => {
    expect(rows.map((r) => r.delta)).toEqual([null, 4, 9, 7, 3, -1, -3, -4, -6]);
  });

  it('carries loading and error slots as their own row states', () => {
    const [first, second, third] = buildSlots(BASE, 15, 3);
    const mixed: SlotState[] = [
      { status: 'loading', slot: first! },
      { status: 'error', slot: second!, kind: 'unknown' },
      { status: 'loading', slot: third! },
    ];
    const built = buildRows(mixed, undefined, BASE);
    expect(built.map((row) => row.status)).toEqual(['loading', 'error', 'loading']);
  });

  it('flags departures whose minute has passed as spent', () => {
    const late = buildRows(slots, summaryOf(slots), new Date(2026, 10, 10, 8, 5, 30));
    expect(late.map((r) => r.spent)).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('does not treat the current minute as spent', () => {
    const now = buildRows(slots, summaryOf(slots), new Date(2026, 10, 10, 7, 45, 40));
    expect(now[0]?.spent).toBe(false);
  });
});
