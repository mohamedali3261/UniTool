import { calculator } from "../../../core/calculate";
import { exampleBook } from "../catalog";
import {
  exampleRows,
  type FormulaLesson,
  type DemoAction,
  type Bilingual,
} from "./types";
export type ExampleRows = readonly (readonly (string | number)[])[];
export function lessonBook(rows: ExampleRows = exampleRows) {
  const book = exampleBook();
  book.sheets[0].cells = {};
  rows.forEach((row, r) =>
    row.forEach((value, c) => {
      book.sheets[0].cells[String.fromCharCode(65 + c) + (r + 1)] = {
        raw: String(value),
      };
    }),
  );
  return book;
}
export function lessonResult(lesson: FormulaLesson) {
  const book = lessonBook(lesson.rows);
  book.sheets[0].cells.D1 = { raw: lesson.formula };
  const result = calculator(book).cell(book.active, "D1");
  return result.error || result.value;
}
export function formulaActions(formula: string): DemoAction[] {
  const actions: DemoAction[] = [
    {
      kind: "click",
      cell: "D1",
      caption: ["اضغط على D1 لكتابة النتيجة", "Click D1 to enter the result"],
    },
  ];
  // Quoted strings are consumed as a whole, so references inside text are never dragged.
  const pattern = /"(?:[^"]|"")*"|\b[A-C][1-3](?::[A-C][1-3])?\b/g;
  let offset = 0,
    pending = "";
  const flush = () => {
    if (pending)
      actions.push({
        kind: "type",
        text: pending,
        caption: [
          "اكتب هذا الجزء من المعادلة",
          "Type this part of the formula",
        ],
      });
    pending = "";
  };
  for (const match of formula.matchAll(pattern)) {
    pending += formula.slice(offset, match.index);
    if (match[0].startsWith('"')) pending += match[0];
    else {
      flush();
      const [from, to = from] = match[0].split(":");
      actions.push({
        kind: "select",
        fromCell: from,
        toCell: to,
        text: match[0],
        caption: [
          `حدد ${match[0]} من الجدول`,
          `Select ${match[0]} in the sheet`,
        ],
      });
    }
    offset = match.index! + match[0].length;
  }
  pending += formula.slice(offset);
  flush();
  actions.push({
    kind: "enter",
    caption: [
      "اضغط Enter لحساب النتيجة",
      "Press Enter to calculate the result",
    ],
  });
  return actions;
}
const sales: ExampleRows = [
  [120, 2, "Pen"],
  [80, 4, "Book"],
  [200, 3, "Pen"],
];
const scores: ExampleRows = [
  [45, 1, "Ali"],
  [85, 2, "Mona"],
  [70, 3, "Omar"],
];
type Scenario = [Bilingual, string, ExampleRows];
const variants: Record<string, Scenario[]> = {
  SUM: [
    [["إجمالي المبيعات", "Total sales"], "=SUM(A1:A3)", sales],
    [["جمع خليتين فقط", "Add just two cells"], "=SUM(A1,A3)", scores],
  ],
  AVERAGE: [
    [["متوسط الدرجات", "Average score"], "=AVERAGE(A1:A3)", scores],
    [["متوسط المبيعات", "Average sales"], "=AVERAGE(A1:A3)", sales],
  ],
  IF: [
    [
      ["درجة أقل من النجاح", "A failing score"],
      '=IF(A1>=50,"Pass","Retry")',
      scores,
    ],
    [["درجة ناجحة", "A passing score"], '=IF(A2>=50,"Pass","Retry")', scores],
  ],
  COUNTIF: [
    [
      ["كم درجة ناجحة؟", "How many passing scores?"],
      '=COUNTIF(A1:A3,">=50")',
      scores,
    ],
    [
      ["عدد أصناف الأقلام", "Count pen entries"],
      '=COUNTIF(C1:C3,"Pen")',
      sales,
    ],
  ],
  SUMIF: [
    [["مبيعات الأقلام", "Pen sales"], '=SUMIF(C1:C3,"Pen",A1:A3)', sales],
    [
      ["اجمع درجات الناجحين", "Sum passing scores"],
      '=SUMIF(A1:A3,">=50",A1:A3)',
      scores,
    ],
  ],
  VLOOKUP: [
    [
      ["ابحث عن كمية بيع 80", "Look up quantity for 80"],
      "=VLOOKUP(80,A1:C3,2,FALSE)",
      sales,
    ],
    [
      ["ابحث عن اسم صاحب درجة 70", "Look up the name for score 70"],
      "=VLOOKUP(70,A1:C3,3,FALSE)",
      scores,
    ],
  ],
  ROUND: [
    [["تقريب سعر الوحدة", "Round unit price"], "=ROUND(A1/7,2)", sales],
    [["تقريب لعدد صحيح", "Round to a whole number"], "=ROUND(A2/3,0)", scores],
  ],
  MAX: [
    [["أعلى درجة", "Highest score"], "=MAX(A1:A3)", scores],
    [["أكبر بيع", "Largest sale"], "=MAX(A1:A3)", sales],
  ],
  MIN: [
    [["أقل درجة", "Lowest score"], "=MIN(A1:A3)", scores],
    [["أقل بيع", "Smallest sale"], "=MIN(A1:A3)", sales],
  ],
  COUNT: [
    [
      ["عدّ الأرقام دون الأسماء", "Count numbers, not names"],
      "=COUNT(A1:C3)",
      scores,
    ],
    [["عدّ خلايا المبيعات", "Count sale cells"], "=COUNT(A1:A3)", sales],
  ],
  SUMPRODUCT: [
    [
      ["إجمالي السعر × الكمية", "Total price times quantity"],
      "=SUMPRODUCT(A1:A3,B1:B3)",
      sales,
    ],
    [
      ["مجموع مرجّح للدرجات", "Weighted score total"],
      "=SUMPRODUCT(A1:A3,B1:B3)",
      scores,
    ],
  ],
  CONCATENATE: [
    [
      ["اسم الطالب ودرجته", "Student and score"],
      '=CONCATENATE(C1," - ",A1)',
      scores,
    ],
    [
      ["اسم المنتج وسعره", "Product and price"],
      '=CONCATENATE(C2," - ",A2)',
      sales,
    ],
  ],
};
export function lessonExamples(base: FormulaLesson): FormulaLesson[] {
  return [
    base,
    ...(variants[base.name] || []).map(([title, formula, rows]) => {
      const lesson: FormulaLesson = {
        ...base,
        title,
        goal: title,
        formula,
        rows,
        demo: formulaActions(formula),
        steps: [],
        tip: [
          "غيّر بيانات التجربة أو المعادلة لمقارنة النتيجة.",
          "Change the playground formula to compare results.",
        ],
      };
      const result = lessonResult(lesson);
      lesson.result = result ?? "";
      lesson.steps = [
        {
          title: [
            "البيانات ثم المعادلة ثم النتيجة",
            "Data, formula, then result",
          ],
          explanation: [
            "تُحسب هذه النتيجة من بيانات الجدول الظاهرة بنفس محرّك التجربة. راجع المراجع والشروط أثناء التحديد.",
            "This result is calculated from the visible sheet using the playground engine. Follow the references and conditions while selecting.",
          ],
          calculation: `${formula} → ${String(result)}`,
        },
      ];
      return lesson;
    }),
  ];
}
