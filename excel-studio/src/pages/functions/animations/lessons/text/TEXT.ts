import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "TEXT",
  formula: '=TEXT(A1/3,"0.00")',
  result: "3.33",
  goal: [
    "اعرض رقمًا كنص بتنسيق عشري محدد.",
    "Format a number as text with fixed decimal places.",
  ],
  tip: [
    "TEXT تعيد نصًا وتختلف عن تنسيق الخلية أو ROUND. المثال يتحقق من هذا النمط البسيط فقط، وليس كل أنماط Excel المحلية.",
    "TEXT returns text, unlike cell formatting or ROUND. This example validates a simple format, not all localized Excel format patterns.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=TEXT(",
      caption: [
        "اكتب =TEXT( داخل خلية النتيجة.",
        "Type =TEXT( inside the result cell.",
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
      text: '/3,"0.00")',
      caption: [
        'اكتب /3,"0.00") داخل خلية النتيجة.',
        'Type /3,"0.00") inside the result cell.',
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
      calculation: "A1 = 10",
    },
    {
      title: ["نقسمها على 3.", "Divide it by 3."],
      explanation: ["نقسمها على 3.", "Divide it by 3."],
      calculation: "10 ÷ 3 = 3.3333…",
    },
    {
      title: [
        'التنسيق "0.00" يطلب منزلتين عشريتين.',
        'The format "0.00" requests two decimal places.',
      ],
      explanation: [
        'التنسيق "0.00" يطلب منزلتين عشريتين.',
        'The format "0.00" requests two decimal places.',
      ],
      calculation: 'format = "0.00"',
    },
    {
      title: ["ننسّق العرض إلى 3.33.", "Format the display as 3.33."],
      explanation: ["ننسّق العرض إلى 3.33.", "Format the display as 3.33."],
      calculation: '3.3333… → "3.33"',
    },
    {
      title: [
        'الناتج نص "3.33" وليس قيمة رقمية مقربة مثل ROUND.',
        'The result is text "3.33", not a rounded numeric value like ROUND returns.',
      ],
      explanation: [
        'الناتج نص "3.33" وليس قيمة رقمية مقربة مثل ROUND.',
        'The result is text "3.33", not a rounded numeric value like ROUND returns.',
      ],
      calculation: '"3.33"',
    },
  ],
};
export default lesson;
