import source from "../../data/catalog.json";
import { newBook } from "../../core/workbook";
export const catalog = source;
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
