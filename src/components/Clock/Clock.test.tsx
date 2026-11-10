import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Clock } from './Clock';

describe('Clock', () => {
  it('renders a machine-readable time element', () => {
    render(<Clock date={new Date(2026, 10, 10, 9, 45)} />);
    const element = screen.getByText(/9[:.]45/).closest('time');
    expect(element).toHaveAttribute('datetime', expect.stringMatching(/^2026-11-10T09:45:00/));
  });
});
