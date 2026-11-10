import { useEffect, useState } from 'react';

/** Re-renders on a coarse tick so "now"-relative UI (past departures) stays honest while the page stays open. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
