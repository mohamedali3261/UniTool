import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "CONCATENATE",
  formula: '=CONCATENATE(C1," - ",C2)',
  goal: [
    "اربط نصين وبينهما فاصل واضح.",
    "Join two text values with a separator.",
  ],
  tip: [
    "ضع الفاصل بين علامتي اقتباس؛ المسافات لا تضاف تلقائيًا. هذا دمج للنص الناتج، وليس دمجًا لخلايا الجدول.",
    "Quote the separator; spaces are not inserted automatically. This joins text values, not spreadsheet cells.",
  ],
  result: "Apple - Pear",
  demo: [
    {
      kind: "click",
      caption: [
        "اضغط D1؛ هنا هتظهر النتيجة.",
        "Click D1; this is where the result will appear.",
      ],
      cell: "D1",
    },
    {
      kind: "type",
      caption: [
        "اكتب CONCATENATE لربط النصوص.",
        "Type CONCATENATE to join text values.",
      ],
      text: "=CONCATENATE(",
    },
    {
      kind: "select",
      caption: [
        "اضغط C1 لإضافة النص الأول Apple.",
        "Click C1 to add the first text, Apple.",
      ],
      fromCell: "C1",
      toCell: "C1",
      text: "C1",
    },
    {
      kind: "type",
      caption: [
        "اكتب الفاصل: مسافة وشرطة ومسافة، بين اقتباسين.",
        "Type the separator in quotes: space, hyphen, space.",
      ],
      text: '," - ",',
    },
    {
      kind: "select",
      caption: [
        "اضغط C2 لإضافة النص الثاني Pear.",
        "Click C2 to add the second text, Pear.",
      ],
      fromCell: "C2",
      toCell: "C2",
      text: "C2",
    },
    {
      kind: "type",
      caption: ["اقفل القوس.", "Close the bracket."],
      text: ")",
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter لعرض النتيجة في D1.",
        "Press Enter to show the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["اقرأ النص الأول", "Read the first text"],
      explanation: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      calculation: "Apple",
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["أضف الفاصل", "Append the separator"],
      explanation: [
        "نضيف مسافة ثم شرطة ثم مسافة؛ الفاصل مكتوب صراحة.",
        "Append a space, a hyphen and a space; the separator is explicit.",
      ],
      calculation: '"Apple" + " - "',
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اقرأ النص الثاني", "Read the second text"],
      explanation: ["C2 تحتوي على Pear.", "C2 contains Pear."],
      calculation: "Pear",
      active: ["C2"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اربط بالترتيب", "Join in order"],
      explanation: [
        "النص الأول ثم الفاصل ثم النص الثاني.",
        "First text, then separator, then second text.",
      ],
      calculation: '"Apple" + " - " + "Pear"',
      active: [],
      matched: ["C1", "C2"],
      skipped: [],
    },
    {
      title: ["النتيجة نص واحد", "The result is one text value"],
      explanation: [
        "الناتج Apple - Pear في D1، والخليتان الأصليتان كما هما.",
        "D1 contains Apple - Pear; the two source cells are unchanged.",
      ],
      calculation: "Apple - Pear",
      active: [],
      matched: ["C1", "C2"],
      skipped: [],
    },
  ],
};
export default lesson;
