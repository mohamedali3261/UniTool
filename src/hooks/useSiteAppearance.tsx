import { useLayoutEffect, useState } from 'react';
import { ToolsThemeToggle, type ToolsTheme } from './useToolsAppearance';

export function readAppearance(key: string, fallback: ToolsTheme = 'light'): ToolsTheme {
  try {
    for (const name of [key, 'unitool.tools.theme.v1', 'designcraft_theme_v1', 'unitool.video.theme.v1']) {
      const value = localStorage.getItem(name);
      if (value === 'light' || value === 'dark') return value;
      if (name === key && key === 'unitool.svg.theme.v1') {
        const legacy = localStorage.getItem('bloub:theme');
        if (legacy === 'jour' || legacy === 'nuit') return legacy === 'nuit' ? 'dark' : 'light';
      }
    }
  } catch { /* Storage may be blocked. */ }
  return fallback;
}

export function useDocumentAppearance(theme: ToolsTheme, page: string) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const oldTheme = root.dataset.siteTheme, oldPage = root.dataset.sitePage;
    root.dataset.siteTheme = theme;
    root.dataset.sitePage = page;
    return () => {
      if (oldTheme === undefined) delete root.dataset.siteTheme; else root.dataset.siteTheme = oldTheme;
      if (oldPage === undefined) delete root.dataset.sitePage; else root.dataset.sitePage = oldPage;
    };
  }, [theme, page]);
}

export function useSiteAppearance(page: string) {
  const key = `unitool.${page}.theme.v1`;
  const [theme, setTheme] = useState<ToolsTheme>(() => readAppearance(key));
  useDocumentAppearance(theme, page);
  useLayoutEffect(() => { try { localStorage.setItem(key, theme); } catch { /* In-memory fallback. */ } }, [key, theme]);
  return { theme, setTheme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light') };
}

export function SiteAppearanceToggle(props: { theme: ToolsTheme; onToggle: () => void; lang: 'ar' | 'en' }) {
  return <ToolsThemeToggle {...props} testId="site-theme-toggle" />;
}
