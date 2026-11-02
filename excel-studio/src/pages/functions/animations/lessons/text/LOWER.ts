import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "LOWER",
  formula: "=LOWER(C1)",
  result: "apple",
  goal: [
    "حوّل الحروف الإنجليزية إلى حروف صغيرة.",
    "Convert English letters to lowercase.",
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
      text: "=LOWER(",
      caption: [
        "اكتب =LOWER( داخل خلية النتيجة.",
        "Type =LOWER( inside the result cell.",
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
        "نطبّق التحويل إلى حروف صغيرة.",
        "Apply conversion to lowercase.",
      ],
      explanation: [
        "نطبّق التحويل إلى حروف صغيرة.",
        "Apply conversion to lowercase.",
      ],
      calculation: "LOWER(Apple)",
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
      calculation: "A → a",
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
      calculation: "apple",
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
      calculation: "apple",
    },
  ],
};
export default lesson;
