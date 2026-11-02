import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "MATCH",
  formula: "=MATCH(A2,A1:A3,0)",
  result: 2,
  goal: [
    "اعرف ترتيب القيمة داخل النطاق.",
    "Find a value’s position within a range.",
  ],
  tip: [
    "MATCH تعيد موضعًا نسبيًا داخل النطاق؛ 0 تعني المطابقة التامة، وعدم وجود القيمة يعطي #N/A.",
    "MATCH returns a relative position; 0 requests an exact match, and a missing value gives #N/A.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=MATCH(",
      caption: [
        "اكتب =MATCH( داخل خلية النتيجة.",
        "Type =MATCH( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "A2",
      toCell: "A2",
      text: "A2",
      caption: [
        "اضغط A2 لإضافة مرجع الخلية.",
        "Click A2 to insert the cell reference.",
      ],
    },
    {
      kind: "type",
      text: ",",
      caption: ["اكتب , داخل خلية النتيجة.", "Type , inside the result cell."],
    },
    {
      kind: "select",
      fromCell: "A1",
      toCell: "A3",
      text: "A1:A3",
      caption: [
        "اضغط A1 واسحب إلى A3 لتحديد النطاق.",
        "Click A1 and drag to A3 to select the range.",
      ],
    },
    {
      kind: "type",
      text: ",0)",
      caption: [
        "اكتب ,0) داخل خلية النتيجة.",
        "Type ,0) inside the result cell.",
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
      title: ["قيمة البحث من A2 هي 20.", "The lookup value from A2 is 20."],
      explanation: [
        "قيمة البحث من A2 هي 20.",
        "The lookup value from A2 is 20.",
      ],
      calculation: "lookup = 20",
    },
    {
      title: [
        "نبحث داخل A1:A3 عن مطابقة تامة بسبب 0.",
        "Search A1:A3 for an exact match because of 0.",
      ],
      explanation: [
        "نبحث داخل A1:A3 عن مطابقة تامة بسبب 0.",
        "Search A1:A3 for an exact match because of 0.",
      ],
      calculation: "10, 20, 30; exact = 0",
    },
    {
      title: ["أول قيمة 10 لا تطابق.", "The first value 10 does not match."],
      explanation: [
        "أول قيمة 10 لا تطابق.",
        "The first value 10 does not match.",
      ],
      calculation: "position 1: 10 ≠ 20",
    },
    {
      title: ["ثاني قيمة 20 تطابق.", "The second value 20 matches."],
      explanation: ["ثاني قيمة 20 تطابق.", "The second value 20 matches."],
      calculation: "position 2: 20 = 20",
    },
    {
      title: [
        "النتيجة 2 هي الترتيب داخل النطاق، لا القيمة 20.",
        "The result 2 is a position in the range, not the value 20.",
      ],
      explanation: [
        "النتيجة 2 هي الترتيب داخل النطاق، لا القيمة 20.",
        "The result 2 is a position in the range, not the value 20.",
      ],
      calculation: "= 2",
    },
  ],
};
export default lesson;
