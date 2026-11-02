import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "VALUE",
  formula: '=VALUE(B1&"0")',
  result: 20,
  goal: [
    "حوّل نصًا رقميًا إلى رقم للحساب.",
    "Convert numeric text into a number for calculation.",
  ],
  tip: [
    "VALUE لا تحوّل أي كلمة إلى رقم؛ النص غير الرقمي يعطي #VALUE!. تنسيقات الفواصل والعملات تختلف حسب البيئة.",
    "VALUE cannot turn arbitrary words into numbers; nonnumeric text gives #VALUE!. Separator and currency formats vary by environment.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=VALUE(",
      caption: [
        "اكتب =VALUE( داخل خلية النتيجة.",
        "Type =VALUE( inside the result cell.",
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
      text: '&"0")',
      caption: [
        'اكتب &"0") داخل خلية النتيجة.',
        'Type &"0") inside the result cell.',
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
      title: ["B1 تحتوي على الرقم 2.", "B1 contains the number 2."],
      explanation: ["B1 تحتوي على الرقم 2.", "B1 contains the number 2."],
      calculation: "B1 = 2",
    },
    {
      title: [
        'نربطه بالنص "0" باستخدام &.',
        'Join it to the text "0" using &.',
      ],
      explanation: [
        'نربطه بالنص "0" باستخدام &.',
        'Join it to the text "0" using &.',
      ],
      calculation: '2 & "0"',
    },
    {
      title: [
        'الربط ينتج النص "20"، وليس 2+0.',
        'Concatenation produces text "20", not 2+0.',
      ],
      explanation: [
        'الربط ينتج النص "20"، وليس 2+0.',
        'Concatenation produces text "20", not 2+0.',
      ],
      calculation: '"20"',
    },
    {
      title: [
        "VALUE تحوّل النص الرقمي إلى رقم.",
        "VALUE converts numeric text into a number.",
      ],
      explanation: [
        "VALUE تحوّل النص الرقمي إلى رقم.",
        "VALUE converts numeric text into a number.",
      ],
      calculation: 'VALUE("20")',
    },
    {
      title: [
        "الناتج الرقم 20 ويمكن استخدامه في الحساب.",
        "The result is numeric 20, usable in arithmetic.",
      ],
      explanation: [
        "الناتج الرقم 20 ويمكن استخدامه في الحساب.",
        "The result is numeric 20, usable in arithmetic.",
      ],
      calculation: "= 20",
    },
  ],
};
export default lesson;
