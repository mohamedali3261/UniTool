export type Lang = "ar" | "en";
export type Tool =
  "select" | "text" | "highlight" | "pen" | "rectangle" | "cover";
export interface Point {
  x: number;
  y: number;
}
export interface Annotation {
  id: string;
  type: Exclude<Tool, "select">;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fontSize: number;
  color: string;
  points?: Point[];
}
export interface PageState {
  id: string;
  source: number;
  rotation: number;
  annotations: Annotation[];
}
export interface EditState {
  pages: PageState[];
}
export interface TextRun {
  read?: { x: number; y: number; w: number; h: number };
  str: string;
  dir: string;
  x: number;
  y: number;
  w: number;
  h: number;
  end: boolean;
}
export interface PageText {
  rawSource: string;
  encodingIssues: import("./textEncoding").EncodingIssue[];
  runs: TextRun[];
  source: string;
  lines: string;
  warnings: string[];
  characters: number;
}
export interface OCRResult {
  text: string;
  confidence: number;
  reviewed: boolean;
}
export const LIMITS = {
  bytes: 25 * 1024 * 1024,
  pages: 100,
  annotations: 500,
  perPage: 100,
  pixels: 12_000_000,
};
export const uid = () => crypto.randomUUID();
export type Translate = (ar: string, en: string) => string;
