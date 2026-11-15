import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Settings } from '../../domain/types';
import { I18nProvider } from '../../i18n';
import { SettingsSheet } from './SettingsSheet';

function setup(settings: Settings = { lang: 'en', span: 180, step: 10 }) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <I18nProvider lang="en">
      <SettingsSheet open settings={settings} onSave={onSave} onClose={onClose} />
    </I18nProvider>,
  );
  return { onSave, onClose };
}

describe('SettingsSheet', () => {
  it('saves the chosen language', async () => {
    const { onSave } = setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Français' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ lang: 'fr', span: 180, step: 10 });
  });

  it('saves a new window and tells how many requests a refresh makes', async () => {
    const { onSave } = setup();
    expect(screen.getByText('Each refresh makes 19 routing requests.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '4 h' }));
    expect(screen.getByText('Each refresh makes 25 routing requests.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ lang: 'en', span: 240, step: 10 });
  });

  it('shortens the span when a step is too fine for it', async () => {
    const { onSave } = setup();
    await userEvent.click(screen.getByRole('radio', { name: '5 min' }));
    expect(screen.getByRole('radio', { name: '2 h' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ lang: 'en', span: 120, step: 5 });
  });

  it('has no API key field', () => {
    setup();
    expect(screen.queryByLabelText('API Key')).not.toBeInTheDocument();
  });

  it('closes without saving', async () => {
    const { onSave, onClose } = setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Français' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]!);
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('radio', { name: 'Français' }));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
