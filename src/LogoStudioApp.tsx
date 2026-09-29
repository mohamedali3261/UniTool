import { useState } from 'react';
import { Footer } from './components/Footer';
import { Header, sitePages } from './components/Header';
import { LogoStudio } from './pages/LogoStudio';

export default function LogoStudioApp() {
  const [lang, setLang] = useState<'ar' | 'en'>(() => (
    localStorage.getItem('unitool-lang') === 'en' ? 'en' : 'ar'
  ));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLang = () => {
    setLang(current => {
      const next = current === 'ar' ? 'en' : 'ar';
      localStorage.setItem('unitool-lang', next);
      return next;
    });
  };

  return (
    <div lang={lang} className="flex min-h-screen flex-col overflow-x-hidden bg-[#0F1115] pt-14 font-sans text-[#D1D5DB]" dir="ltr">
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

      <LogoStudio lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}
