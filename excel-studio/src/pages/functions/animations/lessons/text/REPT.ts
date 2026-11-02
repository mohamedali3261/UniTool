import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "REPT",
  formula: "=REPT(C2,2)",
  result: "PearPear",
  goal: [
    "كرر النص عددًا محددًا من المرات.",
    "Repeat text a specified number of times.",
  ],
  tip: [
    "REPT لا تضيف فواصل تلقائيًا. العدد 0 يعطي نصًا فارغًا؛ استخدم أعدادًا صغيرة لتجنب نص ضخم.",
    "REPT inserts no automatic separator. Zero repetitions gives empty text; use small counts to avoid huge outputs.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=REPT(",
      caption: [
        "اكتب =REPT( داخل خلية النتيجة.",
        "Type =REPT( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "C2",
      toCell: "C2",
      text: "C2",
      caption: [
        "اضغط C2 لإضافة مرجع الخلية.",
        "Click C2 to insert its reference.",
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
        "اضغط Enter لعرض الناتج في D1.",
        "Press Enter to show the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["C2 تحتوي على Pear.", "C2 contains Pear."],
      explanation: ["C2 تحتوي على Pear.", "C2 contains Pear."],
      calculation: "Pear",
    },
    {
      title: [
        "المعامل الثاني 2 هو عدد التكرارات.",
        "The second argument 2 is the repetition count.",
      ],
      explanation: [
        "المعامل الثاني 2 هو عدد التكرارات.",
        "The second argument 2 is the repetition count.",
      ],
      calculation: "count = 2",
    },
    {
      title: ["نكتب النسخة الأولى.", "Take the first copy."],
      explanation: ["نكتب النسخة الأولى.", "Take the first copy."],
      calculation: "Pear",
    },
    {
      title: [
        "نضيف النسخة الثانية مباشرة دون فاصل.",
        "Append the second copy directly without a separator.",
      ],
      explanation: [
        "نضيف النسخة الثانية مباشرة دون فاصل.",
        "Append the second copy directly without a separator.",
      ],
      calculation: "Pear + Pear",
    },
    {
      title: [
        "الناتج PearPear، وليس دمج خلايا.",
        "The result is PearPear, not merged cells.",
      ],
      explanation: [
        "الناتج PearPear، وليس دمج خلايا.",
        "The result is PearPear, not merged cells.",
      ],
      calculation: "PearPear",
    },
  ],
};
export default lesson;
