import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "SMALL",
  formula: "=SMALL(A1:A3,2)",
  result: 20,
  goal: ["استخرج ثاني أصغر رقم.", "Find the second smallest number."],
  tip: [
    "الترتيب يبدأ من 1. القيم المتكررة تُحسب ضمن الترتيب؛ k خارج عدد الأرقام يعطي #NUM!.",
    "Ranking starts at 1. Duplicate values occupy ranks; k outside the numeric count gives #NUM!.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=SMALL(",
      caption: [
        "اكتب =SMALL( داخل خلية النتيجة.",
        "Type =SMALL( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "A3",
      text: "A1:A3",
      caption: [
        "اضغط A1 واسحب إلى A3 لتحديد النطاق.",
        "Click A1 and drag to A3 to select the range.",
      ],
    },
    {
      kind: "type",
      text: ",2)",
      caption: [
        "اكتب ,2) داخل خلية النتيجة.",
        "Type ,2) inside the result cell.",
      ],
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter لعرض الناتج.",
        "Press Enter to display the result.",
      ],
    },
  ],
  steps: [
    {
      title: [
        "نحدد A1:A3: القيم 10 و20 و30.",
        "Select A1:A3: values 10, 20 and 30.",
      ],
      explanation: [
        "نحدد A1:A3: القيم 10 و20 و30.",
        "Select A1:A3: values 10, 20 and 30.",
      ],
      calculation: "10, 20, 30",
    },
    {
      title: [
        "الترتيب المطلوب 2، وليس رقم الصف.",
        "Rank 2 is requested; it is not a row number.",
      ],
      explanation: [
        "الترتيب المطلوب 2، وليس رقم الصف.",
        "Rank 2 is requested; it is not a row number.",
      ],
      calculation: "k = 2",
    },
    {
      title: ["نرتب القيم حسب الدالة.", "Order the values for this function."],
      explanation: [
        "نرتب القيم حسب الدالة.",
        "Order the values for this function.",
      ],
      calculation: "10, 20, 30",
    },
    {
      title: [
        "نأخذ القيمة الثانية: ثاني أصغر رقم هو 20.",
        "Take the second value: the second smallest number is 20.",
      ],
      explanation: [
        "نأخذ القيمة الثانية: ثاني أصغر رقم هو 20.",
        "Take the second value: the second smallest number is 20.",
      ],
      calculation: "rank 2 → 20",
    },
    {
      title: ["النتيجة 20.", "The result is 20."],
      explanation: ["النتيجة 20.", "The result is 20."],
      calculation: "= 20",
    },
  ],
};
export default lesson;
