import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { SettingsSheet } from './SettingsSheet';

function setup(settings = { lang: 'en' as const, apiKey: '' }) {
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
  it('saves a trimmed key and the chosen language', async () => {
    const { onSave } = setup();
    await userEvent.type(screen.getByLabelText('API Key'), '  abc123  ');
    await userEvent.click(screen.getByRole('radio', { name: 'Français' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ apiKey: 'abc123', lang: 'fr' });
  });

  it('hides the key until asked and never autocompletes it', async () => {
    setup({ lang: 'en', apiKey: 'secret' });
    const input = screen.getByLabelText('API Key');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Show key' }));
    expect(input).toHaveAttribute('type', 'text');
  });

  it('links to the free key page safely', () => {
    setup();
    const link = screen.getByRole('link', { name: 'Get a free key' });
    expect(link).toHaveAttribute('href', 'https://developer.tomtom.com/');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('closes without saving', async () => {
    const { onSave, onClose } = setup();
    await userEvent.type(screen.getByLabelText('API Key'), 'abc');
    await userEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]!);
    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const { onClose } = setup();
    await userEvent.type(screen.getByLabelText('API Key'), 'a');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
