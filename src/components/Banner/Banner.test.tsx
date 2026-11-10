import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Banner } from './Banner';

describe('Banner', () => {
  it('announces its message and runs the action', async () => {
    const onClick = vi.fn();
    render(
      <Banner tone="error" icon="alert" role="alert" action={{ label: 'Retry', onClick }}>
        Something broke
      </Banner>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something broke');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('omits the button without an action', () => {
    render(
      <Banner tone="info" icon="offline" role="status">
        Offline
      </Banner>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is not a live region when no role is given', () => {
    const { container } = render(
      <Banner tone="info" icon="pin">
        Static notice
      </Banner>,
    );
    expect(container.querySelector('[role]')).toBeNull();
  });
});
