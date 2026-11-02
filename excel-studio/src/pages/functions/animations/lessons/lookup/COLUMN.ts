import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "COLUMN",
  formula: "=COLUMN(B1)",
  result: 2,
  goal: ["اعرف رقم العمود للخلية.", "Get the cell’s column number."],
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
      text: "=COLUMN(",
      caption: [
        "اكتب =COLUMN( داخل خلية النتيجة.",
        "Type =COLUMN( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "B1",
      toCell: "B1",
      text: "B1",
      caption: [
        "اضغط B1 لإضافة مرجع الخلية.",
        "Click B1 to insert its reference.",
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
      title: ["نحدد الخلية B1.", "Select cell B1."],
      explanation: ["نحدد الخلية B1.", "Select cell B1."],
      calculation: "B1",
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
      calculation: "COLUMN(B1)",
    },
    {
      title: [
        "نحوّل حرف العمود إلى ترتيبه العددي.",
        "Convert the column letter to its ordinal number.",
      ],
      explanation: [
        "نحوّل حرف العمود إلى ترتيبه العددي.",
        "Convert the column letter to its ordinal number.",
      ],
      calculation: "A=1, B=2",
    },
    {
      title: ["إذن رقم العمود هو 2.", "The column number is 2."],
      explanation: ["إذن رقم العمود هو 2.", "The column number is 2."],
      calculation: "= 2",
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
      calculation: "COLUMN(B1) = 2",
    },
  ],
};
export default lesson;
