import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "LEFT",
  formula: "=LEFT(C1,3)",
  goal: [
    "استخرج أول ثلاثة حروف من النص.",
    "Extract the first three characters of text.",
  ],
  tip: [
    "LEFT تبدأ من بداية النص، وليس من يسار الصفحة حسب لغة الواجهة. اختيار 3 لا يحذف باقي النص من الخلية الأصلية.",
    "LEFT starts at the beginning of the text, regardless of interface direction. Selecting 3 does not delete characters from the source cell.",
  ],
  result: "App",
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
        "اكتب LEFT لاستخراج أول حروف النص.",
        "Type LEFT to extract the beginning of text.",
      ],
      text: "=LEFT(",
    },
    {
      kind: "select",
      caption: [
        "اضغط C1 لاستخدام النص Apple.",
        "Click C1 to use the text Apple.",
      ],
      fromCell: "C1",
      toCell: "C1",
      text: "C1",
    },
    {
      kind: "type",
      caption: [
        "اكتب 3 لعدد الحروف ثم اقفل القوس.",
        "Type 3 for the number of characters and close the bracket.",
      ],
      text: ",3)",
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
      title: ["اقرأ النص الأصلي", "Read the source text"],
      explanation: [
        "C1 تحتوي على Apple؛ لن نغير محتواها.",
        "C1 contains Apple; its contents remain unchanged.",
      ],
      calculation: "Apple",
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["حدد عدد الحروف", "Set the character count"],
      explanation: [
        "المعامل الثاني هو 3: نحتاج أول ثلاثة حروف.",
        "The second argument is 3: take the first three characters.",
      ],
      calculation: "count = 3",
      active: [],
      matched: [],
      skipped: [],
    },
    {
      title: ["خذ أول حرفين", "Take the first two characters"],
      explanation: ["نبدأ بـ A ثم p.", "Start with A, then p."],
      calculation: "A → Ap",
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["خذ الحرف الثالث وتوقف", "Take the third character and stop"],
      explanation: [
        "نضيف p الثانية فتصبح App، ولا نأخذ l أو e.",
        "Add the second p to form App; do not take l or e.",
      ],
      calculation: "Ap → App",
      active: ["C1"],
      matched: [],
      skipped: [],
    },
    {
      title: ["النتيجة نص جديد", "The result is new text"],
      explanation: [
        "تظهر App في D1 وتبقى Apple كما هي في C1.",
        "D1 shows App while C1 still contains Apple.",
      ],
      calculation: "App",
      active: [],
      matched: ["C1"],
      skipped: [],
    },
  ],
};
export default lesson;
