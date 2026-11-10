import React, { createContext, useContext } from 'react';
import { en } from './en';
import { fr } from './fr';
import type { Messages } from './fr';

type Language = 'en' | 'fr';

interface I18nContextType {
  lang: Language;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations: Record<Language, Messages> = {
  en,
  fr,
};

interface I18nProviderProps {
  lang: Language;
  children: React.ReactNode;
}

export function I18nProvider({ lang, children }: I18nProviderProps) {
  const t = (key: keyof Messages, vars?: Record<string, string | number>): string => {
    let text = translations[lang][key];
    if (!text) return '';
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (_match, varName) => {
      const value = vars[varName];
      return value !== undefined ? String(value) : '';
    });
  };

  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useT(): (key: keyof Messages, vars?: Record<string, string | number>) => string {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useT must be used within I18nProvider');
  }
  return context.t;
}

export function useLang(): Language {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLang must be used within I18nProvider');
  }
  return context.lang;
}
