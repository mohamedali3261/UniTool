import type { FormulaLesson } from "../../types";
const lesson: FormulaLesson = {
  name: "AVERAGEIFS",
  formula: '=AVERAGEIFS(B1:B3,A1:A3,">15",C1:C3,"Apple")',
  result: 6,
  goal: [
    "احسب المتوسط عند تحقق شرطين.",
    "Average values whose rows meet two conditions.",
  ],
  tip: [
    "نطاق المتوسط يأتي أولًا، وكل الشروط يجب أن تتحقق في نفس الصف. لا توجد أرقام مطابقة يعطي #DIV/0!.",
    "The average range comes first and every condition must match the same row. No matching numbers gives #DIV/0!.",
  ],
  demo: [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط D1 لكتابة المعادلة.", "Click D1 to enter the formula."],
    },
    {
      kind: "type",
      text: "=AVERAGEIFS(",
      caption: [
        "اكتب =AVERAGEIFS( داخل خلية النتيجة.",
        "Type =AVERAGEIFS( inside the result cell.",
      ],
    },
    {
      kind: "select",
      fromCell: "B1",
      toCell: "B3",
      text: "B1:B3",
      caption: [
        "اضغط B1 واسحب إلى B3 لتحديد النطاق.",
        "Click B1 and drag to B3 to select the range.",
      ],
    },
    {
      kind: "type",
      text: ",",
      caption: ["اكتب , داخل خلية النتيجة.", "Type , inside the result cell."],
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
      text: ',">15",',
      caption: [
        'اكتب ,">15", داخل خلية النتيجة.',
        'Type ,">15", inside the result cell.',
      ],
    },
    {
      kind: "select",
      fromCell: "C1",
      toCell: "C3",
      text: "C1:C3",
      caption: [
        "اضغط C1 واسحب إلى C3 لتحديد النطاق.",
        "Click C1 and drag to C3 to select the range.",
      ],
    },
    {
      kind: "type",
      text: ',"Apple")',
      caption: [
        'اكتب ,"Apple") داخل خلية النتيجة.',
        'Type ,"Apple") inside the result cell.',
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
        "نحسب متوسط B لكن نختبر A وC.",
        "Average B while testing A and C.",
      ],
      explanation: [
        "نحسب متوسط B لكن نختبر A وC.",
        "Average B while testing A and C.",
      ],
      calculation: 'A > 15 AND C = "Apple"',
    },
    {
      title: [
        "الصف الأول لا يطابق لأن 10 ليست أكبر من 15.",
        "Row one fails because 10 is not greater than 15.",
      ],
      explanation: [
        "الصف الأول لا يطابق لأن 10 ليست أكبر من 15.",
        "Row one fails because 10 is not greater than 15.",
      ],
      calculation: "skip B1",
    },
    {
      title: [
        "الصف الثاني لا يطابق لأن Pear ليست Apple.",
        "Row two fails because Pear is not Apple.",
      ],
      explanation: [
        "الصف الثاني لا يطابق لأن Pear ليست Apple.",
        "Row two fails because Pear is not Apple.",
      ],
      calculation: "skip B2",
    },
    {
      title: [
        "الصف الثالث يحقق الشرطين؛ نأخذ B3=6.",
        "Row three meets both tests; take B3=6.",
      ],
      explanation: [
        "الصف الثالث يحقق الشرطين؛ نأخذ B3=6.",
        "Row three meets both tests; take B3=6.",
      ],
      calculation: "sum = 6; count = 1",
    },
    {
      title: [
        "متوسط قيمة واحدة 6 ÷ 1 يساوي 6.",
        "The average of one value is 6 divided by 1.",
      ],
      explanation: [
        "متوسط قيمة واحدة 6 ÷ 1 يساوي 6.",
        "The average of one value is 6 divided by 1.",
      ],
      calculation: "6 ÷ 1 = 6",
    },
  ],
};
export default lesson;
