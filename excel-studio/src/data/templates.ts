import { extraTemplates, extraTemplateData } from "./extraTemplates";
import { newBook, newSheet } from "../core/workbook";
import { address } from "../core/address";
import type { Workbook, Lang } from "../core/types";
export const templates = [
  {
    id: "sales",
    icon: "↗",
    ar: "متابعة المبيعات",
    en: "Sales tracker",
    desc: "طلباتك وأرباحك في مكان واحد",
    enDesc: "Orders, revenue and profit in one place",
    tag: "الأكثر استخدامًا",
    enTag: "POPULAR",
    theme: "emerald",
  },
  {
    id: "budget",
    icon: "◈",
    ar: "ميزانية شهرية",
    en: "Monthly budget",
    desc: "اعرف فلوسك بتروح فين",
    enDesc: "Know where your money goes",
    tag: "فلوسك تحت السيطرة",
    enTag: "PERSONAL FINANCE",
    theme: "indigo",
  },
  {
    id: "invoice",
    icon: "▤",
    ar: "فاتورة احترافية",
    en: "Professional invoice",
    desc: "حساب تلقائي للسعر والضريبة",
    enDesc: "Automatic totals and tax calculations",
    tag: "جاهزة للتصدير",
    enTag: "BUSINESS",
    theme: "ocean",
  },
  {
    id: "inventory",
    icon: "▦",
    ar: "إدارة المخزون",
    en: "Inventory manager",
    desc: "راقب الرصيد وحد إعادة الطلب",
    enDesc: "Track stock levels and reorder alerts",
    tag: "تجارة أذكى",
    enTag: "OPERATIONS",
    theme: "amber",
  },
  {
    id: "grades",
    icon: "✦",
    ar: "نتائج الطلاب",
    en: "Student grades",
    desc: "متوسطات وتقديرات بدون تعقيد",
    enDesc: "Simple averages and pass/fail results",
    tag: "للمدرسين",
    enTag: "EDUCATION",
    theme: "rose",
  },
  ...extraTemplates,
  {
    id: "blank",
    icon: "+",
    ar: "ابدأ من الصفر",
    en: "Blank canvas",
    desc: "جدول على مزاجك، خلية بخليّة",
    enDesc: "Build your own table, cell by cell",
    tag: "مساحة حرة",
    enTag: "MAKE IT YOURS",
    theme: "slate",
  },
];
export function templateBook(id: string, lang: Lang = "ar"): Workbook {
  const t = templates.find((t) => t.id === id) || templates[0],
    b = newBook(lang === "ar" ? t.ar : t.en),
    s = newSheet(lang === "ar" ? "البيانات" : "Data");
  b.sheets = [s];
  b.active = s.id;
  s.theme = t.theme;
  s.cols = 6;
  s.rows = 18;
  let data: (string | number)[][] = [];
  const ar = lang === "ar";
  if (id === "sales") {
    data = [
      ar
        ? ["المنتج", "الكمية", "سعر البيع", "التكلفة", "الإيراد", "الربح"]
        : ["Product", "Units", "Price", "Cost", "Revenue", "Profit"],
      [ar ? "دفتر ملاحظات" : "Notebook", 24, 85, 45, "=B2*C2", "=E2-B2*D2"],
      [ar ? "قلم حبر" : "Ink pen", 60, 25, 12, "=B3*C3", "=E3-B3*D3"],
      [ar ? "حقيبة" : "Bag", 12, 350, 220, "=B4*C4", "=E4-B4*D4"],
      [ar ? "أجندة" : "Planner", 18, 160, 95, "=B5*C5", "=E5-B5*D5"],
      [
        ar ? "الإجمالي" : "Total",
        "=SUM(B2:B5)",
        "",
        "",
        "=SUM(E2:E5)",
        "=SUM(F2:F5)",
      ],
    ];
  } else if (id === "budget") {
    data = [
      ar
        ? ["البند", "المخطط", "الفعلي", "الفرق", "الحالة"]
        : ["Category", "Budget", "Actual", "Remaining", "Status"],
      [ar ? "السكن" : "Rent", 6000, 6000, "=B2-C2", '=IF(D2>=0,"OK","Over")'],
      [ar ? "الطعام" : "Food", 3500, 3100, "=B3-C3", '=IF(D3>=0,"OK","Over")'],
      [
        ar ? "المواصلات" : "Transport",
        1500,
        1750,
        "=B4-C4",
        '=IF(D4>=0,"OK","Over")',
      ],
      [ar ? "ترفيه" : "Leisure", 1000, 650, "=B5-C5", '=IF(D5>=0,"OK","Over")'],
      [ar ? "الإجمالي" : "Total", "=SUM(B2:B5)", "=SUM(C2:C5)", "=B6-C6", ""],
    ];
  } else if (id === "invoice") {
    data = [
      ar
        ? [
            "الوصف",
            "الكمية",
            "السعر",
            "الإجمالي",
            "نسبة الضريبة",
            "بعد الضريبة",
          ]
        : ["Description", "Quantity", "Price", "Subtotal", "Tax rate", "Total"],
      [
        ar ? "تصميم هوية" : "Brand design",
        1,
        2500,
        "=B2*C2",
        "14%",
        "=D2*(1+E2)",
      ],
      [
        ar ? "تصميم منشور" : "Social post",
        5,
        200,
        "=B3*C3",
        "14%",
        "=D3*(1+E3)",
      ],
      [ar ? "الإجمالي" : "Total", "", "", "=SUM(D2:D3)", "", "=SUM(F2:F3)"],
    ];
  } else if (id === "inventory") {
    data = [
      ar
        ? ["الصنف", "الوارد", "المباع", "المتاح", "حد التنبيه", "الحالة"]
        : ["Item", "Received", "Sold", "Available", "Reorder at", "Status"],
      [ar ? "قلم" : "Pen", 100, 78, "=B2-C2", 25, '=IF(D2<E2,"Reorder","OK")'],
      [
        ar ? "دفتر" : "Notebook",
        60,
        15,
        "=B3-C3",
        10,
        '=IF(D3<E3,"Reorder","OK")',
      ],
      [ar ? "حقيبة" : "Bag", 30, 24, "=B4-C4", 8, '=IF(D4<E4,"Reorder","OK")'],
    ];
  } else if (id === "grades") {
    data = [
      ar
        ? ["الطالب", "اختبار 1", "اختبار 2", "اختبار 3", "المتوسط", "النتيجة"]
        : ["Student", "Test 1", "Test 2", "Test 3", "Average", "Result"],
      [
        ar ? "سارة" : "Sara",
        85,
        92,
        88,
        "=ROUND(AVERAGE(B2:D2),1)",
        '=IF(E2>=50,"Pass","Retry")',
      ],
      [
        ar ? "علي" : "Ali",
        65,
        72,
        81,
        "=ROUND(AVERAGE(B3:D3),1)",
        '=IF(E3>=50,"Pass","Retry")',
      ],
      [
        ar ? "نور" : "Nour",
        45,
        48,
        50,
        "=ROUND(AVERAGE(B4:D4),1)",
        '=IF(E4>=50,"Pass","Retry")',
      ],
    ];
  }
  if (extraTemplates.some((t) => t.id === id))
    data = extraTemplateData(id, lang);
  if (id === "blank") {
    s.cols = 8;
    s.header = false;
  }
  for (let r = 0; r < data.length; r++)
    for (let c = 0; c < data[r].length; c++)
      s.cells[address(r, c)] = {
        raw: String(data[r][c]),
        bold: r === 0 || String(data[r][0]) === (ar ? "الإجمالي" : "Total"),
        ...(id === "invoice" && c === 4 && r > 0
          ? { format: "percent" as const }
          : {}),
      };
  if (["marketing", "projects"].includes(id))
    for (let r = 1; r < data.length; r++)
      s.cells[address(r, 4)].format = "percent";
  if (id === "projects") {
    s.validation = [
      { column: 4, type: "number", min: 0, max: 1, required: false },
    ];
    s.conditional = [
      {
        id: "complete",
        column: 4,
        op: "gt",
        value: "0.99",
        fill: "#e0f1e4",
        color: "#28653b",
      },
    ];
  }
  if (id === "subscriptions")
    s.validation = [
      {
        column: 4,
        type: "list",
        options: ["Active", "Canceled"],
        required: true,
      },
    ];
  if (id === "travel")
    s.validation = [{ column: 1, type: "date", required: false }];
  return b;
}
