import type { CSSProperties } from 'react';
import styles from './RoadBar.module.css';

export type BarEmphasis = 'rest' | 'best' | 'peak';

interface RoadBarProps {
  /** Share of the shared track taken by the trip at its fastest, 0..1. */
  trip: number;
  /** Share of the shared track taken by the minutes traffic adds, 0..1. */
  over: number;
  emphasis: BarEmphasis;
  /** Row position; staggers the draw-in. */
  index: number;
  still: boolean;
  /** Word marking the best or peak row, drawn by the bar so it never relies on colour alone. */
  tagText: string | null;
  /** Peak text goes inside the overhang when it is wide enough, else beside the bar. */
  tagInside: boolean;
}

export function RoadBar({ trip, over, emphasis, index, still, tagText, tagInside }: RoadBarProps) {
  const roadStyle = {
    '--trip': trip.toFixed(4),
    '--over': over.toFixed(4),
    '--i': String(index),
  } as CSSProperties;
  const roadClass = [styles.road, emphasis === 'best' ? styles.best : '', still ? styles.still : '']
    .filter(Boolean)
    .join(' ');
  const insideLabel = emphasis === 'peak' && tagInside ? tagText : null;
  const besideLabel = tagText !== null && insideLabel === null ? tagText : null;

  return (
    <span className={styles.track}>
      <span className={roadClass} style={roadStyle} data-testid="road">
        <span className={styles.trip} />
        {over > 0 && <span className={styles.over}>{insideLabel}</span>}
      </span>
      {besideLabel !== null && (
        <span className={emphasis === 'best' ? styles.bestTag : styles.peakTag}>{besideLabel}</span>
      )}
    </span>
  );
}
