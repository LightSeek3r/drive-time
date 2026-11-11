import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoadBar } from './RoadBar';

const base = { index: 0, still: false, tagText: null, tagInside: false } as const;

describe('RoadBar', () => {
  it('takes its widths from the trip and overhang shares', () => {
    render(<RoadBar {...base} trip={0.4} over={0.2} emphasis="rest" />);
    const road = screen.getByTestId('road');
    expect(road.style.getPropertyValue('--trip')).toBe('0.4000');
    expect(road.style.getPropertyValue('--over')).toBe('0.2000');
  });

  it('draws no overhang for a trip at its fastest', () => {
    render(<RoadBar {...base} trip={0.4} over={0} emphasis="best" tagText="BEST" />);
    expect(screen.queryByTestId('over')).not.toBeInTheDocument();
    expect(screen.getByText('BEST')).toBeInTheDocument();
  });

  it('draws the overhang inside the bar when traffic adds minutes', () => {
    render(<RoadBar {...base} trip={0.4} over={0.2} emphasis="rest" />);
    expect(screen.getByTestId('road')).toContainElement(screen.getByTestId('over'));
  });

  it('puts PEAK inside the overhang when it is wide enough', () => {
    render(<RoadBar {...base} trip={0.4} over={0.22} emphasis="peak" tagText="PEAK" tagInside />);
    expect(screen.getByTestId('road')).toContainElement(screen.getByText('PEAK'));
  });

  it('puts PEAK beside the bar when the overhang is too narrow', () => {
    render(
      <RoadBar {...base} trip={0.4} over={0.1} emphasis="peak" tagText="PEAK" tagInside={false} />,
    );
    expect(screen.getByTestId('road')).not.toContainElement(screen.getByText('PEAK'));
  });

  it('opts out of the draw-in when motion is reduced', () => {
    const { rerender } = render(<RoadBar {...base} trip={0.4} over={0} emphasis="rest" />);
    expect(screen.getByTestId('road').className).not.toMatch(/still/);
    rerender(<RoadBar {...base} still trip={0.4} over={0} emphasis="rest" />);
    expect(screen.getByTestId('road').className).toMatch(/still/);
  });

  it('staggers the draw-in by row position', () => {
    render(<RoadBar {...base} index={4} trip={0.4} over={0} emphasis="rest" />);
    expect(screen.getByTestId('road').style.getPropertyValue('--i')).toBe('4');
  });
});
