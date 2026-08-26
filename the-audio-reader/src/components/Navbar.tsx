import React from 'react';
import { 
  Languages, Settings, Keyboard, UploadCloud, BookOpen,
  Sparkles, Sun, Moon, Palette, Menu, Globe
} from 'lucide-react';
import { UILanguage, ThemeMode } from '../types';
import { getTranslation } from '../translations';
import { getThemeConfig } from '../utils/theme';

interface NavbarProps {
  uiLang: UILanguage;
  onToggleLang: () => void;
  hasBook: boolean;
  bookTitle?: string;
  isPlaying: boolean;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenVoiceSelector: () => void;
  onResetBook: () => void;
  currentTheme: ThemeMode;
  onToggleTheme: () => void;
  onToggleMobileDrawer?: () => void;
}

const navStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
  padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: 'rgba(7,8,11,.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
  borderBottom: '1px solid #1e2028',
};

const linkStyle: React.CSSProperties = {
  fontSize: 13, color: '#7c7f8a', textDecoration: 'none', fontWeight: 500, cursor: 'pointer',
  transition: 'color .2s', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit',
};

const langBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px',
  borderRadius: 20, border: '1px solid #1e2028', background: 'transparent',
  color: '#7c7f8a', fontSize: 11, fontWeight: 600, cursor: 'pointer',
  transition: 'all .2s', fontFamily: 'inherit',
};

const iconBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 6, borderRadius: 8, border: '1px solid transparent', background: 'transparent',
  color: '#7c7f8a', cursor: 'pointer', transition: 'all .2s',
};

const navLinkStyle: React.CSSProperties = {
  fontSize: 13, color: '#7c7f8a', textDecoration: 'none', fontWeight: 500, transition: 'color .2s',
};

const ctaStyle: React.CSSProperties = {
  padding: '7px 18px', borderRadius: 20, border: '1px solid #1e2028', background: 'transparent',
  color: '#e4e6eb', fontSize: 12, fontWeight: 600, textDecoration: 'none', transition: 'all .2s',
};

export const Navbar: React.FC<NavbarProps> = ({
  uiLang, onToggleLang, hasBook, bookTitle, isPlaying,
  onOpenSettings, onOpenShortcuts, onOpenVoiceSelector,
  onResetBook, currentTheme, onToggleTheme, onToggleMobileDrawer,
}) => {
  const t = getTranslation(uiLang);
  const themeConfig = getThemeConfig(currentTheme);

  return (
    <nav style={navStyle}>
      {/* Left: Logo */}
        <a href="/index.html" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', margin: 0, padding: 0, lineHeight: 0 }}>
          <img src="/UniTool_logo.png" alt="UniTool" style={{ width: 128, height: 'auto', objectFit: 'contain', margin: 0, padding: 0, border: 0, outline: 'none', display: 'block' }} />
      </a>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Nav Links */}
        <div className="hidden lg:flex items-center" style={{ gap: 6 }}>
          {[
            { href: '/index.html', label: uiLang === 'ar' ? 'الرئيسية' : 'Home' },
            { href: '/app.html', label: uiLang === 'ar' ? 'الأدوات' : 'Tools' },
            { href: '/designcraft.html', label: uiLang === 'ar' ? 'مصمم الجرافيك' : 'Design Craft' },
            { href: '/the-audio-reader.html', label: uiLang === 'ar' ? 'القارئ الصوتي' : 'Audio Reader' },
          ].map(p => {
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
                {p.label}
              </a>
            );
          })}
        </div>

        {/* Mobile Menu Toggle */}
        {hasBook && onToggleMobileDrawer && (
          <button onClick={onToggleMobileDrawer} className="lg:hidden" style={iconBtnStyle} title="القائمة الجانبية">
            <Menu style={{ width: 16, height: 16 }} />
          </button>
        )}

        {/* Upload New Book */}
        {hasBook && (
          <button onClick={onResetBook} style={{ ...linkStyle, fontSize: 12 }} className="hidden sm:inline">
            {t.uploadNewBook}
          </button>
        )}

        {/* Voice Selector */}
        <button onClick={onOpenVoiceSelector} style={{ ...linkStyle, fontSize: 12 }} className="hidden md:inline" title={t.voiceSelect}>
          {t.voiceSelect}
        </button>

        {/* Theme Toggle */}
        <button onClick={onToggleTheme} style={iconBtnStyle} title={t.theme}>
          {currentTheme === 'light' ? (
            <Sun style={{ width: 14, height: 14, color: '#f59e0b' }} />
          ) : currentTheme === 'sepia' ? (
            <Palette style={{ width: 14, height: 14, color: '#d97706' }} />
          ) : currentTheme === 'midnight' ? (
            <Moon style={{ width: 14, height: 14, color: '#a78bfa' }} />
          ) : (
            <Moon style={{ width: 14, height: 14, color: '#818cf8' }} />
          )}
        </button>

        {/* Shortcuts */}
        <button onClick={onOpenShortcuts} style={iconBtnStyle} className="hidden sm:inline-flex" title={t.shortcutsTitle}>
          <Keyboard style={{ width: 14, height: 14 }} />
        </button>

        {/* Settings */}
        <button onClick={onOpenSettings} style={iconBtnStyle} title={t.settingsTitle}>
          <Settings style={{ width: 14, height: 14 }} />
        </button>

        {/* Language Toggle */}
        <button
          onClick={onToggleLang}
          style={langBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2028'; e.currentTarget.style.color = '#7c7f8a'; }}
        >
          <Globe style={{ width: 14, height: 14, opacity: 0.6 }} />
          <span>{uiLang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </nav>
  );
};
