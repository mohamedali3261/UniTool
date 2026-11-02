import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "AVERAGE",
  formula: "=AVERAGE(A1:A3)",
  goal: [
    "احسب مجموع الأرقام ثم اقسم على عددها.",
    "Sum the numbers, then divide by their count.",
  ],
  tip: [
    "الصفر يُحسب ضمن العدد؛ الخلايا الفارغة والنصوص داخل النطاق تُتجاهل. لو لا توجد أرقام فالنتيجة #DIV/0!.",
    "Zero counts; blank cells and text in a range are ignored. No numeric values produces #DIV/0!.",
  ],
  result: 20,
  steps: [
    {
      title: ["حدد نطاق الأرقام", "Select the numeric range"],
      explanation: [
        "نقرأ A1 ثم A2 ثم A3 بالترتيب.",
        "Read A1, A2 and A3 in order.",
      ],
      calculation: "AVERAGE(A1:A3)",
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
      title: ["اقسم على عدد الأرقام", "Divide by the numeric count"],
      explanation: [
        "قرأنا 3 أرقام ومجموعها 60؛ إذن المتوسط 60 ÷ 3.",
        "We read 3 numbers totaling 60, so the average is 60 divided by 3.",
      ],
      calculation: "60 ÷ 3 = 20",
      active: [],
      matched: ["A1", "A2", "A3"],
      skipped: [],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "انتهينا من النطاق. نتيجة AVERAGE هي 20.",
        "The whole range has been processed. AVERAGE returns 20.",
      ],
      calculation: "= 20",
      active: [],
      matched: ["A1", "A2", "A3"],
      skipped: [],
    },
  ],
};
export default lesson;
