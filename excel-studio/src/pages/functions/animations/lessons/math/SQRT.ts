import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "SQRT",
  formula: "=SQRT(B2)",
  result: 2,
  goal: ["احسب الجذر التربيعي الموجب.", "Find the nonnegative square root."],
  tip: [
    "SQRT لرقم سالب ترجع #NUM! في الحسابات الحقيقية، ولا تعيد -2 كجذر للعدد 4.",
    "A negative input returns #NUM! in real arithmetic. SQRT(4) returns 2, not -2.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=SQRT(",
      caption: [
        "اكتب =SQRT( داخل خلية النتيجة.",
        "Type =SQRT( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "B2",
      toCell: "B2",
      text: "B2",
      caption: [
        "اضغط B2 لإضافة مرجع الخلية.",
        "Click B2 to insert the cell reference.",
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
      title: ["B2 تحتوي على 4.", "B2 contains 4."],
      explanation: ["B2 تحتوي على 4.", "B2 contains 4."],
      calculation: "B2 = 4",
    },
    {
      title: [
        "نبحث عن رقم إذا ضربناه في نفسه يعطينا 4.",
        "Find a number whose square is 4.",
      ],
      explanation: [
        "نبحث عن رقم إذا ضربناه في نفسه يعطينا 4.",
        "Find a number whose square is 4.",
      ],
      calculation: "? × ? = 4",
    },
    {
      title: ["الرقم 2 يحقق ذلك.", "The number 2 does this."],
      explanation: ["الرقم 2 يحقق ذلك.", "The number 2 does this."],
      calculation: "2 × 2 = 4",
    },
    {
      title: [
        "SQRT تعيد الجذر غير السالب.",
        "SQRT returns the nonnegative root.",
      ],
      explanation: [
        "SQRT تعيد الجذر غير السالب.",
        "SQRT returns the nonnegative root.",
      ],
      calculation: "SQRT(4) = 2",
    },
    {
      title: ["تظهر النتيجة 2.", "The result is 2."],
      explanation: ["تظهر النتيجة 2.", "The result is 2."],
      calculation: "= 2",
    },
  ],
};
export default lesson;
