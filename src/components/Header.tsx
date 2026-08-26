import { Menu, Globe } from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
  t: any;
  onToggleLang: () => void;
  onOpenMobileMenu: () => void;
}

const pages = [
  { href: '/index.html', ar: 'الرئيسية', en: 'Home' },
  { href: '/app.html', ar: 'الأدوات', en: 'Tools' },
  { href: '/designcraft.html', ar: 'مصمم الجرافيك', en: 'Design Craft' },
  { href: '/the-audio-reader.html', ar: 'القارئ الصوتي', en: 'Audio Reader' },
];

export function Header({ lang, t, onToggleLang, onOpenMobileMenu }: Props) {
  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(7,8,11,.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid #1e2028',
      }}
    >
      <a href="/index.html" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', margin: 0, padding: 0, lineHeight: 0 }}>
        <img src="/UniTool_logo.png" alt="UniTool" style={{ width: 128, height: 'auto', objectFit: 'contain', margin: 0, padding: 0, border: 0, outline: 'none', display: 'block' }} />
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="hidden md:flex items-center" style={{ gap: 6 }}>
          {pages.map(p => {
            const active = window.location.pathname.endsWith(p.href);
            return (
              <a
                key={p.href}
                href={p.href}
                style={{
                  fontSize: 13, textDecoration: 'none', padding: '6px 14px', borderRadius: 16,
                  transition: 'all .25s', fontWeight: active ? 600 : 500,
                  color: active ? '#a5b4fc' : '#7c7f8a',
                  background: active ? 'rgba(99,102,241,.12)' : 'transparent',
                  boxShadow: active ? '0 0 16px rgba(99,102,241,.35), inset 0 0 0 1px rgba(99,102,241,.25)' : 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#e4e6eb'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#7c7f8a'; e.currentTarget.style.background = 'transparent'; } }}
              >
                {lang === 'ar' ? p.ar : p.en}
              </a>
            );
          })}
        </div>

        <button
          onClick={onToggleLang}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
            borderRadius: 20, border: '1px solid #1e2028', background: 'transparent',
            color: '#7c7f8a', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'all .2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2028'; e.currentTarget.style.color = '#7c7f8a'; }}
        >
          <Globe style={{ width: 14, height: 14, opacity: 0.6 }} />
          <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        <button
          onClick={onOpenMobileMenu}
          className="md:hidden"
          style={{
            padding: 8, color: '#7c7f8a', background: 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
        >
          <Menu size={18} />
        </button>
      </div>
    </nav>
  );
}
