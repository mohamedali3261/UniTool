import { useState, useEffect } from 'react';
import { DCLang, getDcTranslation } from '../translations';

type DCTranslations = ReturnType<typeof getDcTranslation>;

let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function useDcLang(): { lang: DCLang; t: DCTranslations } {
  const [lang, setLang] = useState<DCLang>(() => {
    try {
      const stored = localStorage.getItem('unitool-lang');
      return stored === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  });

  useEffect(() => {
    const onChange = () => {
      try {
        const stored = localStorage.getItem('unitool-lang');
        const next = stored === 'en' ? 'en' : 'ar';
        setLang((prev) => (prev !== next ? next : prev));
      } catch { /* ignore */ }
    };

    listeners.push(onChange);
    return () => {
      listeners = listeners.filter((fn) => fn !== onChange);
    };
  }, []);

  return { lang, t: getDcTranslation(lang) };
}
