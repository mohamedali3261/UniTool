import type { FormulaLesson } from "./types";
const lesson: FormulaLesson = {
  name: "VLOOKUP",
  formula: "=VLOOKUP(20,A1:B3,2,FALSE)",
  goal: [
    "ابحث عن 20 في أول عمود وأعد قيمة من نفس الصف.",
    "Find 20 in the first column and return a value from that row.",
  ],
  tip: [
    "FALSE تعني مطابقة تامة ولا تتطلب ترتيبًا. رقم العمود 2 محسوب داخل النطاق A:B. إذا لم نجد 20 فالنتيجة #N/A؛ وعند تكرارها تعاد أول مطابقة.",
    "FALSE means exact match; sorting is not required. Column index 2 is relative to A:B. No match returns #N/A; duplicates return the first match.",
  ],
  result: 4,
  demo: [
    {
      kind: "click",
      caption: [
        "اضغط على D1: هنا هنكتب المعادلة.",
        "Click D1: this is where we will enter the formula.",
      ],
      cell: "D1",
    },
    {
      kind: "type",
      caption: [
        "اكتب VLOOKUP وقيمة البحث 20.",
        "Type VLOOKUP and the lookup value 20.",
      ],
      text: "=VLOOKUP(20,",
    },
    {
      kind: "select",
      caption: [
        "اضغط A1 واسحب إلى B3 لتحديد جدول البحث.",
        "Press A1 and drag to B3 to select the lookup table.",
      ],
      fromCell: "A1",
      toCell: "B3",
      text: "A1:B3",
    },
    {
      kind: "type",
      caption: [
        "اكتب 2 للعمود الثاني وFALSE للمطابقة التامة.",
        "Type 2 for column two and FALSE for an exact match.",
      ],
      text: ",2,FALSE)",
    },
    {
      kind: "enter",
      caption: [
        "اضغط Enter وشوف النتيجة في D1.",
        "Press Enter and see the result in D1.",
      ],
    },
  ],
  steps: [
    {
      title: ["فكّك المعاملات", "Break down the arguments"],
      explanation: [
        "نبحث عن 20 في A1:B3. نعيد العمود الثاني من النطاق، وFALSE للمطابقة التامة.",
        "Find 20 in A1:B3. Return column 2 of this range; FALSE requests exact matching.",
      ],
      calculation: "20 | A1:B3 | 2 | FALSE",
      active: ["A1", "B1", "A2", "B2", "A3", "B3"],
      matched: [],
      skipped: [],
    },
    {
      title: ["ابحث في أول عمود فقط", "Search only the first column"],
      explanation: [
        "نبدأ A1=10؛ ليست 20، فنتخطى هذا الصف. لا نبحث داخل B.",
        "Start at A1=10. It is not 20, so skip this row. We do not search B.",
      ],
      calculation: "A1: 10 ≠ 20",
      active: ["A1"],
      matched: [],
      skipped: ["A1"],
    },
    {
      title: ["وجدنا صف المطابقة", "Find the matching row"],
      explanation: [
        "A2=20 تطابق قيمة البحث بالضبط. نثبت على الصف الثاني.",
        "A2=20 exactly matches the lookup value. Stay on row 2.",
      ],
      calculation: "A2: 20 = 20",
      active: ["A2"],
      matched: ["A2"],
      skipped: ["A1"],
    },
    {
      title: ["تحرك إلى العمود الثاني", "Move to column two"],
      explanation: [
        "العمود الأول داخل النطاق هو A، والثاني B؛ نقرأ B2 في نفس الصف.",
        "Within this range A is column 1 and B is column 2. Read B2 on the same row.",
      ],
      calculation: "A2 → B2 = 4",
      active: ["B2"],
      matched: ["A2"],
      skipped: [],
    },
    {
      title: [
        "أعد القيمة لا عنوان الخلية",
        "Return the value, not its address",
      ],
      explanation: [
        "B2 تحتوي على 4، إذن الناتج 4. لا نحتاج متابعة الصف الثالث بعد المطابقة.",
        "B2 contains 4, so return 4. No need to scan row 3 after finding the match.",
      ],
      calculation: "= 4",
      active: [],
      matched: ["A2", "B2"],
      skipped: [],
    },
  ],
};
export default lesson;
