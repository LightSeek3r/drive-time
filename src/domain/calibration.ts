import type { SlotEstimate } from './types';

const MINUTE_MS = 60_000;
/** The first departure must be this close to the moment of the request for live traffic to say anything about it. */
const ANCHOR_MAX_GAP_MIN = 10;
// deliberate: one decay constant for every route and hour; tune with real data, not per road.
const DECAY_MIN = 60;
// Wide enough for a real jam, tight enough that one odd reading cannot triple every row.
const RATIO_MIN = 0.7;
const RATIO_MAX = 2.5;

export interface Calibration {
  estimates: SlotEstimate[];
  /** Minutes live traffic adds (negative: removes) right now against typical; null when nothing was adjusted. */
  nowDeltaMin: number | null;
}

/**
 * Rescales typical-traffic durations by how far live traffic is off typical right now, fading with time.
 * Every row starts from `historicSec`, not `durationSec`: TomTom already blends live data into near
 * departures, and starting from that blend would count the same jam twice.
 */
export function calibrate(estimates: readonly SlotEstimate[], requestedAt: Date): Calibration {
  const untouched: Calibration = { estimates: [...estimates], nowDeltaMin: null };
  const anchor = estimates.reduce<SlotEstimate | undefined>(
    (soonest, e) =>
      soonest === undefined || e.slot.departAt < soonest.slot.departAt ? e : soonest,
    undefined,
  );
  if (anchor === undefined) return untouched;

  const { historicSec, liveSec } = anchor;
  const gapMin = (anchor.slot.departAt.getTime() - requestedAt.getTime()) / MINUTE_MS;
  if (historicSec === undefined || liveSec === undefined || historicSec <= 0) return untouched;
  if (Math.abs(gapMin) > ANCHOR_MAX_GAP_MIN) return untouched;

  const ratio = Math.min(RATIO_MAX, Math.max(RATIO_MIN, liveSec / historicSec));
  const adjusted = estimates.map((estimate) => {
    if (estimate.historicSec === undefined) return estimate;
    const minutesAhead = Math.max(
      0,
      (estimate.slot.departAt.getTime() - requestedAt.getTime()) / MINUTE_MS,
    );
    const durationSec =
      estimate.historicSec * (1 + (ratio - 1) * Math.exp(-minutesAhead / DECAY_MIN));
    return {
      ...estimate,
      durationSec,
      arriveAt: new Date(estimate.slot.departAt.getTime() + durationSec * 1000),
      adjusted: true,
    };
  });
  return { estimates: adjusted, nowDeltaMin: Math.round((historicSec * (ratio - 1)) / 60) };
}
