import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
export type DesignerTheme = "light" | "dark";
export const DESIGNER_THEME_KEY = "designcraft_theme_v1";
const ThemeContext = createContext<{
  theme: DesignerTheme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });
export function DesignerThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<DesignerTheme>(() => {
    try {
      return localStorage.getItem(DESIGNER_THEME_KEY) === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  useLayoutEffect(() => {
    const root = document.documentElement,
      previous = root.dataset.dcTheme;
    root.dataset.dcTheme = theme;
    try {
      localStorage.setItem(DESIGNER_THEME_KEY, theme);
    } catch {
      /* Preference is still usable when storage is unavailable. */
    }
    return () => {
      if (previous === undefined) delete root.dataset.dcTheme;
      else root.dataset.dcTheme = previous;
    };
  }, [theme]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () => setTheme((mode) => (mode === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useDesignerTheme = () => useContext(ThemeContext);
