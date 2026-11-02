import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "COUNTA",
  formula: "=COUNTA(A1:C3)",
  goal: [
    "عدّ كل خلية غير فارغة، حتى النصوص.",
    "Count every nonempty cell, including text.",
  ],
  tip: [
    "COUNTA يحسب النصوص والأرقام والقيم المنطقية والأخطاء، وحتى النص الفارغ الناتج من معادلة. ليس بديلًا لـ COUNT.",
    "COUNTA includes text, numbers, logical values, errors and formula-generated empty strings. It differs from COUNT.",
  ],
  result: 9,
  steps: [
    {
      title: ["ابحث عن الخلايا غير الفارغة", "Find nonempty cells"],
      explanation: [
        "أي خلية بها قيمة تدخل في العد؛ لا نشترط أن تكون رقمًا.",
        "Any cell containing a value counts; it need not be numeric.",
      ],
      calculation: "COUNTA(A1:C3)",
      active: [],
      matched: [],
      skipped: [],
    },
    {
      title: ["عدّ الصف 1", "Count row 1"],
      explanation: [
        "الخلايا A1 وB1 وC1 غير فارغة، فنضيف 3. النص في C1 يُحسب أيضًا.",
        "A1, B1 and C1 are nonempty, so add 3. The text in C1 counts too.",
      ],
      calculation: "0 + 3 = 3",
      active: ["A1", "B1", "C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["عدّ الصف 2", "Count row 2"],
      explanation: [
        "الخلايا A2 وB2 وC2 غير فارغة، فنضيف 3. النص في C2 يُحسب أيضًا.",
        "A2, B2 and C2 are nonempty, so add 3. The text in C2 counts too.",
      ],
      calculation: "3 + 3 = 6",
      active: ["A2", "B2", "C2"],
      matched: ["A1", "B1", "C1"],
      skipped: [],
    },
    {
      title: ["عدّ الصف 3", "Count row 3"],
      explanation: [
        "الخلايا A3 وB3 وC3 غير فارغة، فنضيف 3. النص في C3 يُحسب أيضًا.",
        "A3, B3 and C3 are nonempty, so add 3. The text in C3 counts too.",
      ],
      calculation: "6 + 3 = 9",
      active: ["A3", "B3", "C3"],
      matched: ["A1", "B1", "C1", "A2", "B2", "C2"],
      skipped: [],
    },
    {
      title: ["كل الخلايا التسع غير فارغة", "All nine cells are nonempty"],
      explanation: [
        "النتيجة 9. في نفس النطاق، COUNT يعدّ 6 أرقام فقط.",
        "The result is 9. On this same range, COUNT counts only 6 numbers.",
      ],
      calculation: "= 9",
      active: [],
      matched: ["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"],
      skipped: [],
    },
  ],
};
export default lesson;
