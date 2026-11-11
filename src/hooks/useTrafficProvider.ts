import { useMemo } from 'react';
import { createTomTomProvider } from '../providers/tomtom';
import type { TrafficProvider } from '../providers/trafficProvider';

export function useTrafficProvider(): TrafficProvider {
  return useMemo(() => createTomTomProvider(), []);
}
