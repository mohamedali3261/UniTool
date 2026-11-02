import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "COUNTIFS",
  formula: '=COUNTIFS(A1:A3,">15",B1:B3,">3")',
  goal: [
    "عدّ الصفوف التي تحقق كل الشروط.",
    "Count rows meeting every condition.",
  ],
  tip: [
    "كل أزواج الشروط مرتبطة بـ AND: لازم تتحقق معًا. COUNTIFS تعدّ الصفوف ولا تجمع أرقامها.",
    "Criteria pairs are combined with AND: all must hold. COUNTIFS counts rows, not the sum of their values.",
  ],
  result: 2,
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
        "اكتب COUNTIFS للعدّ بأكثر من شرط.",
        "Type COUNTIFS to count using multiple conditions.",
      ],
      text: "=COUNTIFS(",
    },
    {
      kind: "select",
      caption: [
        "اسحب A1 إلى A3 لاختبار الشرط الأول.",
        "Drag A1 to A3 for the first test.",
      ],
      fromCell: "A1",
      toCell: "A3",
      text: "A1:A3",
    },
    {
      kind: "type",
      caption: [
        "اكتب أكبر من 15 ثم فاصلة.",
        "Type greater than 15, then a comma.",
      ],
      text: ',">15",',
    },
    {
      kind: "select",
      caption: [
        "اسحب B1 إلى B3 لاختبار الشرط الثاني.",
        "Drag B1 to B3 for the second test.",
      ],
      fromCell: "B1",
      toCell: "B3",
      text: "B1:B3",
    },
    {
      kind: "type",
      caption: [
        "اكتب أكبر من 3 ثم اقفل القوس.",
        "Type greater than 3 and close the bracket.",
      ],
      text: ',">3")',
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
      title: ["شرطان لكل صف", "Two tests per row"],
      explanation: [
        "نحتاج A أكبر من 15 وB أكبر من 3 في نفس الصف.",
        "We need A>15 and B>3 on the same row.",
      ],
      calculation: "A > 15 AND B > 3",
      active: ["A1", "A2", "A3", "B1", "B2", "B3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["الصف الأول لا يطابق", "Row one fails"],
      explanation: [
        "10 ليست أكبر من 15، و2 ليست أكبر من 3. العداد يظل صفرًا.",
        "10 is not >15 and 2 is not >3. Count remains zero.",
      ],
      calculation: "FALSE AND FALSE → 0",
      active: ["A1", "B1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["الصف الثاني يطابق", "Row two matches"],
      explanation: [
        "20 أكبر من 15، و4 أكبر من 3؛ نزيد العداد واحدًا.",
        "20>15 and 4>3; increase the count by one.",
      ],
      calculation: "0 + 1 = 1",
      active: ["A2", "B2"],
      matched: [],
      skipped: [],
    },
    {
      title: ["الصف الثالث يطابق", "Row three matches"],
      explanation: [
        "30 أكبر من 15، و6 أكبر من 3؛ نزيد العداد مرة أخرى.",
        "30>15 and 6>3; increase the count again.",
      ],
      calculation: "1 + 1 = 2",
      active: ["A3", "B3"],
      matched: ["A2", "B2"],
      skipped: [],
    },
    {
      title: ["النتيجة صفان", "The result is two rows"],
      explanation: [
        "النتيجة 2، وليست مجموع القيم 4 و6.",
        "The result is 2, not the sum of 4 and 6.",
      ],
      calculation: "= 2",
      active: [],
      matched: ["A2", "B2", "A3", "B3"],
      skipped: [],
    },
  ],
};
export default lesson;
