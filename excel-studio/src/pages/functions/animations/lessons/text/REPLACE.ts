import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "REPLACE",
  formula: '=REPLACE(C1,2,2,"XX")',
  result: "AXXle",
  goal: [
    "استبدل حروفًا حسب موضعها وعددها.",
    "Replace characters by starting position and count.",
  ],
  tip: [
    "REPLACE تختار بالموضع والعدد، أما SUBSTITUTE فتبحث عن نص مطابق. العد يبدأ من 1.",
    "REPLACE uses position and count, whereas SUBSTITUTE finds matching text. Positions start at 1.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=REPLACE(",
      caption: [
        "اكتب =REPLACE( داخل خلية النتيجة.",
        "Type =REPLACE( inside the result cell.",
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
      text: ',2,2,"XX")',
      caption: [
        'اكتب ,2,2,"XX") داخل خلية النتيجة.',
        'Type ,2,2,"XX") inside the result cell.',
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
      title: ["النص الأصلي Apple.", "The original text is Apple."],
      explanation: ["النص الأصلي Apple.", "The original text is Apple."],
      calculation: "Apple",
    },
    {
      title: [
        "نبدأ من الموضع 2 وهو أول p.",
        "Start at position 2, the first p.",
      ],
      explanation: [
        "نبدأ من الموضع 2 وهو أول p.",
        "Start at position 2, the first p.",
      ],
      calculation: "A | p p | l e",
    },
    {
      title: [
        "نحذف حرفين من هذا الموضع: pp.",
        "Remove two characters from that position: pp.",
      ],
      explanation: [
        "نحذف حرفين من هذا الموضع: pp.",
        "Remove two characters from that position: pp.",
      ],
      calculation: "remove positions 2,3",
    },
    {
      title: [
        "نضع XX بدل الحرفين ونحافظ على A وle.",
        "Insert XX while keeping A and le.",
      ],
      explanation: [
        "نضع XX بدل الحرفين ونحافظ على A وle.",
        "Insert XX while keeping A and le.",
      ],
      calculation: "A + XX + le",
    },
    {
      title: [
        "الناتج AXXle؛ C1 لا تتغير.",
        "The result is AXXle; C1 stays unchanged.",
      ],
      explanation: [
        "الناتج AXXle؛ C1 لا تتغير.",
        "The result is AXXle; C1 stays unchanged.",
      ],
      calculation: "AXXle",
    },
  ],
};
export default lesson;
