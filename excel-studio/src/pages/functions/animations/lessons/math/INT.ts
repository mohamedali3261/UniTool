import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "INT",
  formula: "=INT(A1/3)",
  result: 3,
  goal: ["قرّب لأسفل إلى أقرب عدد صحيح.", "Round down to the nearest integer."],
  tip: [
    "INT(-3.2) تساوي -4؛ هي تقريب لأسفل وليست مجرد حذف الكسور في الأعداد السالبة.",
    "INT(-3.2) is -4; rounding down differs from truncation for negative numbers.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=INT(",
      caption: [
        "اكتب =INT( داخل خلية النتيجة.",
        "Type =INT( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "A1",
      text: "A1",
      caption: [
        "اضغط A1 لإضافة مرجع الخلية.",
        "Click A1 to insert the cell reference.",
      ],
    },
    {
      kind: "type",
      text: "/3)",
      caption: [
        "اكتب /3) داخل خلية النتيجة.",
        "Type /3) inside the result cell.",
      ],
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter لعرض الناتج.",
        "Press Enter to display the result.",
      ],
    },
  ],
  steps: [
    {
      title: ["نقرأ A1 وهي 10.", "Read A1, which is 10."],
      explanation: ["نقرأ A1 وهي 10.", "Read A1, which is 10."],
      calculation: "A1 = 10",
    },
    {
      title: ["نحسب 10 ÷ 3.", "Calculate 10 divided by 3."],
      explanation: ["نحسب 10 ÷ 3.", "Calculate 10 divided by 3."],
      calculation: "3.3333…",
    },
    {
      title: [
        "نبحث عن عدد صحيح لا يزيد على الناتج.",
        "Find an integer no greater than this value.",
      ],
      explanation: [
        "نبحث عن عدد صحيح لا يزيد على الناتج.",
        "Find an integer no greater than this value.",
      ],
      calculation: "3 ≤ 3.3333…",
    },
    {
      title: [
        "أقرب عدد صحيح لأسفل هو 3.",
        "The nearest integer below it is 3.",
      ],
      explanation: [
        "أقرب عدد صحيح لأسفل هو 3.",
        "The nearest integer below it is 3.",
      ],
      calculation: "INT(3.3333…)",
    },
    {
      title: ["يظهر 3 في D1.", "D1 shows 3."],
      explanation: ["يظهر 3 في D1.", "D1 shows 3."],
      calculation: "= 3",
    },
  ],
};
export default lesson;
