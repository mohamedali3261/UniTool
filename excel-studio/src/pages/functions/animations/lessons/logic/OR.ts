import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "OR",
  formula: "=OR(A1>50,B1>1)",
  goal: [
    "تحقق أن شرطًا واحدًا على الأقل صحيح.",
    "Check that at least one condition is true.",
  ],
  tip: [
    "OR تحتاج شرطًا صحيحًا واحدًا على الأقل؛ ترجع FALSE فقط إذا كانت كل الشروط خطأ.",
    "OR needs at least one true condition; only all-false conditions return FALSE.",
  ],
  result: true,
  demo: [
    {
      kind: "click",
      caption: [
        "اضغط D1؛ هنا هتظهر النتيجة.",
        "Click D1; this is where the result will appear.",
      ],
      cell: "D1",
    },
    {
      kind: "type",
      caption: ["اكتب OR لربط الشروط.", "Type OR to combine conditions."],
      text: "=OR(",
    },
    {
      kind: "select",
      caption: [
        "اضغط A1 لإضافة أول مرجع.",
        "Click A1 to insert the first reference.",
      ],
      fromCell: "A1",
      toCell: "A1",
      text: "A1",
    },
    {
      kind: "type",
      caption: [
        "اكتب أكبر من 50 ثم فاصلة.",
        "Type greater than 50, then a comma.",
      ],
      text: ">50,",
    },
    {
      kind: "select",
      caption: [
        "اضغط B1 لإضافة المرجع الثاني.",
        "Click B1 to insert the second reference.",
      ],
      fromCell: "B1",
      toCell: "B1",
      text: "B1",
    },
    {
      kind: "type",
      caption: [
        "اكتب أكبر من 1 ثم اقفل القوس.",
        "Type greater than 1 and close the bracket.",
      ],
      text: ">1)",
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter لعرض النتيجة في D1.",
        "Press Enter to show the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["اقرأ أول قيمة", "Read the first value"],
      explanation: ["A1 تساوي 10.", "A1 is 10."],
      calculation: "A1 = 10",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اختبر الشرط الأول", "Test the first condition"],
      explanation: [
        "هل 10 أكبر من 50؟ لا، الشرط خطأ.",
        "Is 10 greater than 50? No: false.",
      ],
      calculation: "10 > 50 → FALSE",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اختبر الشرط الثاني", "Test the second condition"],
      explanation: [
        "B1=2 أكبر من 1، إذن الشرط الثاني صحيح.",
        "B1=2 is greater than 1, so the second condition is true.",
      ],
      calculation: "2 > 1 → TRUE",
      active: ["B1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اربط الشرطين", "Combine the conditions"],
      explanation: [
        "الأول خطأ لكن الثاني صحيح، وهذا يكفي لـ OR.",
        "The first is false, but the second is true; that is enough for OR.",
      ],
      calculation: "FALSE OR TRUE → TRUE",
      active: [],
      matched: ["A1", "B1"],
      skipped: [],
    },
    {
      title: ["النتيجة منطقية", "A logical result"],
      explanation: [
        "الناتج TRUE (صحيح)، وليس جمعًا للأرقام.",
        "The result is TRUE, not a sum of the input numbers.",
      ],
      calculation: "= TRUE",
      active: [],
      matched: ["A1", "B1"],
      skipped: [],
    },
  ],
};
export default lesson;
