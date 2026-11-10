import { describe, it, expect } from 'vitest';
import { en } from './en';
import { fr } from './fr';

describe('i18n', () => {
  it('should have identical keys in en and fr', () => {
    const enKeys = Array.from(new Set(Object.keys(en))).sort();
    const frKeys = Array.from(new Set(Object.keys(fr))).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it('should have no empty strings', () => {
    Object.entries(en).forEach(([key, value]) => {
      expect(value, `en.${key} should not be empty`).not.toBe('');
    });
    Object.entries(fr).forEach(([key, value]) => {
      expect(value, `fr.${key} should not be empty`).not.toBe('');
    });
  });

  it('should have matching placeholders in en and fr', () => {
    const getPlaceholders = (text: string): string[] => {
      const matches = text.match(/\{(\w+)\}/g) || [];
      return matches.map((m) => m.slice(1, -1)).sort();
    };

    Object.entries(en).forEach(([key, value]) => {
      const enPlaceholders = getPlaceholders(String(value));
      const frPlaceholders = getPlaceholders(String(fr[key as keyof typeof fr]));
      expect(frPlaceholders, `${key} placeholders should match`).toEqual(enPlaceholders);
    });
  });
});
