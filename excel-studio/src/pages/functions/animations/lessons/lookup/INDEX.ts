import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "INDEX",
  formula: "=INDEX(A1:B3,2,2)",
  result: 4,
  goal: [
    "ارجع قيمة من تقاطع صف وعمود داخل نطاق.",
    "Return a value at a row/column intersection within a range.",
  ],
  tip: [
    "أرقام الصف والعمود نسبية لبداية النطاق، وليست أرقام الصفحات الكاملة في Excel.",
    "Row and column indices are relative to the selected range, not the entire worksheet.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=INDEX(",
      caption: [
        "اكتب =INDEX( داخل خلية النتيجة.",
        "Type =INDEX( inside the result cell.",
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
      text: ",2,2)",
      caption: [
        "اكتب ,2,2) داخل خلية النتيجة.",
        "Type ,2,2) inside the result cell.",
      ],
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
      title: ["نحدد جدول A1:B3.", "Select the table A1:B3."],
      explanation: ["نحدد جدول A1:B3.", "Select the table A1:B3."],
      calculation: "A1:B3",
    },
    {
      title: [
        "المعامل الثاني 2 يعني ثاني صف داخل النطاق.",
        "Argument 2 selects the second row within the range.",
      ],
      explanation: [
        "المعامل الثاني 2 يعني ثاني صف داخل النطاق.",
        "Argument 2 selects the second row within the range.",
      ],
      calculation: "row = 2 → A2:B2",
    },
    {
      title: [
        "المعامل الثالث 2 يعني ثاني عمود داخل النطاق.",
        "The third argument 2 selects the second column within the range.",
      ],
      explanation: [
        "المعامل الثالث 2 يعني ثاني عمود داخل النطاق.",
        "The third argument 2 selects the second column within the range.",
      ],
      calculation: "column = 2 → B",
    },
    {
      title: [
        "التقاطع هو B2 وقيمتها 4.",
        "The intersection is B2, containing 4.",
      ],
      explanation: [
        "التقاطع هو B2 وقيمتها 4.",
        "The intersection is B2, containing 4.",
      ],
      calculation: "B2 = 4",
    },
    {
      title: [
        "INDEX ترجع القيمة 4، لا رقم الصف أو العنوان.",
        "INDEX returns 4, not the row number or address.",
      ],
      explanation: [
        "INDEX ترجع القيمة 4، لا رقم الصف أو العنوان.",
        "INDEX returns 4, not the row number or address.",
      ],
      calculation: "= 4",
    },
  ],
};
export default lesson;
