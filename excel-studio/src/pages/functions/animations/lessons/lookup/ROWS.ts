import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "ROWS",
  formula: "=ROWS(A1:B3)",
  result: 3,
  goal: ["احسب عدد الصفوف في نطاق.", "Count the rows in a range."],
  tip: [
    "الدالة تحسب حجم النطاق حتى لو كانت خلاياه فارغة أو بها نصوص؛ ليست مثل COUNT.",
    "This measures range size even if cells are empty or text; it differs from COUNT.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=ROWS(",
      caption: [
        "اكتب =ROWS( داخل خلية النتيجة.",
        "Type =ROWS( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "B3",
      text: "A1:B3",
      caption: [
        "اضغط A1 واسحب إلى B3 لتحديد النطاق.",
        "Click A1 and drag to B3 to select the range.",
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
      title: ["نحدد المستطيل A1:B3.", "Select the rectangle A1:B3."],
      explanation: ["نحدد المستطيل A1:B3.", "Select the rectangle A1:B3."],
      calculation: "A1:B3",
    },
    {
      title: [
        "النطاق يبدأ من الصف 1 وينتهي بالصف 3.",
        "It starts at row 1 and ends at row 3.",
      ],
      explanation: [
        "النطاق يبدأ من الصف 1 وينتهي بالصف 3.",
        "It starts at row 1 and ends at row 3.",
      ],
      calculation: "rows 1,2,3",
    },
    {
      title: [
        "النطاق يبدأ بالعمود A وينتهي بالعمود B.",
        "It starts at column A and ends at column B.",
      ],
      explanation: [
        "النطاق يبدأ بالعمود A وينتهي بالعمود B.",
        "It starts at column A and ends at column B.",
      ],
      calculation: "columns A,B",
    },
    {
      title: [
        "نعدّ الصفوف، وليس الأرقام داخل الخلايا.",
        "Count rows, not numeric values inside cells.",
      ],
      explanation: [
        "نعدّ الصفوف، وليس الأرقام داخل الخلايا.",
        "Count rows, not numeric values inside cells.",
      ],
      calculation: "3 - 1 + 1 = 3",
    },
    {
      title: ["النتيجة 3.", "The result is 3."],
      explanation: ["النتيجة 3.", "The result is 3."],
      calculation: "= 3",
    },
  ],
};
export default lesson;
