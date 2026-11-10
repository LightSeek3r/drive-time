import type { ReactNode } from 'react';

const OPEN = '\u0001';
const CLOSE = '\u0002';

/** Wrap a value so `Marked` can style it after the translated sentence is assembled. */
export function mark(value: string | number): string {
  return `${OPEN}${value}${CLOSE}`;
}

interface Segment {
  text: string;
  marked: boolean;
}

export function splitMarked(text: string): Segment[] {
  const segments: Segment[] = [];
  let rest = text;
  while (rest.length > 0) {
    const open = rest.indexOf(OPEN);
    const close = open === -1 ? -1 : rest.indexOf(CLOSE, open);
    if (open === -1 || close === -1) {
      segments.push({ text: rest, marked: false });
      break;
    }
    if (open > 0) segments.push({ text: rest.slice(0, open), marked: false });
    segments.push({ text: rest.slice(open + 1, close), marked: true });
    rest = rest.slice(close + 1);
  }
  return segments;
}

interface MarkedProps {
  text: string;
  markClassName: string;
}

export function Marked({ text, markClassName }: MarkedProps): ReactNode {
  return splitMarked(text).map((segment, index) =>
    segment.marked ? (
      <span key={index} className={markClassName}>
        {segment.text}
      </span>
    ) : (
      segment.text
    ),
  );
}
