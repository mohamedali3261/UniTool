import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "COUNTBLANK",
  formula: "=COUNTBLANK(D2:D3)",
  result: 2,
  goal: ["عدّ الخلايا الفارغة فقط.", "Count empty cells only."],
  tip: [
    "الصفر والنصوص ليست خلايا فارغة. COUNTBLANK تحسب أيضًا النص الفارغ الناتج عن معادلة.",
    "Zero and text are not blank cells. COUNTBLANK also counts formula-generated empty strings.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=COUNTBLANK(",
      caption: [
        "اكتب =COUNTBLANK( داخل خلية النتيجة.",
        "Type =COUNTBLANK( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "D2",
      toCell: "D3",
      text: "D2:D3",
      caption: [
        "اضغط D2 واسحب إلى D3 لتحديد النطاق.",
        "Click D2 and drag to D3 to select the range.",
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
      title: [
        "D2 وD3 فارغتان في جدول المثال.",
        "D2 and D3 are empty in this example sheet.",
      ],
      explanation: [
        "D2 وD3 فارغتان في جدول المثال.",
        "D2 and D3 are empty in this example sheet.",
      ],
      calculation: "D2 = empty; D3 = empty",
    },
    {
      title: [
        "نحدد D2:D3، دون خلية الناتج D1.",
        "Select D2:D3 without the result cell D1.",
      ],
      explanation: [
        "نحدد D2:D3، دون خلية الناتج D1.",
        "Select D2:D3 without the result cell D1.",
      ],
      calculation: "D2:D3",
    },
    {
      title: [
        "D2 فارغة فنزيد العداد إلى 1.",
        "D2 is empty, so increase the count to 1.",
      ],
      explanation: [
        "D2 فارغة فنزيد العداد إلى 1.",
        "D2 is empty, so increase the count to 1.",
      ],
      calculation: "0 + 1 = 1",
    },
    {
      title: [
        "D3 فارغة فنزيد العداد إلى 2.",
        "D3 is empty, so increase the count to 2.",
      ],
      explanation: [
        "D3 فارغة فنزيد العداد إلى 2.",
        "D3 is empty, so increase the count to 2.",
      ],
      calculation: "1 + 1 = 2",
    },
    {
      title: ["عدد الخلايا الفارغة هو 2.", "There are two blank cells."],
      explanation: ["عدد الخلايا الفارغة هو 2.", "There are two blank cells."],
      calculation: "= 2",
    },
  ],
};
export default lesson;
