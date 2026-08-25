import React from 'react';
import { 
  Languages, 
  Settings, 
  Keyboard, 
  UploadCloud, 
  BookOpen, 
  Sparkles,
  Sun,
  Moon,
  Palette,
  Menu
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

export const Navbar: React.FC<NavbarProps> = ({
  uiLang,
  onToggleLang,
  hasBook,
  bookTitle,
  isPlaying,
  onOpenSettings,
  onOpenShortcuts,
  onOpenVoiceSelector,
  onResetBook,
  currentTheme,
  onToggleTheme,
  onToggleMobileDrawer,
}) => {
  const t = getTranslation(uiLang);
  const themeConfig = getThemeConfig(currentTheme);

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all duration-300 ${themeConfig.navbar}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          {hasBook && onToggleMobileDrawer && (
            <button
              onClick={onToggleMobileDrawer}
              className={`lg:hidden p-2 rounded-lg border transition ${themeConfig.buttonSecondary}`}
              title="القائمة الجانبية"
              id="mobile-menu-toggle-btn"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <button 
            onClick={hasBook ? onResetBook : undefined}
            className="group flex items-center gap-2 sm:gap-3 rounded-xl p-1 transition-transform active:scale-95 focus-ring"
            title={t.appSubtitle}
            id="brand-logo-btn"
          >
            <div className="flex flex-col text-start">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight">
                  {t.appSubtitle}
                </span>
                <span className="hidden sm:inline-block rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-500 border border-indigo-500/20">
                  Client-Side TTS
                </span>
              </div>
            </div>
          </button>

          {/* Active Book Badge (if book loaded) */}
          {hasBook && bookTitle && (
            <div className={`hidden lg:flex items-center gap-2 max-w-xs xl:max-w-md truncate border-s ps-4 ms-2 ${themeConfig.borderColor}`}>
              <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className={`text-xs truncate font-medium ${themeConfig.textPrimary}`}>
                {bookTitle}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Upload New Book Button (when book is open) */}
          {hasBook && (
            <button
              onClick={onResetBook}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition ${themeConfig.buttonSecondary}`}
              id="upload-new-book-nav-btn"
            >
              <UploadCloud className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline">{t.uploadNewBook}</span>
            </button>
          )}

          {/* Voice Selector Quick Trigger */}
          <button
            onClick={onOpenVoiceSelector}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${themeConfig.buttonSecondary}`}
            title={t.voiceSelect}
            id="voice-selector-nav-btn"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span className="hidden md:inline">{t.voiceSelect}</span>
          </button>

          {/* Theme Quick Switch */}
          <button
            onClick={onToggleTheme}
            className={`rounded-lg p-2 transition ${themeConfig.buttonSecondary}`}
            title={t.theme}
            id="theme-toggle-btn"
          >
            {currentTheme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : currentTheme === 'sepia' ? (
              <Palette className="h-4 w-4 text-amber-600" />
            ) : currentTheme === 'midnight' ? (
              <Moon className="h-4 w-4 text-purple-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400" />
            )}
          </button>

          {/* Keyboard Shortcuts Dialog */}
          <button
            onClick={onOpenShortcuts}
            className={`hidden sm:inline-flex rounded-lg p-2 transition ${themeConfig.buttonSecondary}`}
            title={t.shortcutsTitle}
            id="shortcuts-btn"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`rounded-lg p-2 transition ${themeConfig.buttonSecondary}`}
            title={t.settingsTitle}
            id="settings-btn"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Language Switch Button */}
          <button
            onClick={onToggleLang}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${themeConfig.buttonSecondary}`}
            id="lang-toggle-btn"
            title="تبديل اللغة / Switch Language"
          >
            <Languages className="h-3.5 w-3.5 text-indigo-500" />
            <span>{uiLang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

        </div>
      </div>
    </header>
  );
};
