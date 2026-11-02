import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "SIGN",
  formula: "=SIGN(B1-A1)",
  result: -1,
  goal: [
    "اعرف إشارة الرقم دون حجمه.",
    "Get a number’s sign, not its magnitude.",
  ],
  tip: [
    "الرقم الموجب يعطي 1، والصفر يعطي 0، والسالب يعطي -1.",
    "Positive inputs return 1, zero returns 0, and negative inputs return -1.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=SIGN(",
      caption: [
        "اكتب =SIGN( داخل خلية النتيجة.",
        "Type =SIGN( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "B1",
      toCell: "B1",
      text: "B1",
      caption: [
        "اضغط B1 لإضافة مرجع الخلية.",
        "Click B1 to insert its reference.",
      ],
    },
    {
      kind: "type",
      text: "-",
      caption: ["اكتب - داخل خلية النتيجة.", "Type - inside the result cell."],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "A1",
      text: "A1",
      caption: [
        "اضغط A1 لإضافة مرجع الخلية.",
        "Click A1 to insert its reference.",
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
      title: ["نقرأ B1=2 وA1=10.", "Read B1=2 and A1=10."],
      explanation: ["نقرأ B1=2 وA1=10.", "Read B1=2 and A1=10."],
      calculation: "2,10",
    },
    {
      title: ["نحسب الفرق.", "Calculate the difference."],
      explanation: ["نحسب الفرق.", "Calculate the difference."],
      calculation: "2 - 10 = -8",
    },
    {
      title: [
        "نختبر هل الناتج سالب أو صفر أو موجب.",
        "Check whether the result is negative, zero or positive.",
      ],
      explanation: [
        "نختبر هل الناتج سالب أو صفر أو موجب.",
        "Check whether the result is negative, zero or positive.",
      ],
      calculation: "-8 < 0",
    },
    {
      title: [
        "SIGN ترجع -1 لأي رقم سالب.",
        "SIGN returns -1 for any negative number.",
      ],
      explanation: [
        "SIGN ترجع -1 لأي رقم سالب.",
        "SIGN returns -1 for any negative number.",
      ],
      calculation: "SIGN(-8) = -1",
    },
    {
      title: ["النتيجة -1 وليست -8.", "The result is -1, not -8."],
      explanation: ["النتيجة -1 وليست -8.", "The result is -1, not -8."],
      calculation: "= -1",
    },
  ],
};
export default lesson;
