import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "LEN",
  formula: "=LEN(C1)",
  goal: ["اعرف عدد حروف النص داخل الخلية.", "Count the characters in a cell."],
  tip: [
    "LEN تحسب المسافات أيضًا. في هذا المثال لا توجد مسافات داخل Apple؛ النص الأصلي لا يتغير.",
    "LEN also counts spaces. Apple has no spaces in this example; the original text is unchanged.",
  ],
  result: 5,
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
        "اكتب LEN لعدّ حروف النص.",
        "Type LEN to count text characters.",
      ],
      text: "=LEN(",
    },
    {
      kind: "select",
      caption: [
        "اضغط C1، وهي تحتوي على Apple.",
        "Click C1, which contains Apple.",
      ],
      fromCell: "C1",
      toCell: "C1",
      text: "C1",
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
      title: ["اقرأ النص", "Read the text"],
      explanation: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      calculation: 'C1 = "Apple"',
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["ابدأ العد", "Start counting"],
      explanation: [
        "A هي الحرف الأول وp هي الحرف الثاني.",
        "A is character one and p is character two.",
      ],
      calculation: "A = 1; p = 2",
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["كمّل الحروف", "Continue counting"],
      explanation: [
        "p الثانية هي الحرف الثالث، وl الرابع.",
        "The second p is character three; l is character four.",
      ],
      calculation: "p = 3; l = 4",
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["الحرف الأخير", "The last character"],
      explanation: [
        "e هي الحرف الخامس؛ لا توجد مسافات أخرى نعدّها.",
        "e is character five; there are no extra spaces to count.",
      ],
      calculation: "e = 5",
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["النتيجة رقم", "The result is a number"],
      explanation: [
        "عدد حروف Apple هو 5؛ لم نرجع النص نفسه.",
        "Apple has 5 characters; the function returns the count, not the text.",
      ],
      calculation: "= 5",
      active: [],
      matched: ["C1"],
      skipped: [],
    },
  ],
};
export default lesson;
