import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "COUNT",
  formula: "=COUNT(A1:C3)",
  goal: [
    "عدّ الأرقام فقط، وليس مجموع قيمها.",
    "Count numeric cells, not their sum.",
  ],
  tip: [
    "النصوص والخلايا الفارغة داخل النطاق لا تُحسب. تواريخ Excel المخزنة كأرقام تُحسب.",
    "Text and blank cells in the range are ignored. Excel dates stored as numbers count.",
  ],
  result: 6,
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
      caption: ["اكتب =COUNT( داخل D1.", "Type =COUNT( inside D1."],
      text: "=COUNT(",
    },
    {
      kind: "select",
      caption: [
        "اضغط A1 واسحب حتى C3؛ النطاق هيتكتب تلقائيًا.",
        "Press A1 and drag to C3; the range is inserted automatically.",
      ],
      fromCell: "A1",
      toCell: "C3",
      text: "A1:C3",
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
      title: ["حدد نطاق العد", "Select the count range"],
      explanation: [
        "النطاق A1:C3 يحتوي على 9 خلايا. نريد معرفة عدد الخلايا الرقمية فقط.",
        "A1:C3 contains 9 cells. We want only the numeric-cell count.",
      ],
      calculation: "COUNT(A1:C3)",
      active: ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["افحص الصف 1", "Check row 1"],
      explanation: [
        "A1 وB1 أرقام: نضيف 2 للعداد. C1 نص فلا يُحسب.",
        "A1 and B1 are numbers: add 2 to the counter. C1 is text and is skipped.",
      ],
      calculation: "0 + 2 = 2",
      active: ["A1", "B1"],
      matched: [],
      skipped: ["C1"],
    },
    {
      title: ["افحص الصف 2", "Check row 2"],
      explanation: [
        "A2 وB2 أرقام: نضيف 2 للعداد. C2 نص فلا يُحسب.",
        "A2 and B2 are numbers: add 2 to the counter. C2 is text and is skipped.",
      ],
      calculation: "2 + 2 = 4",
      active: ["A2", "B2"],
      matched: ["A1", "B1"],
      skipped: ["C1", "C2"],
    },
    {
      title: ["افحص الصف 3", "Check row 3"],
      explanation: [
        "A3 وB3 أرقام: نضيف 2 للعداد. C3 نص فلا يُحسب.",
        "A3 and B3 are numbers: add 2 to the counter. C3 is text and is skipped.",
      ],
      calculation: "4 + 2 = 6",
      active: ["A3", "B3"],
      matched: ["A1", "B1", "A2", "B2"],
      skipped: ["C1", "C2", "C3"],
    },
    {
      title: ["6 خلايا رقمية", "6 numeric cells"],
      explanation: [
        "لم نجمع 10 و20 وغيرهما؛ عددنا الخلايا التي تحتوي على أرقام.",
        "We did not add 10, 20 and the other values; we counted numeric cells.",
      ],
      calculation: "= 6",
      active: [],
      matched: ["A1", "B1", "A2", "B2", "A3", "B3"],
      skipped: ["C1", "C2", "C3"],
    },
  ],
};
export default lesson;
