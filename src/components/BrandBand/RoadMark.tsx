/** A miniature of the result bars: a trip segment with a traffic overhang. */
export function RoadMark() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true" focusable="false">
      <rect x="0" y="2" width="16" height="8" rx="2" fill="var(--road)" />
      <rect x="17" y="2" width="9" height="8" rx="2" fill="var(--cost)" />
    </svg>
  );
}
