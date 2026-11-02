import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "SUMPRODUCT",
  formula: "=SUMPRODUCT(A1:A3,B1:B3)",
  result: 280,
  goal: [
    "اضرب كل صف ثم اجمع نواتج الضرب.",
    "Multiply corresponding rows, then add the products.",
  ],
  tip: [
    "النطاقات لازم تكون بنفس الأبعاد؛ القيم النصية داخل نطاقات SUMPRODUCT تُعامل كصفر.",
    "Ranges must have matching dimensions; nonnumeric entries in SUMPRODUCT arrays are treated as zero.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=SUMPRODUCT(",
      caption: [
        "اكتب =SUMPRODUCT( داخل خلية النتيجة.",
        "Type =SUMPRODUCT( inside the result cell.",
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
      text: ",",
      caption: ["اكتب , داخل خلية النتيجة.", "Type , inside the result cell."],
    },
    {
      kind: "select",
      fromCell: "B1",
      toCell: "B3",
      text: "B1:B3",
      caption: [
        "اضغط B1 واسحب إلى B3 لتحديد النطاق.",
        "Click B1 and drag to B3 to select the range.",
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
        "اضغط Enter لعرض الناتج في D1.",
        "Press Enter to show the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: [
        "نحدد A1:A3 وB1:B3 بنفس الطول.",
        "Select A1:A3 and B1:B3, with matching sizes.",
      ],
      explanation: [
        "نحدد A1:A3 وB1:B3 بنفس الطول.",
        "Select A1:A3 and B1:B3, with matching sizes.",
      ],
      calculation: "A = 10,20,30; B = 2,4,6",
    },
    {
      title: [
        "نضرب قيم الصف الأول معًا.",
        "Multiply the corresponding values in row one.",
      ],
      explanation: [
        "نضرب قيم الصف الأول معًا.",
        "Multiply the corresponding values in row one.",
      ],
      calculation: "10 × 2 = 20",
    },
    {
      title: [
        "نضرب قيم الصف الثاني معًا.",
        "Multiply the corresponding values in row two.",
      ],
      explanation: [
        "نضرب قيم الصف الثاني معًا.",
        "Multiply the corresponding values in row two.",
      ],
      calculation: "20 × 4 = 80",
    },
    {
      title: [
        "نضرب قيم الصف الثالث معًا.",
        "Multiply the corresponding values in row three.",
      ],
      explanation: [
        "نضرب قيم الصف الثالث معًا.",
        "Multiply the corresponding values in row three.",
      ],
      calculation: "30 × 6 = 180",
    },
    {
      title: [
        "نجمع النواتج، وليس مجموع كل عمود مضروبًا في الآخر.",
        "Add the products, not the product of the two column sums.",
      ],
      explanation: [
        "نجمع النواتج، وليس مجموع كل عمود مضروبًا في الآخر.",
        "Add the products, not the product of the two column sums.",
      ],
      calculation: "20 + 80 + 180 = 280",
    },
  ],
};
export default lesson;
