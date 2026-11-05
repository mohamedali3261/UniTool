import { Sun, Moon } from "lucide-react";
import { useDesignerTheme } from "../../hooks/useDesignerTheme";
import { useDcLang } from "../../hooks/useDcLang";
export function DesignerThemeToggle() {
  const { theme, toggle } = useDesignerTheme(),
    { lang } = useDcLang(),
    light = theme === "light",
    label =
      lang === "ar"
        ? light
          ? "تفعيل الوضع الليلي"
          : "تفعيل الوضع النهاري"
        : light
          ? "Switch to dark mode"
          : "Switch to light mode";
  return (
    <button
      type="button"
      data-testid="designer-theme-toggle"
      aria-label={label}
      title={label}
      aria-pressed={light}
      onClick={toggle}
    >
      {light ? <Moon size={16} /> : <Sun size={16} />}
      <span className="dc-theme-caption">
        {lang === "ar" ? (light ? "ليلي" : "نهاري") : light ? "Dark" : "Light"}
      </span>
    </button>
  );
}
