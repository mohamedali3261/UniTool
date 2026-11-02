import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "ODD",
  formula: "=ODD(B2)",
  result: 5,
  goal: [
    "قرّب بعيدًا عن الصفر إلى عدد فردي.",
    "Round away from zero to an odd integer.",
  ],
  tip: [
    "ODD(-4) تساوي -5، والعدد الفردي الصحيح يبقى كما هو.",
    "ODD(-4) is -5; an already odd integer remains unchanged.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=ODD(",
      caption: [
        "اكتب =ODD( داخل خلية النتيجة.",
        "Type =ODD( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "B2",
      toCell: "B2",
      text: "B2",
      caption: [
        "اضغط B2 لإضافة مرجع الخلية.",
        "Click B2 to insert its reference.",
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
      title: ["B2 تحتوي على 4.", "B2 contains 4."],
      explanation: ["B2 تحتوي على 4.", "B2 contains 4."],
      calculation: "B2 = 4",
    },
    {
      title: ["4 عدد صحيح لكنه زوجي.", "4 is an integer but is even."],
      explanation: ["4 عدد صحيح لكنه زوجي.", "4 is an integer but is even."],
      calculation: "4 is even",
    },
    {
      title: [
        "ODD تبحث عن عدد فردي في اتجاه الابتعاد عن الصفر.",
        "ODD looks for an odd integer away from zero.",
      ],
      explanation: [
        "ODD تبحث عن عدد فردي في اتجاه الابتعاد عن الصفر.",
        "ODD looks for an odd integer away from zero.",
      ],
      calculation: "…, 3, 5, 7, …",
    },
    {
      title: [
        "العدد التالي في هذا الاتجاه هو 5.",
        "The next such integer is 5.",
      ],
      explanation: [
        "العدد التالي في هذا الاتجاه هو 5.",
        "The next such integer is 5.",
      ],
      calculation: "ODD(4) = 5",
    },
    {
      title: [
        "تظهر 5، وليست قيمة منطقية.",
        "The result is 5, not a logical value.",
      ],
      explanation: [
        "تظهر 5، وليست قيمة منطقية.",
        "The result is 5, not a logical value.",
      ],
      calculation: "= 5",
    },
  ],
};
export default lesson;
