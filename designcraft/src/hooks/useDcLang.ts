import { useState, useEffect } from 'react';
import { DCLang, getDcTranslation } from '../translations';

type DCTranslations = ReturnType<typeof getDcTranslation>;

const LANG_KEY = 'unitool-lang';
const LANG_EVENT = 'unitool-lang-change';

function readLang(): DCLang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export function setDcLang(lang: DCLang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* storage unavailable — still notify in-memory listeners */
  }
  window.dispatchEvent(new CustomEvent<DCLang>(LANG_EVENT, { detail: lang }));
}

export function useDcLang(): { lang: DCLang; t: DCTranslations } {
  const [lang, setLang] = useState<DCLang>(readLang);

  useEffect(() => {
    const onChange = () => {
      const next = readLang();
      setLang((prev) => (prev !== next ? next : prev));
    };

    window.addEventListener(LANG_EVENT, onChange);
    // Keeps every open tab in sync when the language is switched in another one
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(LANG_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return { lang, t: getDcTranslation(lang) };
}
