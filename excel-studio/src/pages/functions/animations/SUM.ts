import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "SUM",
  formula: "=SUM(A1:A3)",
  goal: ["اجمع 3 أرقام خطوة بخطوة.", "Add three numbers step by step."],
  tip: [
    "النقطتان : تعنيان كل الخلايا من A1 إلى A3، وليس الخليتين فقط.",
    "The colon includes every cell from A1 through A3, not just the endpoints.",
  ],
  result: 60,
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
      caption: ["اكتب =SUM( داخل D1.", "Type =SUM( inside D1."],
      text: "=SUM(",
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
      calculation: "SUM(A1:A3)",
      active: ["A1", "A2", "A3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اقرأ A1 = 10", "Read A1 = 10"],
      explanation: [
        "نضيف 10 إلى المجموع السابق 0. أصبح العدد 1.",
        "Add 10 to the previous sum 0. We have read 1 numbers.",
      ],
      calculation: "0 + 10 = 10",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اقرأ A2 = 20", "Read A2 = 20"],
      explanation: [
        "نضيف 20 إلى المجموع السابق 10. أصبح العدد 2.",
        "Add 20 to the previous sum 10. We have read 2 numbers.",
      ],
      calculation: "10 + 20 = 30",
      active: ["A2"],
      matched: ["A1"],
      skipped: [],
    },
    {
      title: ["اقرأ A3 = 30", "Read A3 = 30"],
      explanation: [
        "نضيف 30 إلى المجموع السابق 30. أصبح العدد 3.",
        "Add 30 to the previous sum 30. We have read 3 numbers.",
      ],
      calculation: "30 + 30 = 60",
      active: ["A3"],
      matched: ["A1", "A2"],
      skipped: [],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "انتهينا من النطاق. نتيجة SUM هي 60.",
        "The whole range has been processed. SUM returns 60.",
      ],
      calculation: "= 60",
      active: [],
      matched: ["A1", "A2", "A3"],
      skipped: [],
    },
  ],
};
export default lesson;
