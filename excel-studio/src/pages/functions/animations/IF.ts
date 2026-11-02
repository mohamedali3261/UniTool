import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "IF",
  formula: '=IF(A1>5,"ناجح","راجع")',
  goal: [
    "اختبر شرطًا واختر واحدة من نتيجتين.",
    "Test a condition and choose one of two results.",
  ],
  tip: [
    "ترتيب المعاملات: الشرط، نتيجة الصحيح، نتيجة الخطأ. النصوص بين علامتي اقتباس. إذا أصبحت A1 = 3 فستكون النتيجة «راجع».",
    "Argument order: condition, true result, false result. Quote text. If A1 became 3, this formula would return راجع.",
  ],
  result: "ناجح",
  steps: [
    {
      title: ["تعرف على الاختيارين", "Identify the two branches"],
      explanation: [
        "إذا تحقق A1>5 نعيد «ناجح»، وإلا نعيد «راجع».",
        "Return ناجح if A1>5 is true; otherwise return راجع.",
      ],
      calculation: 'IF(A1>5, "ناجح", "راجع")',
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اقرأ قيمة الخلية", "Read the input"],
      explanation: [
        "A1 تساوي 10. نعوّض بقيمتها في الشرط.",
        "A1 is 10. Substitute it into the condition.",
      ],
      calculation: "10 > 5 ?",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اختبر الشرط", "Evaluate the condition"],
      explanation: [
        "10 أكبر من 5، إذن الشرط صحيح.",
        "10 is greater than 5, so the condition is true.",
      ],
      calculation: "10 > 5 → TRUE",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اختر فرع الصحيح", "Choose the true branch"],
      explanation: [
        "نختار «ناجح» ولا نعيد «راجع» في هذا المثال.",
        "Choose ناجح; the false-branch result راجع is not selected in this example.",
      ],
      calculation: 'TRUE → "ناجح"',
      active: [],
      matched: ["A1"],
      skipped: [],
    },
    {
      title: ["النتيجة نص وليست رقمًا", "The result is text"],
      explanation: [
        "الناتج النهائي «ناجح». تغيير قيمة A1 قد يغيّر الفرع المختار.",
        "The result is ناجح. Changing A1 could select the other branch.",
      ],
      calculation: "ناجح",
      active: [],
      matched: ["A1"],
      skipped: [],
    },
  ],
};
export default lesson;
