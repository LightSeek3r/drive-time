/** The cased road glyph: an amber trip segment with a coral overhang, drawn like the result bars. */
export function RoadMark() {
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true" focusable="false">
      <rect x="1" y="2" width="17" height="10" fill="var(--amber)" stroke="var(--amber-casing)" />
      <rect x="18" y="2" width="9" height="10" fill="var(--coral)" stroke="var(--coral-casing)" />
    </svg>
  );
}
