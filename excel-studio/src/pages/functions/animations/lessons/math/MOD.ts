import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "MOD",
  formula: "=MOD(A2,3)",
  result: 2,
  goal: ["احسب باقي القسمة.", "Calculate the remainder after division."],
  tip: [
    "القاسم لا يكون صفرًا. إشارة باقي MOD تتبع إشارة القاسم.",
    "The divisor cannot be zero. MOD follows the sign of the divisor.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=MOD(",
      caption: [
        "اكتب =MOD( داخل خلية النتيجة.",
        "Type =MOD( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A2",
      toCell: "A2",
      text: "A2",
      caption: [
        "اضغط A2 لإضافة مرجع الخلية.",
        "Click A2 to insert the cell reference.",
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
      title: ["A2 تساوي 20.", "A2 is 20."],
      explanation: ["A2 تساوي 20.", "A2 is 20."],
      calculation: "20",
    },
    {
      title: ["نقسم على 3.", "Divide by 3."],
      explanation: ["نقسم على 3.", "Divide by 3."],
      calculation: "20 ÷ 3",
    },
    {
      title: [
        "أكبر مضاعف لـ3 لا يتجاوز 20 هو 18.",
        "The largest multiple of 3 not exceeding 20 is 18.",
      ],
      explanation: [
        "أكبر مضاعف لـ3 لا يتجاوز 20 هو 18.",
        "The largest multiple of 3 not exceeding 20 is 18.",
      ],
      calculation: "3 × 6 = 18",
    },
    {
      title: [
        "نطرح 18 من 20 لمعرفة الباقي.",
        "Subtract 18 from 20 to get the remainder.",
      ],
      explanation: [
        "نطرح 18 من 20 لمعرفة الباقي.",
        "Subtract 18 from 20 to get the remainder.",
      ],
      calculation: "20 - 18 = 2",
    },
    {
      title: [
        "الناتج هو الباقي 2، وليس خارج القسمة.",
        "Return the remainder 2, not the quotient.",
      ],
      explanation: [
        "الناتج هو الباقي 2، وليس خارج القسمة.",
        "Return the remainder 2, not the quotient.",
      ],
      calculation: "= 2",
    },
  ],
};
export default lesson;
