import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "QUOTIENT",
  formula: "=QUOTIENT(A2,3)",
  result: 6,
  goal: [
    "احسب الجزء الصحيح من ناتج القسمة.",
    "Return the integer portion of a division.",
  ],
  tip: [
    "القاسم صفر يعطي #DIV/0!. مع الأعداد السالبة تحذف الكسور باتجاه الصفر، لا إلى سالب ما لا نهاية.",
    "A zero divisor gives #DIV/0!. For negatives, truncation is toward zero, not negative infinity.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=QUOTIENT(",
      caption: [
        "اكتب =QUOTIENT( داخل خلية النتيجة.",
        "Type =QUOTIENT( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A2",
      toCell: "A2",
      text: "A2",
      caption: [
        "اضغط A2 لإضافة مرجع الخلية.",
        "Click A2 to insert its reference.",
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
        "اضغط Enter لعرض الناتج في D1.",
        "Press Enter to show the result in D1.",
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
      calculation: "20 ÷ 3 = 6.6666…",
    },
    {
      title: [
        "العدد 3 يدخل في 20 ست مرات كاملة.",
        "3 fits into 20 six whole times.",
      ],
      explanation: [
        "العدد 3 يدخل في 20 ست مرات كاملة.",
        "3 fits into 20 six whole times.",
      ],
      calculation: "3 × 6 = 18",
    },
    {
      title: [
        "QUOTIENT تحذف الجزء الكسري باتجاه الصفر.",
        "QUOTIENT discards the fractional portion toward zero.",
      ],
      explanation: [
        "QUOTIENT تحذف الجزء الكسري باتجاه الصفر.",
        "QUOTIENT discards the fractional portion toward zero.",
      ],
      calculation: "6.6666… → 6",
    },
    {
      title: [
        "النتيجة 6، أما باقي القسمة فيحسبه MOD وهو 2.",
        "The result is 6; MOD would return the remainder, 2.",
      ],
      explanation: [
        "النتيجة 6، أما باقي القسمة فيحسبه MOD وهو 2.",
        "The result is 6; MOD would return the remainder, 2.",
      ],
      calculation: "= 6",
    },
  ],
};
export default lesson;
