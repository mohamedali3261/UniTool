import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "IFNA",
  formula: '=IFNA(MATCH(99,A1:A3,0),"غير موجود")',
  result: "غير موجود",
  goal: [
    "اعرض بديلًا عندما لا توجد مطابقة.",
    "Display a fallback when no match is found.",
  ],
  tip: [
    "IFNA تتعامل مع #N/A فقط. لا تخفي خطأ القسمة على صفر أو كل الأخطاء مثل IFERROR.",
    "IFNA handles only #N/A. It does not hide division-by-zero errors or all errors like IFERROR does.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=IFNA(MATCH(99,",
      caption: [
        "اكتب =IFNA(MATCH(99, داخل خلية النتيجة.",
        "Type =IFNA(MATCH(99, inside the result cell.",
      ],
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
      text: ',0),"غير موجود")',
      caption: [
        'اكتب ,0),"غير موجود") داخل خلية النتيجة.',
        'Type ,0),"غير موجود") inside the result cell.',
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
      title: [
        "نبحث عن 99 في A1:A3 بمطابقة تامة.",
        "Look for 99 in A1:A3 with an exact match.",
      ],
      explanation: [
        "نبحث عن 99 في A1:A3 بمطابقة تامة.",
        "Look for 99 in A1:A3 with an exact match.",
      ],
      calculation: "MATCH(99,A1:A3,0)",
    },
    {
      title: [
        "قيم النطاق هي 10 و20 و30، ولا توجد 99.",
        "The range contains 10,20,30; 99 is absent.",
      ],
      explanation: [
        "قيم النطاق هي 10 و20 و30، ولا توجد 99.",
        "The range contains 10,20,30; 99 is absent.",
      ],
      calculation: "99 ≠ 10,20,30",
    },
    {
      title: [
        "MATCH تعيد خطأ عدم العثور #N/A.",
        "MATCH returns the not-found error #N/A.",
      ],
      explanation: [
        "MATCH تعيد خطأ عدم العثور #N/A.",
        "MATCH returns the not-found error #N/A.",
      ],
      calculation: "#N/A",
    },
    {
      title: [
        "IFNA تتعرف على هذا الخطأ وتختار النص البديل.",
        "IFNA recognizes this error and selects the fallback text.",
      ],
      explanation: [
        "IFNA تتعرف على هذا الخطأ وتختار النص البديل.",
        "IFNA recognizes this error and selects the fallback text.",
      ],
      calculation: 'IFNA(#N/A,"غير موجود")',
    },
    {
      title: [
        "تظهر عبارة غير موجود بدل الخطأ.",
        "The fallback text appears instead of the error.",
      ],
      explanation: [
        "تظهر عبارة غير موجود بدل الخطأ.",
        "The fallback text appears instead of the error.",
      ],
      calculation: "غير موجود",
    },
  ],
};
export default lesson;
