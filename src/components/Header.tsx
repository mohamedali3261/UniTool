import { ToolsThemeToggle, type ToolsTheme } from '../hooks/useToolsAppearance';
import { SiteNavbar } from "./SiteNavbar";
export { sitePages } from "../config/sitePages";
export function Header({
  lang,
  theme,
  onToggleTheme,
  onToggleLang,
  onBack,
}: {
  lang: "ar" | "en";
  theme?: ToolsTheme;
  onToggleTheme?: () => void;
  onToggleLang: () => void;
  onOpenMobileMenu: () => void;
  onBack?: () => void;
}) {
  return (
    <SiteNavbar
      fixed
      lang={lang}
      onToggleLang={onToggleLang}
      onBack={onBack}
      actions={
        theme && onToggleTheme ? (
          <ToolsThemeToggle theme={theme} onToggle={onToggleTheme} lang={lang} />
        ) : undefined
      }
    />
  );
}
