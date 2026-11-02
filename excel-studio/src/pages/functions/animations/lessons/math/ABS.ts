import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "ABS",
  formula: "=ABS(A1-A2)",
  result: 10,
  goal: [
    "احصل على قيمة الفرق دون إشارة سالبة.",
    "Get the magnitude of a difference without its negative sign.",
  ],
  tip: [
    "ABS لا تقرّب الرقم؛ تزيل الإشارة السالبة فقط، والموجب يبقى كما هو.",
    "ABS does not round; negative values lose their sign and positive values stay unchanged.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=ABS(",
      caption: [
        "اكتب =ABS( داخل خلية النتيجة.",
        "Type =ABS( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "A1",
      text: "A1",
      caption: [
        "اضغط A1 لإضافة مرجع الخلية.",
        "Click A1 to insert the cell reference.",
      ],
    },
    {
      kind: "type",
      text: "-",
      caption: ["اكتب - داخل خلية النتيجة.", "Type - inside the result cell."],
    },
    {
      kind: "select",
      fromCell: "A2",
      toCell: "A2",
      text: "A2",
      caption: [
        "اضغط A2 لإضافة مرجع الخلية.",
        "Click A2 to insert the cell reference.",
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
      title: ["A1 تساوي 10 وA2 تساوي 20.", "A1 is 10 and A2 is 20."],
      explanation: ["A1 تساوي 10 وA2 تساوي 20.", "A1 is 10 and A2 is 20."],
      calculation: "10, 20",
    },
    {
      title: [
        "نحسب الطرح داخل الأقواس أولًا.",
        "Calculate the subtraction inside the brackets first.",
      ],
      explanation: [
        "نحسب الطرح داخل الأقواس أولًا.",
        "Calculate the subtraction inside the brackets first.",
      ],
      calculation: "10 - 20",
    },
    {
      title: ["الفرق سالب عشرة.", "The difference is negative ten."],
      explanation: ["الفرق سالب عشرة.", "The difference is negative ten."],
      calculation: "= -10",
    },
    {
      title: [
        "ABS تأخذ المسافة من الصفر دون إشارة.",
        "ABS returns the distance from zero without a sign.",
      ],
      explanation: [
        "ABS تأخذ المسافة من الصفر دون إشارة.",
        "ABS returns the distance from zero without a sign.",
      ],
      calculation: "ABS(-10)",
    },
    {
      title: ["النتيجة عشرة.", "The result is ten."],
      explanation: ["النتيجة عشرة.", "The result is ten."],
      calculation: "= 10",
    },
  ],
};
export default lesson;
