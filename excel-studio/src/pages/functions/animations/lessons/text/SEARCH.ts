import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "SEARCH",
  formula: '=SEARCH("P",C1)',
  result: 2,
  goal: [
    "ابحث عن موضع حرف داخل النص.",
    "Find a character’s position inside text.",
  ],
  tip: [
    "SEARCH غير حساسة لحالة الحروف وتدعم ? و*؛ استخدم ~ للهروب منهما. عدم العثور يعطي #VALUE! والعد يبدأ من 1.",
    "SEARCH ignores case and supports ? and * wildcards; escape them with ~. No match gives #VALUE!; positions start at 1.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: '=SEARCH("P",',
      caption: [
        'اكتب =SEARCH("P", داخل خلية النتيجة.',
        'Type =SEARCH("P", inside the result cell.',
      ],
    },
    {
      kind: "select",
      fromCell: "C1",
      toCell: "C1",
      text: "C1",
      caption: [
        "اضغط C1 لإضافة مرجع الخلية.",
        "Click C1 to insert its reference.",
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
      title: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      explanation: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      calculation: "Apple",
    },
    {
      title: ["نبحث عن الحرف P.", "Look for the character P."],
      explanation: ["نبحث عن الحرف P.", "Look for the character P."],
      calculation: 'needle = "P"',
    },
    {
      title: [
        "SEARCH لا تفرق بين الحروف الكبيرة والصغيرة؛ P تطابق p.",
        "SEARCH is case-insensitive; P matches p.",
      ],
      explanation: [
        "SEARCH لا تفرق بين الحروف الكبيرة والصغيرة؛ P تطابق p.",
        "SEARCH is case-insensitive; P matches p.",
      ],
      calculation: "P matches p",
    },
    {
      title: ["أول p تقع في الموضع الثاني.", "The first p is at position two."],
      explanation: [
        "أول p تقع في الموضع الثاني.",
        "The first p is at position two.",
      ],
      calculation: "A=1, p=2",
    },
    {
      title: [
        "الناتج 2، وليس الحرف نفسه.",
        "The result is 2, not the character itself.",
      ],
      explanation: [
        "الناتج 2، وليس الحرف نفسه.",
        "The result is 2, not the character itself.",
      ],
      calculation: "= 2",
    },
  ],
};
export default lesson;
