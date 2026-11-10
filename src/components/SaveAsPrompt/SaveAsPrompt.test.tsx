import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { SaveAsPrompt } from './SaveAsPrompt';

describe('SaveAsPrompt', () => {
  it('offers Home and Work and reports the choice', async () => {
    const onSave = vi.fn();
    render(
      <I18nProvider lang="en">
        <SaveAsPrompt onSave={onSave} />
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save as Work' }));
    expect(onSave).toHaveBeenCalledWith('work');
    expect(screen.getByRole('button', { name: 'Save as Home' })).toBeInTheDocument();
  });
});
