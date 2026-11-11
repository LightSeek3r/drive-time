import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { SettingsSheet } from './SettingsSheet';

function setup(settings = { lang: 'en' as const }) {
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
    expect(onSave).toHaveBeenCalledWith({ lang: 'fr' });
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
