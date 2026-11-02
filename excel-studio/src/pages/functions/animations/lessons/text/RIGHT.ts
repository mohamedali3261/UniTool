import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "RIGHT",
  formula: "=RIGHT(C1,2)",
  result: "le",
  goal: ["استخرج آخر حرفين من النص.", "Extract the last two characters."],
  tip: [
    "RIGHT تعيد الحروف بترتيبها الأصلي، لا تعكسها.",
    "RIGHT preserves character order; it does not reverse text.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=RIGHT(",
      caption: [
        "اكتب =RIGHT( داخل خلية النتيجة.",
        "Type =RIGHT( inside the result cell.",
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
      text: ",2)",
      caption: [
        "اكتب ,2) داخل خلية النتيجة.",
        "Type ,2) inside the result cell.",
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
      title: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      explanation: ["C1 تحتوي على Apple.", "C1 contains Apple."],
      calculation: "Apple",
    },
    {
      title: ["نطلب حرفين من النهاية.", "Request two characters from the end."],
      explanation: [
        "نطلب حرفين من النهاية.",
        "Request two characters from the end.",
      ],
      calculation: "count = 2",
    },
    {
      title: [
        "آخر حرف هو e والذي قبله l.",
        "The last character is e, preceded by l.",
      ],
      explanation: [
        "آخر حرف هو e والذي قبله l.",
        "The last character is e, preceded by l.",
      ],
      calculation: "... l e",
    },
    {
      title: [
        "نحافظ على ترتيب الحروف كما في النص.",
        "Preserve their original order.",
      ],
      explanation: [
        "نحافظ على ترتيب الحروف كما في النص.",
        "Preserve their original order.",
      ],
      calculation: "l + e = le",
    },
    {
      title: [
        "الناتج le؛ النص الأصلي لا يتغير.",
        "The result is le; the original text stays unchanged.",
      ],
      explanation: [
        "الناتج le؛ النص الأصلي لا يتغير.",
        "The result is le; the original text stays unchanged.",
      ],
      calculation: "le",
    },
  ],
};
export default lesson;
