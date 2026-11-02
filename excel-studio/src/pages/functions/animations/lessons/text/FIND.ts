import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "FIND",
  formula: '=FIND("p",C1)',
  result: 2,
  goal: [
    "ابحث عن موضع حرف داخل النص.",
    "Find a character’s position inside text.",
  ],
  tip: [
    "FIND حساسة لحالة الحروف ولا تدعم wildcards؛ عدم العثور يعطي #VALUE! والمواضع تبدأ من 1.",
    "FIND is case-sensitive and has no wildcards; no match gives #VALUE!, and positions start at 1.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: '=FIND("p",',
      caption: [
        'اكتب =FIND("p", داخل خلية النتيجة.',
        'Type =FIND("p", inside the result cell.',
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
      title: ["نبحث عن الحرف p.", "Look for the character p."],
      explanation: ["نبحث عن الحرف p.", "Look for the character p."],
      calculation: 'needle = "p"',
    },
    {
      title: [
        "FIND تفرق بين الحروف الكبيرة والصغيرة.",
        "FIND is case-sensitive.",
      ],
      explanation: [
        "FIND تفرق بين الحروف الكبيرة والصغيرة.",
        "FIND is case-sensitive.",
      ],
      calculation: "p ≠ P",
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
