import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Root from './Root';
import { settingsStore } from './storage/stores';

vi.mock('./App', () => ({ default: () => <p>app</p> }));

describe('Root', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the document language in step with the saved setting', () => {
    settingsStore.set({ lang: 'fr', apiKey: '' });
    render(<Root />);
    expect(screen.getByText('app')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });
});
