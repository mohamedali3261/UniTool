import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "TRUNC",
  formula: "=TRUNC((B1-A1)/3,0)",
  result: -2,
  goal: [
    "احذف الكسور دون التقريب لأسفل.",
    "Remove the fractional portion without rounding down.",
  ],
  tip: [
    "TRUNC(-2.6) تساوي -2، لكن INT(-2.6) تساوي -3. الفرق مهم مع الأرقام السالبة.",
    "TRUNC(-2.6) is -2, while INT(-2.6) is -3. This matters with negative numbers.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=TRUNC((",
      caption: [
        "اكتب =TRUNC(( داخل خلية النتيجة.",
        "Type =TRUNC(( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "B1",
      toCell: "B1",
      text: "B1",
      caption: [
        "اضغط B1 لإضافة مرجع الخلية.",
        "Click B1 to insert its reference.",
      ],
    },
    {
      kind: "type",
      text: "-",
      caption: ["اكتب - داخل خلية النتيجة.", "Type - inside the result cell."],
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
      text: ")/3,0)",
      caption: [
        "اكتب )/3,0) داخل خلية النتيجة.",
        "Type )/3,0) inside the result cell.",
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
      title: ["B1=2 وA1=10.", "B1=2 and A1=10."],
      explanation: ["B1=2 وA1=10.", "B1=2 and A1=10."],
      calculation: "2, 10",
    },
    {
      title: ["نحسب الفرق بينهما.", "Subtract the two values."],
      explanation: ["نحسب الفرق بينهما.", "Subtract the two values."],
      calculation: "2 - 10 = -8",
    },
    {
      title: ["نقسم الفرق على 3.", "Divide the difference by 3."],
      explanation: ["نقسم الفرق على 3.", "Divide the difference by 3."],
      calculation: "-8 ÷ 3 = -2.6666…",
    },
    {
      title: [
        "المعامل 0 يعني عدم الاحتفاظ بمنازل عشرية.",
        "Argument 0 requests no decimal places.",
      ],
      explanation: [
        "المعامل 0 يعني عدم الاحتفاظ بمنازل عشرية.",
        "Argument 0 requests no decimal places.",
      ],
      calculation: "TRUNC(-2.6666…,0)",
    },
    {
      title: [
        "نحذف الكسور باتجاه الصفر فيصبح الناتج -2.",
        "Discard the fractional part toward zero to get -2.",
      ],
      explanation: [
        "نحذف الكسور باتجاه الصفر فيصبح الناتج -2.",
        "Discard the fractional part toward zero to get -2.",
      ],
      calculation: "= -2",
    },
  ],
};
export default lesson;
