import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Marked, mark, splitMarked } from './Marked';

describe('Marked', () => {
  it('splits marked values out of a sentence', () => {
    const text = `${mark(27)} min, arrive 10:12 — ${mark(6)} min faster`;
    expect(splitMarked(text)).toEqual([
      { text: '27', marked: true },
      { text: ' min, arrive 10:12 — ', marked: false },
      { text: '6', marked: true },
      { text: ' min faster', marked: false },
    ]);
  });

  it('renders marked parts with the given class and keeps the rest as plain text', () => {
    const { container } = render(
      <p>
        <Marked text={`Leave ${mark('9:45')}`} markClassName="hot" />
      </p>,
    );
    expect(container.querySelector('.hot')?.textContent).toBe('9:45');
    expect(container.textContent).toBe('Leave 9:45');
  });

  it('leaves plain text untouched', () => {
    expect(splitMarked('plain')).toEqual([{ text: 'plain', marked: false }]);
  });
});
