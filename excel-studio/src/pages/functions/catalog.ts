import source from "./lessonMetadata.json";
import { formulaLessons, lessonSections } from "./animations";
import { newBook } from "../../core/workbook";
const sectionCategories: Record<string, string> = {
  math: "Math and trigonometry",
  statistics: "Statistical",
  logic: "Logical",
  text: "Text",
  lookup: "Lookup and reference",
};
export const catalog = source.map((entry) => ({
  ...entry,
  category: sectionCategories[lessonSections[entry.name]],
  example: formulaLessons[entry.name].formula,
  status: "tested",
  common: true,
}));
export type FormulaEntry = (typeof catalog)[number];
export function exampleBook() {
  const book = newBook("Formula playground");
  book.sheets[0].cells = {
    A1: { raw: "10" },
    A2: { raw: "20" },
    A3: { raw: "30" },
    B1: { raw: "2" },
    B2: { raw: "4" },
    B3: { raw: "6" },
    C1: { raw: "Apple" },
    C2: { raw: "Pear" },
    C3: { raw: "Apple" },
  };
  return book;
}
export const categoryAr: Record<string, string> = {
  "Math and trigonometry": "رياضيات ومثلثات",
  Statistical: "إحصاء",
  Logical: "منطق وشروط",
  Text: "نصوص",
  "Text and Data": "نصوص",
  "Date and time": "تاريخ ووقت",
  Financial: "مالية",
  "Lookup and reference": "بحث ومراجع",
  Information: "معلومات وفحص",
  Engineering: "هندسة",
  Database: "قواعد بيانات",
  Web: "ويب",
  Other: "متنوعة",
};
