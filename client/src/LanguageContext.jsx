// client/src/LanguageContext.jsx
// Provides the current language + a translator to the whole tree. Language is
// persisted in localStorage ('lang') so it sticks across visits, same as 'plan'.

import { createContext, useContext, useMemo, useState } from 'react';
import { makeT, categoryName } from './i18n';

const LangCtx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'en');

  const value = useMemo(() => {
    const t = makeT(lang);
    return {
      lang,
      t,
      // Category/group name in the current language (English fallback).
      tCat: (code, englishName) => categoryName(lang, code, englishName),
      setLang: (l) => {
        localStorage.setItem('lang', l);
        setLangState(l);
      },
    };
  }, [lang]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error('useLang must be used within <LanguageProvider>');
  return ctx;
}
