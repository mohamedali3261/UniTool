import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "EVEN",
  formula: "=EVEN(A1/3)",
  result: 4,
  goal: [
    "قرّب بعيدًا عن الصفر إلى عدد زوجي.",
    "Round away from zero to an even integer.",
  ],
  tip: [
    "EVEN ليست اختبارًا للزوجية؛ هي تقريب بعيدًا عن الصفر. EVEN(-3) تساوي -4.",
    "EVEN is not a parity test; it rounds away from zero. EVEN(-3) is -4.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=EVEN(",
      caption: [
        "اكتب =EVEN( داخل خلية النتيجة.",
        "Type =EVEN( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "A1",
      text: "A1",
      caption: [
        "اضغط A1 لإضافة مرجع الخلية.",
        "Click A1 to insert its reference.",
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
        "اضغط Enter لعرض الناتج في D1.",
        "Press Enter to show the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["A1 تحتوي على 10.", "A1 contains 10."],
      explanation: ["A1 تحتوي على 10.", "A1 contains 10."],
      calculation: "10",
    },
    {
      title: ["نحسب القسمة أولًا.", "Divide first."],
      explanation: ["نحسب القسمة أولًا.", "Divide first."],
      calculation: "10 ÷ 3 = 3.3333…",
    },
    {
      title: [
        "نحتاج عددًا صحيحًا زوجيًا بعيدًا عن الصفر.",
        "Find the next even integer away from zero.",
      ],
      explanation: [
        "نحتاج عددًا صحيحًا زوجيًا بعيدًا عن الصفر.",
        "Find the next even integer away from zero.",
      ],
      calculation: "…, 2, 4, 6, …",
    },
    {
      title: ["العدد الزوجي التالي هو 4.", "The next even integer is 4."],
      explanation: ["العدد الزوجي التالي هو 4.", "The next even integer is 4."],
      calculation: "EVEN(3.3333…) = 4",
    },
    {
      title: ["تظهر النتيجة 4.", "The result is 4."],
      explanation: ["تظهر النتيجة 4.", "The result is 4."],
      calculation: "= 4",
    },
  ],
};
export default lesson;
