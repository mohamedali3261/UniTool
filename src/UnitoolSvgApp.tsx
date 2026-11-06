import { useSiteAppearance } from './hooks/useSiteAppearance';
import { useEffect, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header, sitePages } from './components/Header';
import { UniToolSvg } from './pages/UniToolSvg';
import siteCursorsCss from './styles/site-cursors.css?inline';

export default function UnitoolSvgApp() {
  const { theme, setTheme, toggleTheme } = useSiteAppearance('svg');
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    try { return localStorage.getItem('unitool-lang') === 'en' ? 'en' : 'ar'; } catch { return 'ar'; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const svgFrame = useRef<HTMLIFrameElement>(null);

  const syncSvgLanguage = () => {
    try {
      const doc = svgFrame.current?.contentDocument;
      if (doc?.head) {
        doc.documentElement.dataset.siteTheme = theme;
        if (!doc.head.querySelector('style[data-unitool-cursors]')) {
          const styleEl = doc.createElement('style');
          styleEl.dataset.unitoolCursors = 'true';
          styleEl.textContent = siteCursorsCss;
          doc.head.appendChild(styleEl);
        }
      }
    } catch { /* Cross-origin fallback */ }
    svgFrame.current?.contentWindow?.postMessage({ type: 'unitool-appearance-change', theme }, window.location.origin);
    svgFrame.current?.contentWindow?.postMessage(
      { type: 'unitool-language-change', lang },
      window.location.origin,
    );
  };

  useEffect(() => {
    syncSvgLanguage();
  }, [lang, theme]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== svgFrame.current?.contentWindow) return;
      if (event.data?.type === 'unitool-svg-theme-change' && ['light', 'dark'].includes(event.data.theme)) setTheme(event.data.theme);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [setTheme]);

  const toggleLang = () => {
    setLang(current => {
      const next = current === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem('unitool-lang', next); } catch { /* In-memory fallback. */ }
      return next;
    });
  };

  return (
    <div lang={lang} className="flex min-h-screen flex-col overflow-x-hidden bg-[#0F1115] pt-14 font-sans text-[#D1D5DB]" dir="ltr">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenMobileMenu={() => setMobileMenuOpen(open => !open)}
      />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav
            aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}
            className="absolute inset-x-3 top-16 rounded-xl border border-[#2D3139] bg-[#14171C] p-2 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            {sitePages.map(page => (
              <a
                key={page.href}
                href={page.href}
                className="block rounded-lg px-4 py-3 text-sm text-gray-200 transition-colors hover:bg-white/[0.06]"
              >
                {lang === 'ar' ? page.ar : page.en}
              </a>
            ))}
          </nav>
        </div>
      )}

      <UniToolSvg lang={lang} iframeRef={svgFrame} onIframeLoad={syncSvgLanguage} />
      <Footer lang={lang} />
    </div>
  );
}
