import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "MIN",
  formula: "=MIN(A1:A3)",
  goal: [
    "احتفظ بأصغر رقم أثناء المرور على الخلايا.",
    "Keep the smallest number as you scan the cells.",
  ],
  tip: [
    "الدالة تعيد القيمة الأصغر. الصفر رقم ويشارك في المقارنة؛ الخلية الفارغة ليست صفرًا.",
    "Returns the smallest value. Zero participates; an empty cell is not zero.",
  ],
  result: 10,
  demo: [
    {
      kind: "click",
      caption: [
        "اضغط على D1: هنا هنكتب المعادلة.",
        "Click D1: this is where we will enter the formula.",
      ],
      cell: "D1",
    },
    {
      kind: "type",
      caption: ["اكتب =MIN( داخل D1.", "Type =MIN( inside D1."],
      text: "=MIN(",
    },
    {
      kind: "select",
      caption: [
        "اضغط A1 واسحب حتى A3؛ النطاق هيتكتب تلقائيًا.",
        "Press A1 and drag to A3; the range is inserted automatically.",
      ],
      fromCell: "A1",
      toCell: "A3",
      text: "A1:A3",
    },
    {
      kind: "type",
      caption: [
        "اقفل القوس؛ كده المعادلة جاهزة.",
        "Close the bracket; the formula is ready.",
      ],
      text: ")",
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter وشوف النتيجة في D1.",
        "Press Enter and see the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["حدد نطاق الأرقام", "Select the numeric range"],
      explanation: [
        "نقرأ A1 ثم A2 ثم A3 بالترتيب.",
        "Read A1, A2 and A3 in order.",
      ],
      calculation: "MIN(A1:A3)",
      active: ["A1", "A2", "A3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["قارن A1 = 10", "Compare A1 = 10"],
      explanation: [
        "نقارن الرقم الحالي بأفضل قيمة حتى الآن؛ الأصغر الآن 10.",
        "Compare the current number with the running minimum. It is now 10.",
      ],
      calculation: "MIN(10) = 10",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["قارن A2 = 20", "Compare A2 = 20"],
      explanation: [
        "نقارن الرقم الحالي بأفضل قيمة حتى الآن؛ الأصغر الآن 10.",
        "Compare the current number with the running minimum. It is now 10.",
      ],
      calculation: "MIN(10, 20) = 10",
      active: ["A2"],
      matched: ["A1"],
      skipped: [],
    },
    {
      title: ["قارن A3 = 30", "Compare A3 = 30"],
      explanation: [
        "نقارن الرقم الحالي بأفضل قيمة حتى الآن؛ الأصغر الآن 10.",
        "Compare the current number with the running minimum. It is now 10.",
      ],
      calculation: "MIN(10, 20, 30) = 10",
      active: ["A3"],
      matched: ["A1", "A2"],
      skipped: [],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "انتهينا من النطاق. نتيجة MIN هي 10.",
        "The whole range has been processed. MIN returns 10.",
      ],
      calculation: "= 10",
      active: [],
      matched: ["A1", "A2", "A3"],
      skipped: [],
    },
  ],
};
export default lesson;
