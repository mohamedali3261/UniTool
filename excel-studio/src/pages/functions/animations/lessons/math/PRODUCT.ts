import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "PRODUCT",
  formula: "=PRODUCT(A1:A3)",
  result: 6000,
  goal: ["اضرب أرقام النطاق في بعضها.", "Multiply the numbers in a range."],
  tip: [
    "PRODUCT تضرب القيم الرقمية؛ وجود صفر ضمن الأرقام يجعل الناتج صفرًا.",
    "PRODUCT multiplies numeric values; a zero among them makes the product zero.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=PRODUCT(",
      caption: [
        "اكتب =PRODUCT( داخل خلية النتيجة.",
        "Type =PRODUCT( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "A3",
      text: "A1:A3",
      caption: [
        "اضغط A1 واسحب إلى A3 لتحديد النطاق.",
        "Click A1 and drag to A3 to select the range.",
      ],
    },
    {
      kind: "type",
      text: ")",
      caption: ["اكتب ) داخل خلية النتيجة.", "Type ) inside the result cell."],
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
      title: ["نقرأ 10 و20 و30 من A1:A3.", "Read 10, 20 and 30 from A1:A3."],
      explanation: [
        "نقرأ 10 و20 و30 من A1:A3.",
        "Read 10, 20 and 30 from A1:A3.",
      ],
      calculation: "10, 20, 30",
    },
    {
      title: ["نبدأ بالرقم الأول 10.", "Start with the first number, 10."],
      explanation: [
        "نبدأ بالرقم الأول 10.",
        "Start with the first number, 10.",
      ],
      calculation: "total = 10",
    },
    {
      title: ["نضرب 10 في 20.", "Multiply 10 by 20."],
      explanation: ["نضرب 10 في 20.", "Multiply 10 by 20."],
      calculation: "10 × 20 = 200",
    },
    {
      title: ["نضرب 200 في 30.", "Multiply 200 by 30."],
      explanation: ["نضرب 200 في 30.", "Multiply 200 by 30."],
      calculation: "200 × 30 = 6000",
    },
    {
      title: [
        "الناتج 6000، وليس مجموع الأرقام.",
        "The result is 6000, not their sum.",
      ],
      explanation: [
        "الناتج 6000، وليس مجموع الأرقام.",
        "The result is 6000, not their sum.",
      ],
      calculation: "= 6000",
    },
  ],
};
export default lesson;
