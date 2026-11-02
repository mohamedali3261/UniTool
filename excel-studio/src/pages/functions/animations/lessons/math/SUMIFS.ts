import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "SUMIFS",
  formula: '=SUMIFS(B1:B3,A1:A3,">15",C1:C3,"Apple")',
  goal: [
    "اجمع القيم التي تحقق شرطين معًا.",
    "Sum values whose rows meet both conditions.",
  ],
  tip: [
    "SUMIFS تبدأ بنطاق الجمع، ثم نطاق كل شرط وشرطه. لازم النطاقات تكون بنفس الحجم والترتيب. لا تخلط ترتيبها مع SUMIF.",
    "SUMIFS starts with the sum range, then each criteria range and criterion. Ranges must align in size and order. Its argument order differs from SUMIF.",
  ],
  result: 6,
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
        "اكتب SUMIFS لنجمع بأكثر من شرط.",
        "Type SUMIFS to sum using multiple conditions.",
      ],
      text: "=SUMIFS(",
    },
    {
      kind: "select",
      caption: [
        "اسحب B1 إلى B3: ده نطاق الأرقام اللي هنجمعها.",
        "Drag B1 to B3: these are the numbers to sum.",
      ],
      fromCell: "B1",
      toCell: "B3",
      text: "B1:B3",
    },
    {
      kind: "type",
      caption: [
        "اكتب فاصلة للانتقال لأول نطاق شرط.",
        "Type a comma before the first criteria range.",
      ],
      text: ",",
    },
    {
      kind: "select",
      caption: [
        "حدد A1:A3 للشرط الأول.",
        "Select A1:A3 for the first condition.",
      ],
      fromCell: "A1",
      toCell: "A3",
      text: "A1:A3",
    },
    {
      kind: "type",
      caption: [
        "اكتب الشرط الأول: أكبر من 15.",
        "Type the first condition: greater than 15.",
      ],
      text: ',">15",',
    },
    {
      kind: "select",
      caption: [
        "حدد C1:C3 للشرط الثاني.",
        "Select C1:C3 for the second condition.",
      ],
      fromCell: "C1",
      toCell: "C3",
      text: "C1:C3",
    },
    {
      kind: "type",
      caption: [
        "اكتب Apple بين اقتباسين ثم اقفل القوس. لازم الشرطان يتحققا في نفس الصف.",
        "Type Apple in quotes and close the bracket. Both conditions must hold on the same row.",
      ],
      text: ',"Apple")',
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
      title: ["حدد ما سنجمعه", "Choose what to sum"],
      explanation: [
        "نجمع B فقط، لكن نختبر A وC.",
        "Sum B, while testing A and C.",
      ],
      calculation: 'SUM B; A > 15 AND C = "Apple"',
      active: ["B1", "B2", "B3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["افحص الصف الأول", "Check row one"],
      explanation: [
        "A1=10 لا تحقق أكبر من 15؛ نتخطى B1 رغم أن C1 هي Apple.",
        "A1=10 fails >15; skip B1 even though C1 is Apple.",
      ],
      calculation: "10 > 15 → FALSE",
      active: ["A1", "C1"],
      matched: [],
      skipped: ["B1"],
    },
    {
      title: ["افحص الصف الثاني", "Check row two"],
      explanation: [
        "A2=20 تحقق الشرط الأول، لكن C2 هي Pear وليست Apple؛ نتخطى B2.",
        "A2=20 passes the first condition, but C2 is Pear, not Apple; skip B2.",
      ],
      calculation: "TRUE AND FALSE → FALSE",
      active: ["A2", "C2"],
      matched: [],
      skipped: ["B1", "B2"],
    },
    {
      title: ["الصف الثالث يحقق الشرطين", "Row three meets both conditions"],
      explanation: [
        "A3=30 أكبر من 15 وC3 هي Apple؛ نأخذ B3=6.",
        "A3=30 is greater than 15 and C3 is Apple; take B3=6.",
      ],
      calculation: "TRUE AND TRUE → add 6",
      active: ["A3", "C3", "B3"],
      matched: [],
      skipped: ["B1", "B2"],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "صف واحد فقط طابق الشرطين؛ مجموع قيم B المطابقة هو 6.",
        "Only one row meets both conditions; its B value sums to 6.",
      ],
      calculation: "= 6",
      active: [],
      matched: ["A3", "C3", "B3"],
      skipped: [],
    },
  ],
};
export default lesson;
