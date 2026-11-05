import { useLayoutEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type ToolsTheme = 'light' | 'dark';
export const TOOLS_THEME_KEY = 'unitool.tools.theme.v1';

export function useToolsAppearance() {
  const [theme, setTheme] = useState<ToolsTheme>(() => {
    try {
      const saved = [TOOLS_THEME_KEY, 'designcraft_theme_v1', 'unitool.video.theme.v1']
        .map(key => localStorage.getItem(key))
        .find(value => value === 'light' || value === 'dark');
      return saved === 'dark' ? 'dark' : 'light';
    } catch { return 'light'; }
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.toolsTheme;
    root.dataset.toolsTheme = theme;
    try { localStorage.setItem(TOOLS_THEME_KEY, theme); } catch { /* In-memory fallback. */ }
    return () => {
      if (previous === undefined) delete root.dataset.toolsTheme;
      else root.dataset.toolsTheme = previous;
    };
  }, [theme]);

  return { theme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light') };
}

export function ToolsThemeToggle({ theme, onToggle, lang, testId = 'tools-theme-toggle' }: {
  testId?: string;
  theme: ToolsTheme;
  onToggle: () => void;
  lang: 'ar' | 'en';
}) {
  const light = theme === 'light';
  const label = lang === 'ar'
    ? (light ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري')
    : (light ? 'Switch to dark mode' : 'Switch to light mode');
  return (
    <button type="button" data-testid={testId} className="tools-theme-toggle"
      aria-label={label} title={label} aria-pressed={!light} onClick={onToggle}>
      {light ? <Moon size={16} /> : <Sun size={16} />}
      <span>{lang === 'ar' ? (light ? 'ليلي' : 'نهاري') : (light ? 'Dark' : 'Light')}</span>
    </button>
  );
}
