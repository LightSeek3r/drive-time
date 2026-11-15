import { buildSlots, toEstimate } from './departures';
import type { SlotEstimate } from './types';

/** Demo curve as [minutes after start, trip minutes]: rush-hour peak, then easing toward free flow. */
const CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 33],
  [15, 37],
  [30, 42],
  [45, 40],
  [60, 36],
  [75, 32],
  [90, 30],
  [105, 29],
  [120, 27],
  [150, 26],
  [180, 25],
  [240, 25],
];
const FREE_FLOW_SEC = 25 * 60;
const DISTANCE_M = 14_200;

function curveMinutes(offsetMin: number): number {
  const index = CURVE.findIndex(([at]) => at >= offsetMin);
  const after = CURVE[index];
  if (after === undefined) return CURVE[CURVE.length - 1]?.[1] ?? 0;
  const before = CURVE[index - 1];
  if (before === undefined) return after[1];
  const share = (offsetMin - before[0]) / (after[0] - before[0]);
  return before[1] + (after[1] - before[1]) * share;
}

/** Fixed demo curve shown as SAMPLE DATA before the user has chosen a trip. */
export function sampleEstimates(base: Date, stepMin = 15, count = 9): SlotEstimate[] {
  return buildSlots(base, stepMin, count).map((slot) =>
    toEstimate(slot, {
      durationSec: Math.round(curveMinutes(slot.offsetMin) * 60),
      freeFlowSec: FREE_FLOW_SEC,
      distanceM: DISTANCE_M,
    }),
  );
}
