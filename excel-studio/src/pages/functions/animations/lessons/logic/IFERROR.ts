import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "IFERROR",
  formula: "=IFERROR(A1/0,0)",
  goal: [
    "اعرض بديلًا مفهومًا عند حدوث خطأ.",
    "Return a fallback when a calculation errors.",
  ],
  tip: [
    "IFERROR لا تصلح سبب الخطأ؛ هي تعرض بديلًا. استخدمها بوعي حتى لا تخفي مشكلة في البيانات. لو لم يحدث خطأ ترجع النتيجة الأصلية.",
    "IFERROR does not fix the error; it displays a fallback. Avoid hiding data problems. Without an error it returns the original result.",
  ],
  result: 0,
  demo: [
    {
      kind: "click",
      caption: [
        "اضغط D1؛ هنا هتظهر النتيجة.",
        "Click D1; this is where the result will appear.",
      ],
      cell: "D1",
    },
    {
      kind: "type",
      caption: [
        "اكتب IFERROR عشان نختبر نتيجة الحساب.",
        "Type IFERROR to check a calculation result.",
      ],
      text: "=IFERROR(",
    },
    {
      kind: "select",
      caption: ["اضغط A1 لإضافة قيمتها للحساب.", "Click A1 to use its value."],
      fromCell: "A1",
      toCell: "A1",
      text: "A1",
    },
    {
      kind: "type",
      caption: [
        "اكتب القسمة على صفر، ثم البديل 0 واقفل القوس.",
        "Type division by zero, followed by the fallback 0, then close the bracket.",
      ],
      text: "/0,0)",
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter لعرض النتيجة في D1.",
        "Press Enter to show the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["اقرأ القيمة", "Read the value"],
      explanation: ["A1 تحتوي على 10.", "A1 contains 10."],
      calculation: "A1 = 10",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["جرّب العملية الأصلية", "Try the original calculation"],
      explanation: [
        "المعادلة الداخلية تحاول حساب 10 ÷ 0.",
        "The inner calculation attempts 10 divided by zero.",
      ],
      calculation: "10 ÷ 0",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["تعرّف على الخطأ", "Recognize the error"],
      explanation: [
        "القسمة على صفر غير معرفة؛ ينتج الخطأ #DIV/0!.",
        "Division by zero is undefined; it produces #DIV/0!.",
      ],
      calculation: "#DIV/0!",
      active: ["A1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["اختر البديل", "Choose the fallback"],
      explanation: [
        "بما أن الحساب أعطى خطأ، نختار المعامل الثاني وهو 0.",
        "Because the calculation returned an error, select the second argument: 0.",
      ],
      calculation: "IFERROR(#DIV/0!, 0) → 0",
      active: [],
      matched: [],
      skipped: [],
    },
    {
      title: ["النتيجة النهائية", "Final result"],
      explanation: [
        "تظهر 0 بدل رسالة الخطأ. ده بديل عرض، مش تصحيح للقسمة على صفر.",
        "Display 0 instead of the error. This is a fallback, not a fix for division by zero.",
      ],
      calculation: "= 0",
      active: [],
      matched: [],
      skipped: [],
    },
  ],
};
export default lesson;
