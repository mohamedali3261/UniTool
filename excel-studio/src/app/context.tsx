import { createContext, useContext } from "react";
import type { Lang, Workbook } from "../core/types";
export interface StudioContext {
  lang: Lang;
  toggleLang: () => void;
  t: (ar: string, en: string) => string;
  book: Workbook;
  update: (
    change: Workbook | ((book: Workbook) => Workbook),
    history?: boolean,
  ) => boolean;
  notice: (message: string) => void;
  openTemplate: (book: Workbook) => void;
  page: "editor" | "functions" | "templates" | "analytics";
  navigate: (page: StudioContext["page"]) => void;
  insertFormula: (formula: string) => void;
}
export const Context = createContext<StudioContext>(null!);
export const useStudio = () => useContext(Context);
