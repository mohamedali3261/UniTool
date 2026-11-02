import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "ROUNDDOWN",
  formula: "=ROUNDDOWN(A1/3,2)",
  result: 3.33,
  goal: [
    "قرّب ناتج القسمة باتجاه الصفر.",
    "Round the division result toward zero.",
  ],
  tip: [
    "ROUNDDOWN تعمل باتجاه الصفر؛ جرّب إشارة سالبة لتلاحظ الفرق عن التقريب المعتاد.",
    "ROUNDDOWN rounds toward zero; negative numbers illustrate the difference from ordinary rounding.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=ROUNDDOWN(",
      caption: [
        "اكتب =ROUNDDOWN( داخل خلية النتيجة.",
        "Type =ROUNDDOWN( inside the result cell.",
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
      text: "/3,2)",
      caption: [
        "اكتب /3,2) داخل خلية النتيجة.",
        "Type /3,2) inside the result cell.",
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
      title: ["نقسم 10 على 3.", "Divide 10 by 3."],
      explanation: ["نقسم 10 على 3.", "Divide 10 by 3."],
      calculation: "10 ÷ 3 = 3.3333…",
    },
    {
      title: [
        "المعامل 2 يطلب منزلتين عشريتين.",
        "Argument 2 requests two decimal places.",
      ],
      explanation: [
        "المعامل 2 يطلب منزلتين عشريتين.",
        "Argument 2 requests two decimal places.",
      ],
      calculation: "digits = 2",
    },
    {
      title: [
        "نقرّب باتجاه الصفر وليس حسب قاعدة الرقم 5.",
        "Round toward zero, not using the usual digit-5 rule.",
      ],
      explanation: [
        "نقرّب باتجاه الصفر وليس حسب قاعدة الرقم 5.",
        "Round toward zero, not using the usual digit-5 rule.",
      ],
      calculation: "ROUNDDOWN(3.3333…, 2)",
    },
    {
      title: ["النتيجة 3.33.", "The result is 3.33."],
      explanation: ["النتيجة 3.33.", "The result is 3.33."],
      calculation: "= 3.33",
    },
  ],
};
export default lesson;
