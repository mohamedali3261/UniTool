import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
export type VideoTheme = "light" | "dark";
export const VIDEO_THEME_KEY = "unitool.video.theme.v1";
export function useVideoAppearance() {
  const [theme, setTheme] = useState<VideoTheme>(() => {
    try {
      const value =
        localStorage.getItem(VIDEO_THEME_KEY) ||
        localStorage.getItem("designcraft_theme_v1");
      return value === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  useLayoutEffect(() => {
    const root = document.documentElement,
      previous = root.dataset.videoTheme;
    root.dataset.videoTheme = theme;
    try {
      localStorage.setItem(VIDEO_THEME_KEY, theme);
    } catch {
      /* Continue in memory if browser storage is unavailable. */
    }
    return () => {
      if (previous === undefined) delete root.dataset.videoTheme;
      else root.dataset.videoTheme = previous;
    };
  }, [theme]);
  return {
    theme,
    toggleTheme: () =>
      setTheme((value) => (value === "light" ? "dark" : "light")),
  };
}
export function VideoThemeToggle({
  theme,
  onToggle,
  lang,
}: {
  theme: VideoTheme;
  onToggle: () => void;
  lang: "ar" | "en";
}) {
  const light = theme === "light",
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
      className="video-theme-toggle"
      data-testid="video-theme-toggle"
      aria-label={label}
      aria-pressed={light}
      title={label}
      onClick={onToggle}
    >
      {light ? <Moon size={16} /> : <Sun size={16} />}
      <span>
        {lang === "ar" ? (light ? "ليلي" : "نهاري") : light ? "Dark" : "Light"}
      </span>
    </button>
  );
}
