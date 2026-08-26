import { useState, useEffect } from 'react';
import { DCLang, getDcTranslation } from '../translations';

export function useDcLang(): { lang: DCLang; t: ReturnType<typeof getDcTranslation> } {
  const [lang, setLang] = useState<DCLang>(() => {
    try {
      const stored = localStorage.getItem('unitool-lang');
      return stored === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'unitool-lang') {
        setLang(e.newValue === 'en' ? 'en' : 'ar');
      }
    };
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem('unitool-lang');
        const next = stored === 'en' ? 'en' : 'ar';
        setLang((prev) => (prev !== next ? next : prev));
      } catch { /* ignore */ }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  return { lang, t: getDcTranslation(lang) };
}
