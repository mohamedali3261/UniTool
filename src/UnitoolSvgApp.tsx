import { useEffect, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header, sitePages } from './components/Header';
import { UniToolSvg } from './pages/UniToolSvg';

export default function UnitoolSvgApp() {
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('unitool-lang');
    return saved === 'en' ? 'en' : 'ar';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const svgFrame = useRef<HTMLIFrameElement>(null);

  const syncSvgLanguage = () => {
    svgFrame.current?.contentWindow?.postMessage(
      { type: 'unitool-language-change', lang },
      window.location.origin,
    );
  };

  useEffect(() => {
    syncSvgLanguage();
  }, [lang]);

  const toggleLang = () => {
    setLang(current => {
      const next = current === 'ar' ? 'en' : 'ar';
      localStorage.setItem('unitool-lang', next);
      return next;
    });
  };

  return (
    <div lang={lang} className="flex h-screen flex-col overflow-hidden bg-[#0F1115] pt-14 font-sans text-[#D1D5DB]" dir="ltr">
      <Header
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
