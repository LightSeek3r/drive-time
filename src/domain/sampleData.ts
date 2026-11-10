import { buildSlots, toEstimate } from './departures';
import type { SlotEstimate } from './types';

const DURATIONS_MIN = [33, 37, 42, 40, 36, 32, 30, 29, 27];
const FREE_FLOW_SEC = 25 * 60;
const DISTANCE_M = 14_200;

/** Fixed demo curve (rush-hour peak, then easing) shown as SAMPLE DATA before an API key exists. */
export function sampleEstimates(base: Date): SlotEstimate[] {
  return buildSlots(base, 15, DURATIONS_MIN.length).flatMap((slot, index) => {
    const minutes = DURATIONS_MIN[index];
    if (minutes === undefined) return [];
    return [
      toEstimate(slot, {
        durationSec: minutes * 60,
        freeFlowSec: FREE_FLOW_SEC,
        distanceM: DISTANCE_M,
      }),
    ];
  });
}
