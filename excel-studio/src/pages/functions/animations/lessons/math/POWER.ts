import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "POWER",
  formula: "=POWER(B1,3)",
  result: 8,
  goal: ["ارفع الرقم للقوة الثالثة.", "Raise a number to the third power."],
  tip: [
    "الأس ليس معامل ضرب؛ POWER(2,3) تختلف عن 2*3.",
    "An exponent is not a multiplier; POWER(2,3) differs from 2*3.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=POWER(",
      caption: [
        "اكتب =POWER( داخل خلية النتيجة.",
        "Type =POWER( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "B1",
      toCell: "B1",
      text: "B1",
      caption: [
        "اضغط B1 لإضافة مرجع الخلية.",
        "Click B1 to insert the cell reference.",
      ],
    },
    {
      kind: "type",
      text: ",3)",
      caption: [
        "اكتب ,3) داخل خلية النتيجة.",
        "Type ,3) inside the result cell.",
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
      title: ["B1 تحتوي على 2.", "B1 contains 2."],
      explanation: ["B1 تحتوي على 2.", "B1 contains 2."],
      calculation: "B1 = 2",
    },
    {
      title: [
        "الأس هو 3: نضرب 2 في نفسها ثلاث مرات.",
        "Exponent 3 means multiply three copies of 2.",
      ],
      explanation: [
        "الأس هو 3: نضرب 2 في نفسها ثلاث مرات.",
        "Exponent 3 means multiply three copies of 2.",
      ],
      calculation: "2 × 2 × 2",
    },
    {
      title: ["نحسب أول عمليتي ضرب.", "Start multiplying the factors."],
      explanation: ["نحسب أول عمليتي ضرب.", "Start multiplying the factors."],
      calculation: "2 × 2 = 4",
    },
    {
      title: ["نضرب الناتج في 2 مرة أخرى.", "Multiply by 2 once more."],
      explanation: ["نضرب الناتج في 2 مرة أخرى.", "Multiply by 2 once more."],
      calculation: "4 × 2 = 8",
    },
    {
      title: [
        "الناتج 8؛ ليست العملية 2 × 3.",
        "The result is 8, not 2 times 3.",
      ],
      explanation: [
        "الناتج 8؛ ليست العملية 2 × 3.",
        "The result is 8, not 2 times 3.",
      ],
      calculation: "= 8",
    },
  ],
};
export default lesson;
