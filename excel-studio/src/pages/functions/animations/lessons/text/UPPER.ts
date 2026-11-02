import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "UPPER",
  formula: "=UPPER(C1)",
  result: "APPLE",
  goal: [
    "حوّل الحروف الإنجليزية إلى حروف كبيرة.",
    "Convert English letters to uppercase.",
  ],
  tip: [
    "الحروف العربية لا تملك حالة كبيرة أو صغيرة؛ الأرقام وعلامات الترقيم لا تتأثر.",
    "Arabic letters do not have upper/lower case; digits and punctuation are unaffected.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=UPPER(",
      caption: [
        "اكتب =UPPER( داخل خلية النتيجة.",
        "Type =UPPER( inside the result cell.",
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
      text: ")",
      caption: ["اكتب ) داخل خلية النتيجة.", "Type ) inside the result cell."],
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
      title: ["نقرأ Apple من C1.", "Read Apple from C1."],
      explanation: ["نقرأ Apple من C1.", "Read Apple from C1."],
      calculation: "Apple",
    },
    {
      title: [
        "نطبّق التحويل إلى حروف كبيرة.",
        "Apply conversion to uppercase.",
      ],
      explanation: [
        "نطبّق التحويل إلى حروف كبيرة.",
        "Apply conversion to uppercase.",
      ],
      calculation: "UPPER(Apple)",
    },
    {
      title: [
        "الحروف التي لها حالة مختلفة تتحول.",
        "Letters with a different case are converted.",
      ],
      explanation: [
        "الحروف التي لها حالة مختلفة تتحول.",
        "Letters with a different case are converted.",
      ],
      calculation: "A → A",
    },
    {
      title: [
        "نكمل باقي الحروف دون تغيير ترتيبها.",
        "Process the remaining letters in the same order.",
      ],
      explanation: [
        "نكمل باقي الحروف دون تغيير ترتيبها.",
        "Process the remaining letters in the same order.",
      ],
      calculation: "APPLE",
    },
    {
      title: [
        "الناتج نص جديد؛ C1 تظل كما هي.",
        "Return new text; C1 stays unchanged.",
      ],
      explanation: [
        "الناتج نص جديد؛ C1 تظل كما هي.",
        "Return new text; C1 stays unchanged.",
      ],
      calculation: "APPLE",
    },
  ],
};
export default lesson;
