import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('invites the user to choose a route', () => {
    render(
      <I18nProvider lang="en">
        <EmptyState />
      </I18nProvider>,
    );
    expect(
      screen.getByText("Choose where you leave from and where you're going"),
    ).toBeInTheDocument();
  });
});
