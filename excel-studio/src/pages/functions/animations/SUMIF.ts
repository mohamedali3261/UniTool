import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "SUMIF",
  formula: '=SUMIF(A1:A3,">15",B1:B3)',
  goal: [
    "اجمع من عمود بشرط في عمود آخر.",
    "Sum one column based on a condition in another.",
  ],
  tip: [
    "طابق الصفوف بين نطاق الشرط ونطاق الجمع. نجمع B لا A في هذا المثال.",
    "Align the condition and sum ranges by row. This example sums B, not A.",
  ],
  result: 10,
  steps: [
    {
      title: ["افهم شرط المطابقة", "Understand the condition"],
      explanation: [
        "نختبر كل قيمة في A1:A3: هل هي أكبر من 15؟ إذا طابقت نجمع قيمة B في نفس الصف.",
        "Test whether each value in A1:A3 is greater than 15. For a match, add B from that same row.",
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
      skipped: ["A1", "B1"],
    },
    {
      title: ["الصف 2 يطابق", "Row 2 matches"],
      explanation: [
        "A2=20 أكبر من 15؛ نجمع B2=4، وليس قيمة A2.",
        "A2=20 is greater than 15; add B2=4, not the A2 value.",
      ],
      calculation: "20 > 15 → TRUE; 0 + 4 = 4",
      active: ["A2", "B2"],
      matched: [],
      skipped: ["A1", "B1"],
    },
    {
      title: ["الصف 3 يطابق", "Row 3 matches"],
      explanation: [
        "A3=30 أكبر من 15؛ نجمع B3=6، وليس قيمة A3.",
        "A3=30 is greater than 15; add B3=6, not the A3 value.",
      ],
      calculation: "30 > 15 → TRUE; 4 + 6 = 10",
      active: ["A3", "B3"],
      matched: ["A2", "B2"],
      skipped: ["A1", "B1"],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "جمعنا 4 + 6 = 10 من B2 وB3.",
        "Added B2 and B3: 4 + 6 = 10.",
      ],
      calculation: "= 10",
      active: [],
      matched: ["A2", "A3", "B2", "B3"],
      skipped: ["A1", "B1"],
    },
  ],
};
export default lesson;
