import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "ROW",
  formula: "=ROW(A3)",
  result: 3,
  goal: ["اعرف رقم الصف للخلية.", "Get the cell’s row number."],
  tip: [
    "ROW وCOLUMN تعيدان موضع الخلية؛ لا تخلطهما مع ROWS وCOLUMNS لحساب حجم نطاق.",
    "ROW and COLUMN return position; ROWS and COLUMNS return a range’s size.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=ROW(",
      caption: [
        "اكتب =ROW( داخل خلية النتيجة.",
        "Type =ROW( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A3",
      toCell: "A3",
      text: "A3",
      caption: [
        "اضغط A3 لإضافة مرجع الخلية.",
        "Click A3 to insert its reference.",
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
      title: ["نحدد الخلية A3.", "Select cell A3."],
      explanation: ["نحدد الخلية A3.", "Select cell A3."],
      calculation: "A3",
    },
    {
      title: [
        "المطلوب موضع الخلية وليس قيمتها.",
        "We want the cell position, not its stored value.",
      ],
      explanation: [
        "المطلوب موضع الخلية وليس قيمتها.",
        "We want the cell position, not its stored value.",
      ],
      calculation: "ROW(A3)",
    },
    {
      title: ["نقرأ جزء الصف من العنوان.", "Read the row part of the address."],
      explanation: [
        "نقرأ جزء الصف من العنوان.",
        "Read the row part of the address.",
      ],
      calculation: "A3 → row 3",
    },
    {
      title: ["إذن رقم الصف هو 3.", "The row number is 3."],
      explanation: ["إذن رقم الصف هو 3.", "The row number is 3."],
      calculation: "= 3",
    },
    {
      title: [
        "الناتج لا يعتمد على تغيير الرقم المكتوب داخل الخلية.",
        "Changing the stored cell value does not change its position.",
      ],
      explanation: [
        "الناتج لا يعتمد على تغيير الرقم المكتوب داخل الخلية.",
        "Changing the stored cell value does not change its position.",
      ],
      calculation: "ROW(A3) = 3",
    },
  ],
};
export default lesson;
