import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "COUNTIF",
  formula: '=COUNTIF(A1:A3,">15")',
  goal: [
    "عدّ الخلايا التي تحقق شرطًا واحدًا.",
    "Count cells meeting one condition.",
  ],
  tip: [
    "ضع شرط المقارنة بين علامتي اقتباس. الدالة تعدّ المطابقات ولا تجمع قيمها.",
    "Quote the comparison criterion. This function counts matches, not their values.",
  ],
  result: 2,
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
      caption: ["اكتب =COUNTIF( داخل D1.", "Type =COUNTIF( inside D1."],
      text: "=COUNTIF(",
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
        "اكتب الشرط بين علامتي اقتباس: أكبر من 15.",
        "Type the criterion in quotes: greater than 15.",
      ],
      text: ',">15"',
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
      title: ["افهم شرط المطابقة", "Understand the condition"],
      explanation: [
        "نختبر كل قيمة في A1:A3: هل هي أكبر من 15؟ إذا طابقت نزيد العداد بواحد.",
        "Test whether each value in A1:A3 is greater than 15. For a match, increase the counter by one.",
      ],
      calculation: ">15",
      active: ["A1", "A2", "A3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["الصف الأول لا يطابق", "Row one does not match"],
      explanation: [
        "A1=10 ليست أكبر من 15؛ نتخطى الصف دون إضافة.",
        "A1=10 is not greater than 15; skip this row without adding.",
      ],
      calculation: "10 > 15 → FALSE; total = 0",
      active: ["A1"],
      matched: [],
      skipped: ["A1"],
    },
    {
      title: ["الصف 2 يطابق", "Row 2 matches"],
      explanation: [
        "A2=20 أكبر من 15؛ نضيف 1 إلى عداد المطابقات، وليس قيمة الخلية.",
        "A2=20 is greater than 15; add 1 to the count, not the cell value.",
      ],
      calculation: "20 > 15 → TRUE; 0 + 1 = 1",
      active: ["A2"],
      matched: [],
      skipped: ["A1"],
    },
    {
      title: ["الصف 3 يطابق", "Row 3 matches"],
      explanation: [
        "A3=30 أكبر من 15؛ نضيف 1 إلى عداد المطابقات، وليس قيمة الخلية.",
        "A3=30 is greater than 15; add 1 to the count, not the cell value.",
      ],
      calculation: "30 > 15 → TRUE; 1 + 1 = 2",
      active: ["A3"],
      matched: ["A2"],
      skipped: ["A1"],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "يوجد رقمان أكبر من 15: 20 و30؛ النتيجة 2.",
        "Two values exceed 15: 20 and 30; the result is 2.",
      ],
      calculation: "= 2",
      active: [],
      matched: ["A2", "A3"],
      skipped: ["A1"],
    },
  ],
};
export default lesson;
