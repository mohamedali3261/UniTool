export type Bilingual = readonly [string, string];
export type LessonStep = {
  title: Bilingual;
  explanation: Bilingual;
  calculation: string;
  active?: string[];
  matched?: string[];
  skipped?: string[];
};
export type DemoAction = {
  kind: "click" | "type" | "select" | "enter";
  caption: Bilingual;
  cell?: string;
  fromCell?: string;
  toCell?: string;
  text?: string;
};
export type FormulaLesson = {
  demo: DemoAction[];
  name: string;
  formula: string;
  goal: Bilingual;
  tip: Bilingual;
  result: string | number;
  steps: LessonStep[];
};
export const exampleRows = [
  [10, 2, "Apple"],
  [20, 4, "Pear"],
  [30, 6, "Apple"],
] as const;
