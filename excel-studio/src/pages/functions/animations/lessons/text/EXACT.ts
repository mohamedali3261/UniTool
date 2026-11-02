import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "EXACT",
  formula: "=EXACT(C1,C3)",
  result: true,
  goal: [
    "قارن النصوص مع مراعاة حالة الحروف.",
    "Compare text with case sensitivity.",
  ],
  tip: [
    'EXACT("Apple","apple") تساوي FALSE؛ اختلاف حالة حرف أو وجود مسافة إضافية يغيّر النتيجة.',
    'EXACT("Apple","apple") is FALSE; a case difference or extra space changes the result.',
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=EXACT(",
      caption: [
        "اكتب =EXACT( داخل خلية النتيجة.",
        "Type =EXACT( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "C1",
      toCell: "C1",
      text: "C1",
      caption: [
        "اضغط C1 لإضافة مرجع الخلية.",
        "Click C1 to insert its reference.",
      ],
    },
    {
      kind: "type",
      text: ",",
      caption: ["اكتب , داخل خلية النتيجة.", "Type , inside the result cell."],
    },
    {
      kind: "select",
      fromCell: "C3",
      toCell: "C3",
      text: "C3",
      caption: [
        "اضغط C3 لإضافة مرجع الخلية.",
        "Click C3 to insert its reference.",
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
      title: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      explanation: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      calculation: "C1 = Apple",
    },
    {
      title: ["C3 تحتوي على Apple أيضًا.", "C3 also contains Apple."],
      explanation: ["C3 تحتوي على Apple أيضًا.", "C3 also contains Apple."],
      calculation: "C3 = Apple",
    },
    {
      title: [
        "نقارن كل حرف وحالته بالترتيب.",
        "Compare every character and its case in order.",
      ],
      explanation: [
        "نقارن كل حرف وحالته بالترتيب.",
        "Compare every character and its case in order.",
      ],
      calculation: "A=A, p=p, p=p, l=l, e=e",
    },
    {
      title: [
        "كل الحروف والمسافات متطابقة في المثال.",
        "Every character and space matches in this example.",
      ],
      explanation: [
        "كل الحروف والمسافات متطابقة في المثال.",
        "Every character and space matches in this example.",
      ],
      calculation: "Apple = Apple (exact)",
    },
    {
      title: [
        "ترجع TRUE لأن النصين متطابقان تمامًا.",
        "Return TRUE because the texts match exactly.",
      ],
      explanation: [
        "ترجع TRUE لأن النصين متطابقان تمامًا.",
        "Return TRUE because the texts match exactly.",
      ],
      calculation: "= TRUE",
    },
  ],
};
export default lesson;
