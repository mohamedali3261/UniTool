import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "AND",
  formula: "=AND(A1>5,B1>1)",
  goal: ["تحقق أن كل الشروط صحيحة.", "Check that every condition is true."],
  tip: [
    "AND تحتاج تحقق كل الشروط؛ شرط واحد خطأ يكفي لإرجاع FALSE.",
    "AND requires every condition; one false condition makes FALSE.",
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
      caption: ["اكتب AND لربط الشروط.", "Type AND to combine conditions."],
      text: "=AND(",
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
        "اكتب أكبر من 5 ثم فاصلة.",
        "Type greater than 5, then a comma.",
      ],
      text: ">5,",
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
        "هل 10 أكبر من 5؟ نعم، الشرط صحيح.",
        "Is 10 greater than 5? Yes: true.",
      ],
      calculation: "10 > 5 → TRUE",
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
        "الشرطان صحيحان، إذن AND صحيحة.",
        "Both conditions are true, so AND is true.",
      ],
      calculation: "TRUE AND TRUE → TRUE",
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
