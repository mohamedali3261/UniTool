import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "NOT",
  formula: "=NOT(A1>5)",
  result: false,
  goal: ["اعكس نتيجة شرط منطقي.", "Reverse a logical condition."],
  tip: [
    "NOT تعكس TRUE وFALSE؛ ليست طرحًا حسابيًا أو تغييرًا لإشارة الرقم.",
    "NOT reverses TRUE/FALSE; it is not subtraction or numeric sign reversal.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=NOT(",
      caption: [
        "اكتب =NOT( داخل خلية النتيجة.",
        "Type =NOT( inside the result cell.",
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
      text: ">5)",
      caption: [
        "اكتب >5) داخل خلية النتيجة.",
        "Type >5) inside the result cell.",
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
      title: ["نقرأ A1 وهي 10.", "Read A1, which is 10."],
      explanation: ["نقرأ A1 وهي 10.", "Read A1, which is 10."],
      calculation: "A1 = 10",
    },
    {
      title: ["نختبر هل هي أكبر من 5.", "Check whether it exceeds 5."],
      explanation: ["نختبر هل هي أكبر من 5.", "Check whether it exceeds 5."],
      calculation: "10 > 5",
    },
    {
      title: ["الشرط الأصلي صحيح.", "The original condition is true."],
      explanation: ["الشرط الأصلي صحيح.", "The original condition is true."],
      calculation: "TRUE",
    },
    {
      title: ["NOT تعكس الصحيح إلى خطأ.", "NOT changes true to false."],
      explanation: ["NOT تعكس الصحيح إلى خطأ.", "NOT changes true to false."],
      calculation: "NOT(TRUE) → FALSE",
    },
    {
      title: [
        "الناتج FALSE؛ المقارنة نفسها لم تتغير.",
        "The result is FALSE; the original comparison is unchanged.",
      ],
      explanation: [
        "الناتج FALSE؛ المقارنة نفسها لم تتغير.",
        "The result is FALSE; the original comparison is unchanged.",
      ],
      calculation: "= FALSE",
    },
  ],
};
export default lesson;
