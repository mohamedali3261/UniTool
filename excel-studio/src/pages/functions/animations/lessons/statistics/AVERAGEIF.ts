import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "AVERAGEIF",
  formula: '=AVERAGEIF(A1:A3,">15",B1:B3)',
  goal: ["احسب متوسط قيم تحقق شرطًا.", "Average values that meet a condition."],
  tip: [
    "نختبر A لكن نحسب متوسط B في الصفوف المطابقة. لو لا توجد أرقام مطابقة فالنتيجة #DIV/0!.",
    "Test A, but average B on matching rows. No matching numeric values produces #DIV/0!.",
  ],
  result: 5,
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
      caption: [
        "اكتب AVERAGEIF لحساب متوسط بشرط.",
        "Type AVERAGEIF for a conditional average.",
      ],
      text: "=AVERAGEIF(",
    },
    {
      kind: "select",
      caption: [
        "حدد A1:A3: هنا هنختبر الشرط.",
        "Select A1:A3: this is where the condition is tested.",
      ],
      fromCell: "A1",
      toCell: "A3",
      text: "A1:A3",
    },
    {
      kind: "type",
      caption: ["اكتب شرط أكبر من 15.", "Type the condition greater than 15."],
      text: ',">15",',
    },
    {
      kind: "select",
      caption: [
        "حدد B1:B3: دي القيم اللي هنحسب متوسطها.",
        "Select B1:B3: these values will be averaged.",
      ],
      fromCell: "B1",
      toCell: "B3",
      text: "B1:B3",
    },
    {
      kind: "type",
      caption: ["اقفل القوس.", "Close the bracket."],
      text: ")",
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
      title: ["افصل الشرط عن المتوسط", "Separate the test from the average"],
      explanation: [
        "A هو نطاق الشرط؛ B هو نطاق حساب المتوسط.",
        "A is the criteria range; B is the average range.",
      ],
      calculation: "Test A > 15; average B",
      active: ["A1", "A2", "A3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["تجاهل الصف الأول", "Skip row one"],
      explanation: [
        "A1=10 لا تحقق الشرط؛ B1=2 لا تدخل المتوسط.",
        "A1=10 fails the condition, so B1=2 is excluded.",
      ],
      calculation: "10 > 15 → FALSE",
      active: ["A1"],
      matched: [],
      skipped: ["B1"],
    },
    {
      title: ["خذ قيمة الصف الثاني", "Take row two"],
      explanation: [
        "A2=20 تحقق الشرط؛ نأخذ B2=4، وليس 20.",
        "A2=20 passes; take B2=4, not 20.",
      ],
      calculation: "sum = 4; count = 1",
      active: ["A2", "B2"],
      matched: [],
      skipped: [],
    },
    {
      title: ["خذ قيمة الصف الثالث", "Take row three"],
      explanation: [
        "A3=30 تحقق الشرط؛ نضيف B3=6 إلى 4. عندنا رقمان مطابقان.",
        "A3=30 passes; add B3=6 to 4. We have two matching numbers.",
      ],
      calculation: "4 + 6 = 10; count = 2",
      active: ["A3", "B3"],
      matched: ["B2"],
      skipped: [],
    },
    {
      title: ["اقسم المجموع على العدد", "Divide sum by count"],
      explanation: [
        "متوسط 4 و6 يساوي 10 ÷ 2 = 5.",
        "The average of 4 and 6 is 10 divided by 2: 5.",
      ],
      calculation: "10 ÷ 2 = 5",
      active: [],
      matched: ["B2", "B3"],
      skipped: [],
    },
  ],
};
export default lesson;
