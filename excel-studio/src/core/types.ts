export type CellFormat = "auto" | "number" | "currency" | "percent" | "date";
export interface Cell {
  raw: string;
  format?: CellFormat;
  bold?: boolean;
  italic?: boolean;
  fill?: string;
  color?: string;
  align?: "left" | "center" | "right";
}
export interface Sheet {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells: Record<string, Cell>;
  theme: string;
  header: boolean;
  striped: boolean;
  freeze: boolean;
  decimals: number;
  currency: string;
  negative: boolean;
}
export interface Workbook {
  version: 1;
  id: string;
  name: string;
  active: string;
  sheets: Sheet[];
  updated: number;
}
export type Value = string | number | boolean | null;
export interface Result {
  value: Value;
  error?: string;
}
export interface Selection {
  anchor: string;
  end: string;
}
export type Lang = "ar" | "en";
export const LIMITS = {
  rows: 300,
  cols: 30,
  sheets: 8,
  cells: 20000,
  file: 5 * 1024 * 1024,
};
export const themes = {
  emerald: { name: "Emerald / زمرد", head: "#126950", stripe: "#f0f8f5" },
  indigo: { name: "Indigo / نيلي", head: "#4e46a5", stripe: "#f4f2fb" },
  ocean: { name: "Ocean / محيط", head: "#176b93", stripe: "#eff7fb" },
  rose: { name: "Rose / وردي", head: "#9a4269", stripe: "#fcf2f6" },
  amber: { name: "Amber / كهرمان", head: "#855a22", stripe: "#fcf7ee" },
  slate: { name: "Slate / رمادي", head: "#364152", stripe: "#f1f4f8" },
};
