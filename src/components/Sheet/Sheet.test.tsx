import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Sheet } from './Sheet';

describe('Sheet', () => {
  it('shows a labelled dialog only while open', () => {
    const { rerender } = render(
      <Sheet open={false} onClose={vi.fn()} titleId="t">
        <h2 id="t">Title</h2>
      </Sheet>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <Sheet open onClose={vi.fn()} titleId="t">
        <h2 id="t">Title</h2>
      </Sheet>,
    );
    expect(screen.getByRole('dialog', { name: 'Title' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} titleId="t">
        <h2 id="t">Title</h2>
        <button type="button">Inside</button>
      </Sheet>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Inside' }));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on a backdrop press but not on a press inside the sheet', async () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} titleId="t">
        <h2 id="t">Title</h2>
      </Sheet>,
    );
    await userEvent.click(screen.getByRole('heading', { name: 'Title' }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('dialog', { name: 'Title' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
