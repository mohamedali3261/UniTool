import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "MAX",
  formula: "=MAX(A1:A3)",
  goal: [
    "احتفظ بأكبر رقم أثناء المرور على الخلايا.",
    "Keep the largest number as you scan the cells.",
  ],
  tip: [
    "الدالة تعيد القيمة الأكبر، وليس عنوان الخلية. النصوص داخل النطاق لا تدخل المقارنة.",
    "Returns the largest value, not its cell address. Text in the range is ignored.",
  ],
  result: 30,
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
      caption: ["اكتب =MAX( داخل D1.", "Type =MAX( inside D1."],
      text: "=MAX(",
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
      calculation: "MAX(A1:A3)",
      active: ["A1", "A2", "A3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["قارن A1 = 10", "Compare A1 = 10"],
      explanation: [
        "نقارن الرقم الحالي بأفضل قيمة حتى الآن؛ الأكبر الآن 10.",
        "Compare the current number with the running maximum. It is now 10.",
      ],
      calculation: "MAX(10) = 10",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["قارن A2 = 20", "Compare A2 = 20"],
      explanation: [
        "نقارن الرقم الحالي بأفضل قيمة حتى الآن؛ الأكبر الآن 20.",
        "Compare the current number with the running maximum. It is now 20.",
      ],
      calculation: "MAX(10, 20) = 20",
      active: ["A2"],
      matched: ["A1"],
      skipped: [],
    },
    {
      title: ["قارن A3 = 30", "Compare A3 = 30"],
      explanation: [
        "نقارن الرقم الحالي بأفضل قيمة حتى الآن؛ الأكبر الآن 30.",
        "Compare the current number with the running maximum. It is now 30.",
      ],
      calculation: "MAX(10, 20, 30) = 30",
      active: ["A3"],
      matched: ["A1", "A2"],
      skipped: [],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "انتهينا من النطاق. نتيجة MAX هي 30.",
        "The whole range has been processed. MAX returns 30.",
      ],
      calculation: "= 30",
      active: [],
      matched: ["A1", "A2", "A3"],
      skipped: [],
    },
  ],
};
export default lesson;
