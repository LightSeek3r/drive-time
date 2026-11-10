import { useMemo } from 'react';
import { createTomTomProvider } from '../providers/tomtom';
import type { TrafficProvider } from '../providers/trafficProvider';

export function useTrafficProvider(apiKey: string): TrafficProvider {
  return useMemo(() => createTomTomProvider({ apiKey }), [apiKey]);
}
