import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "MID",
  formula: "=MID(C1,2,3)",
  result: "ppl",
  goal: ["استخرج حروفًا من وسط النص.", "Extract characters from within text."],
  tip: [
    "عدّ المواضع يبدأ من 1 وليس صفرًا؛ المعامل الأخير هو عدد الحروف لا موضع النهاية.",
    "Positions start at 1, not zero; the last argument is a count, not an ending position.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=MID(",
      caption: [
        "اكتب =MID( داخل خلية النتيجة.",
        "Type =MID( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "C1",
      toCell: "C1",
      text: "C1",
      caption: [
        "اضغط C1 لإضافة مرجع الخلية.",
        "Click C1 to insert the cell reference.",
      ],
    },
    {
      kind: "type",
      text: ",2,3)",
      caption: [
        "اكتب ,2,3) داخل خلية النتيجة.",
        "Type ,2,3) inside the result cell.",
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
      title: ["نقرأ Apple من C1.", "Read Apple from C1."],
      explanation: ["نقرأ Apple من C1.", "Read Apple from C1."],
      calculation: "Apple",
    },
    {
      title: [
        "الموضع 2 يعني البدء من أول p.",
        "Position 2 means start at the first p.",
      ],
      explanation: [
        "الموضع 2 يعني البدء من أول p.",
        "Position 2 means start at the first p.",
      ],
      calculation: "A=1, p=2, p=3, l=4, e=5",
    },
    {
      title: [
        "نحتاج 3 حروف من هذا الموضع.",
        "Take three characters from this position.",
      ],
      explanation: [
        "نحتاج 3 حروف من هذا الموضع.",
        "Take three characters from this position.",
      ],
      calculation: "start = 2; count = 3",
    },
    {
      title: ["نأخذ المواضع 2 و3 و4.", "Take positions 2, 3 and 4."],
      explanation: ["نأخذ المواضع 2 و3 و4.", "Take positions 2, 3 and 4."],
      calculation: "p + p + l",
    },
    {
      title: ["الناتج ppl.", "The result is ppl."],
      explanation: ["الناتج ppl.", "The result is ppl."],
      calculation: "ppl",
    },
  ],
};
export default lesson;
