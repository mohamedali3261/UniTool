import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "SUBSTITUTE",
  formula: '=SUBSTITUTE(C1,"p","b")',
  result: "Abble",
  goal: [
    "استبدل نصًا معينًا داخل الخلية.",
    "Replace specific text inside a cell.",
  ],
  tip: [
    "SUBSTITUTE حساسة لحالة الحروف، وبدون المعامل الرابع تستبدل كل الظهورات المطابقة.",
    "SUBSTITUTE is case-sensitive and replaces all matches when the fourth argument is omitted.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=SUBSTITUTE(",
      caption: [
        "اكتب =SUBSTITUTE( داخل خلية النتيجة.",
        "Type =SUBSTITUTE( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "C1",
      toCell: "C1",
      text: "C1",
      caption: [
        "اضغط C1 لإضافة مرجع الخلية.",
        "Click C1 to insert the cell reference.",
      ],
    },
    {
      kind: "type",
      text: ',"p","b")',
      caption: [
        'اكتب ,"p","b") داخل خلية النتيجة.',
        'Type ,"p","b") inside the result cell.',
      ],
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter لعرض الناتج.",
        "Press Enter to display the result.",
      ],
    },
  ],
  steps: [
    {
      title: ["النص الأصلي هو Apple.", "The original text is Apple."],
      explanation: ["النص الأصلي هو Apple.", "The original text is Apple."],
      calculation: "Apple",
    },
    {
      title: ["نبحث عن كل حرف p.", "Find each letter p."],
      explanation: ["نبحث عن كل حرف p.", "Find each letter p."],
      calculation: "A [p] [p] l e",
    },
    {
      title: ["نستبدل أول p بالحرف b.", "Replace the first p with b."],
      explanation: ["نستبدل أول p بالحرف b.", "Replace the first p with b."],
      calculation: "Abple",
    },
    {
      title: [
        "نستبدل ثاني p أيضًا؛ لم نحدد رقم ظهور معين.",
        "Replace the second p too; no instance number was specified.",
      ],
      explanation: [
        "نستبدل ثاني p أيضًا؛ لم نحدد رقم ظهور معين.",
        "Replace the second p too; no instance number was specified.",
      ],
      calculation: "Abble",
    },
    {
      title: [
        "الناتج Abble وتبقى C1 كما هي.",
        "The result is Abble; C1 stays unchanged.",
      ],
      explanation: [
        "الناتج Abble وتبقى C1 كما هي.",
        "The result is Abble; C1 stays unchanged.",
      ],
      calculation: "Abble",
    },
  ],
};
export default lesson;
