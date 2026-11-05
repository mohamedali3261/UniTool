import { SiteAppearanceToggle } from '../../../src/hooks/useSiteAppearance';
import { SiteNavbar } from "../../../src/components/SiteNavbar";
import React from "react";
import {
  Settings,
  Keyboard,
  Sun,
  Moon,
  Palette,
  Menu,
  Volume2,
} from "lucide-react";
import { UILanguage, ThemeMode } from "../types";
import { getTranslation } from "../translations";
import { getThemeConfig } from "../utils/theme";

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
  onToggleAppearance: () => void;
  onToggleMobileDrawer?: () => void;
}

const navStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  padding: "6px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  /* Logo always pinned to the RIGHT edge regardless of language/direction */
  direction: "ltr",
  flexDirection: "row-reverse",
  background: "rgba(7,8,11,.88)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderBottom: "1px solid #1e2028",
};

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#7c7f8a",
  textDecoration: "none",
  fontWeight: 500,
  cursor: "pointer",
  transition: "color .2s",
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: "inherit",
};

const iconBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: 8,
  border: "1px solid transparent",
  background: "transparent",
  color: "#7c7f8a",
  cursor: "pointer",
  transition: "all .2s",
};

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
  onToggleAppearance,
  onToggleMobileDrawer,
}) => {
  const t = getTranslation(uiLang);
  const themeConfig = getThemeConfig(currentTheme);

  return (
    <>
      <SiteNavbar fixed lang={uiLang} onToggleLang={onToggleLang} actions={<SiteAppearanceToggle theme={currentTheme === "light" ? "light" : "dark"} onToggle={onToggleAppearance} lang={uiLang}/>} />
      <nav
        style={{ ...navStyle, position: "relative", top: 0, zIndex: 90 }}
        aria-label={uiLang === "ar" ? "أدوات القراءة" : "Reading tools"}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {/* Mobile Menu Toggle */}
          {hasBook && onToggleMobileDrawer && (
            <button
              onClick={onToggleMobileDrawer}
              className="lg:hidden"
              style={iconBtnStyle}
              title="القائمة الجانبية"
            >
              <Menu style={{ width: 16, height: 16 }} />
            </button>
          )}

          {/* Upload New Book */}
          {hasBook && (
            <button
              onClick={onResetBook}
              style={{ ...linkStyle, fontSize: 12 }}
              className="hidden sm:inline"
            >
              {t.uploadNewBook}
            </button>
          )}

          {/* Voice Selector */}
          <button
            onClick={onOpenVoiceSelector}
            style={{ ...linkStyle, fontSize: 12 }}
            className="reader-voice-open"
            aria-label={t.voiceSelect}
            title={t.voiceSelect}
          >
            <Volume2 style={{ width: 16, height: 16 }} />
            <span className="hidden sm:inline">{t.voiceSelect}</span>
          </button>

          {/* Theme Toggle */}
          <button onClick={onToggleTheme} style={iconBtnStyle} title={t.theme}>
            {currentTheme === "light" ? (
              <Sun style={{ width: 14, height: 14, color: "#f59e0b" }} />
            ) : currentTheme === "sepia" ? (
              <Palette style={{ width: 14, height: 14, color: "#d97706" }} />
            ) : currentTheme === "midnight" ? (
              <Moon style={{ width: 14, height: 14, color: "#a78bfa" }} />
            ) : (
              <Moon style={{ width: 14, height: 14, color: "#818cf8" }} />
            )}
          </button>

          {/* Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            style={iconBtnStyle}
            className="hidden sm:inline-flex"
            title={t.shortcutsTitle}
          >
            <Keyboard style={{ width: 14, height: 14 }} />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            style={iconBtnStyle}
            title={t.settingsTitle}
          >
            <Settings style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </nav>
    </>
  );
};
