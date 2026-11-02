import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "TRIM",
  formula: '=TRIM("  "&C1&"  ")',
  result: "Apple",
  goal: ["احذف المسافات الزائدة حول النص.", "Remove extra spaces around text."],
  tip: [
    "TRIM تختصر أيضًا المسافات العادية المتكررة بين الكلمات إلى واحدة، لكنها لا تنظف كل أنواع مسافات Unicode مثل المسافة غير القابلة للكسر.",
    "TRIM also collapses repeated ordinary internal spaces to one, but not every Unicode whitespace character, such as nonbreaking space.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: '=TRIM("  "&',
      caption: [
        'اكتب =TRIM("  "& داخل خلية النتيجة.',
        'Type =TRIM("  "& inside the result cell.',
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
      text: '&"  ")',
      caption: [
        'اكتب &"  ") داخل خلية النتيجة.',
        'Type &"  ") inside the result cell.',
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
      title: [
        "نقرأ Apple ونضيف مسافتين قبلها وبعدها للتجربة.",
        "Read Apple and add two spaces before and after it for this example.",
      ],
      explanation: [
        "نقرأ Apple ونضيف مسافتين قبلها وبعدها للتجربة.",
        "Read Apple and add two spaces before and after it for this example.",
      ],
      calculation: '"  " & Apple & "  "',
    },
    {
      title: [
        "النص الداخل يحتوي على مسافات زائدة.",
        "The input contains extra spaces.",
      ],
      explanation: [
        "النص الداخل يحتوي على مسافات زائدة.",
        "The input contains extra spaces.",
      ],
      calculation: '"  Apple  "',
    },
    {
      title: [
        "TRIM تزيل المسافات العادية في البداية.",
        "TRIM removes leading ordinary spaces.",
      ],
      explanation: [
        "TRIM تزيل المسافات العادية في البداية.",
        "TRIM removes leading ordinary spaces.",
      ],
      calculation: '"Apple  "',
    },
    {
      title: [
        "تزيل أيضًا المسافات العادية في النهاية.",
        "It also removes trailing ordinary spaces.",
      ],
      explanation: [
        "تزيل أيضًا المسافات العادية في النهاية.",
        "It also removes trailing ordinary spaces.",
      ],
      calculation: '"Apple"',
    },
    {
      title: [
        "الناتج Apple بلا مسافات إضافية.",
        "The result is Apple without extra spaces.",
      ],
      explanation: [
        "الناتج Apple بلا مسافات إضافية.",
        "The result is Apple without extra spaces.",
      ],
      calculation: "Apple",
    },
  ],
};
export default lesson;
