import { useEffect } from 'react';
import App from './App';
import { useSettings } from './hooks/useSettings';
import { I18nProvider } from './i18n';

/** Binds the saved language to the translation context and to the document's lang attribute. */
export default function Root() {
  const { settings } = useSettings();
  useEffect(() => {
    document.documentElement.lang = settings.lang;
  }, [settings.lang]);

  return (
    <I18nProvider lang={settings.lang}>
      <App />
    </I18nProvider>
  );
}
