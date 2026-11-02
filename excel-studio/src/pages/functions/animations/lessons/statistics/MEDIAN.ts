import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "MEDIAN",
  formula: "=MEDIAN(A1:A3)",
  result: 20,
  goal: ["اعرف القيمة الواقعة في المنتصف.", "Find the middle value."],
  tip: [
    "لو عدد الأرقام زوجي، MEDIAN تحسب متوسط الرقمين في المنتصف بعد الترتيب.",
    "For an even count, MEDIAN averages the two middle values after ordering.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=MEDIAN(",
      caption: [
        "اكتب =MEDIAN( داخل خلية النتيجة.",
        "Type =MEDIAN( inside the result cell.",
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
      text: ")",
      caption: ["اكتب ) داخل خلية النتيجة.", "Type ) inside the result cell."],
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
      title: ["نقرأ القيم 10 و20 و30.", "Read the values 10, 20 and 30."],
      explanation: ["نقرأ القيم 10 و20 و30.", "Read the values 10, 20 and 30."],
      calculation: "10, 20, 30",
    },
    {
      title: [
        "نرتب القيم من الأصغر للأكبر.",
        "Order the values from smallest to largest.",
      ],
      explanation: [
        "نرتب القيم من الأصغر للأكبر.",
        "Order the values from smallest to largest.",
      ],
      calculation: "10 ≤ 20 ≤ 30",
    },
    {
      title: [
        "عدد الأرقام 3، وهو عدد فردي.",
        "There are three numbers, an odd count.",
      ],
      explanation: [
        "عدد الأرقام 3، وهو عدد فردي.",
        "There are three numbers, an odd count.",
      ],
      calculation: "count = 3",
    },
    {
      title: [
        "الرقم الثاني في المنتصف هو 20.",
        "The second number, in the middle, is 20.",
      ],
      explanation: [
        "الرقم الثاني في المنتصف هو 20.",
        "The second number, in the middle, is 20.",
      ],
      calculation: "10 | 20 | 30",
    },
    {
      title: [
        "الوسيط 20؛ ليس بالضرورة المتوسط الحسابي دائمًا.",
        "The median is 20; it is not always the arithmetic mean.",
      ],
      explanation: [
        "الوسيط 20؛ ليس بالضرورة المتوسط الحسابي دائمًا.",
        "The median is 20; it is not always the arithmetic mean.",
      ],
      calculation: "= 20",
    },
  ],
};
export default lesson;
