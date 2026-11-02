import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "ROUND",
  formula: "=ROUND(A1/3,2)",
  goal: [
    "قرّب ناتج القسمة إلى منزلتين عشريتين.",
    "Round a division result to two decimal places.",
  ],
  tip: [
    "المعامل الثاني 2 يعني منزلتين بعد الفاصلة، وليس رقمين في العدد كله. ROUND تغيّر القيمة المحسوبة؛ تنسيق الخلية وحده يغيّر العرض فقط.",
    "The second argument 2 means two decimal places, not two significant digits. ROUND changes the calculated value; cell formatting only changes display.",
  ],
  result: 3.33,
  demo: [
    {
      kind: "click",
      caption: [
        "اضغط D1؛ هنا هتظهر النتيجة.",
        "Click D1; this is where the result will appear.",
      ],
      cell: "D1",
    },
    {
      kind: "type",
      caption: [
        "اكتب ROUND لتقريب ناتج الحساب.",
        "Type ROUND to round the calculation.",
      ],
      text: "=ROUND(",
    },
    {
      kind: "select",
      caption: [
        "اضغط A1: الرقم الذي سنقسمه هو 10.",
        "Click A1: the number to divide is 10.",
      ],
      fromCell: "A1",
      toCell: "A1",
      text: "A1",
    },
    {
      kind: "type",
      caption: [
        "اكتب /3 للقسمة، ثم 2 لعدد المنازل واقفل القوس.",
        "Type /3 to divide, then 2 for decimal places and close the bracket.",
      ],
      text: "/3,2)",
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter لعرض النتيجة في D1.",
        "Press Enter to show the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["اقرأ الرقم", "Read the number"],
      explanation: ["A1 تساوي 10.", "A1 is 10."],
      calculation: "A1 = 10",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["احسب القسمة أولًا", "Divide first"],
      explanation: [
        "10 ÷ 3 تعطي عددًا عشريًا متكررًا.",
        "10 divided by 3 gives a recurring decimal.",
      ],
      calculation: "10 ÷ 3 = 3.333333…",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["حدد منزلتين", "Keep two decimal places"],
      explanation: [
        "نحتفظ بأول رقمين بعد الفاصلة: 33.",
        "Keep the first two digits after the decimal point: 33.",
      ],
      calculation: "3.33 | 3333…",
      active: [],
      matched: [],
      skipped: [],
    },
    {
      title: ["افحص الرقم التالي", "Inspect the next digit"],
      explanation: [
        "الرقم الثالث 3 أقل من 5، لذلك لا نزيد المنزلة الثانية.",
        "The third digit is 3, below 5, so the second digit stays unchanged.",
      ],
      calculation: "third digit 3 < 5",
      active: [],
      matched: [],
      skipped: [],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "الناتج المقرب لمنزلتين هو 3.33.",
        "Rounded to two decimal places, the result is 3.33.",
      ],
      calculation: "= 3.33",
      active: [],
      matched: ["A1"],
      skipped: [],
    },
  ],
};
export default lesson;
