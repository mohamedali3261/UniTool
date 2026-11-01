import type { Lang } from "../core/types";
export const extraTemplates = [
  {
    id: "payroll",
    icon: "♙",
    ar: "رواتب الفريق",
    en: "Team payroll",
    desc: "رواتب وبدلات وخصومات بصافي تلقائي",
    enDesc: "Salaries, allowances and deductions with automatic net pay",
    tag: "الموارد البشرية",
    enTag: "PEOPLE",
    theme: "ocean",
  },
  {
    id: "marketing",
    icon: "◎",
    ar: "عائد الحملات",
    en: "Campaign ROI",
    desc: "قارن الإنفاق بالإيراد وتكلفة اكتساب العميل",
    enDesc: "Compare spend, revenue and customer acquisition costs",
    tag: "التسويق",
    enTag: "MARKETING",
    theme: "rose",
  },
  {
    id: "projects",
    icon: "☑",
    ar: "تقدم المشروعات",
    en: "Project progress",
    desc: "ساعات مخططة وفعلية وإنجاز كل مهمة",
    enDesc: "Planned hours, actual time and task completion",
    tag: "إدارة الوقت",
    enTag: "PROJECTS",
    theme: "indigo",
  },
  {
    id: "travel",
    icon: "✈",
    ar: "مصروفات السفر",
    en: "Travel expenses",
    desc: "تحويل العملات ومقارنة مصروفات رحلتك",
    enDesc: "Convert currencies and compare trip expenses",
    tag: "رحلات منظمة",
    enTag: "TRAVEL",
    theme: "amber",
  },
  {
    id: "subscriptions",
    icon: "⟳",
    ar: "الاشتراكات المتكررة",
    en: "Recurring subscriptions",
    desc: "التكلفة السنوية والتوفير من إيقاف الاشتراكات",
    enDesc: "Annual cost and savings from canceled subscriptions",
    tag: "توفير أذكى",
    enTag: "RECURRING",
    theme: "emerald",
  },
];
export function extraTemplateData(
  id: string,
  lang: Lang,
): (string | number)[][] {
  const ar = lang === "ar";
  if (id === "payroll")
    return [
      ar
        ? ["الموظف", "القسم", "الراتب", "البدلات", "الخصومات", "الصافي"]
        : [
            "Employee",
            "Department",
            "Salary",
            "Allowances",
            "Deductions",
            "Net pay",
          ],
      [
        ar ? "سارة" : "Sara",
        ar ? "تصميم" : "Design",
        12000,
        1500,
        400,
        "=C2+D2-E2",
      ],
      [
        ar ? "علي" : "Ali",
        ar ? "تطوير" : "Engineering",
        18000,
        2000,
        800,
        "=C3+D3-E3",
      ],
      [
        ar ? "نور" : "Nour",
        ar ? "تصميم" : "Design",
        14000,
        1000,
        0,
        "=C4+D4-E4",
      ],
      [
        ar ? "مريم" : "Mariam",
        ar ? "تسويق" : "Marketing",
        11000,
        1200,
        300,
        "=C5+D5-E5",
      ],
      [
        ar ? "الإجمالي" : "Total",
        "",
        "=SUM(C2:C5)",
        "=SUM(D2:D5)",
        "=SUM(E2:E5)",
        "=SUM(F2:F5)",
      ],
    ];
  if (id === "marketing")
    return [
      ar
        ? [
            "الحملة",
            "الإنفاق",
            "عملاء جدد",
            "الإيراد",
            "عائد الاستثمار",
            "تكلفة العميل",
          ]
        : [
            "Campaign",
            "Spend",
            "New customers",
            "Revenue",
            "ROI",
            "Cost per customer",
          ],
      [
        ar ? "بحث" : "Search",
        3000,
        45,
        12000,
        "=IFERROR((D2-B2)/B2,0)",
        "=IFERROR(B2/C2,0)",
      ],
      [
        ar ? "منصات اجتماعية" : "Social",
        2200,
        38,
        8500,
        "=IFERROR((D3-B3)/B3,0)",
        "=IFERROR(B3/C3,0)",
      ],
      [
        ar ? "بريد إلكتروني" : "Email",
        500,
        20,
        4200,
        "=IFERROR((D4-B4)/B4,0)",
        "=IFERROR(B4/C4,0)",
      ],
      [
        ar ? "شراكات" : "Partners",
        1500,
        15,
        3200,
        "=IFERROR((D5-B5)/B5,0)",
        "=IFERROR(B5/C5,0)",
      ],
      [
        ar ? "الإجمالي" : "Total",
        "=SUM(B2:B5)",
        "=SUM(C2:C5)",
        "=SUM(D2:D5)",
        "=IFERROR((D6-B6)/B6,0)",
        "=IFERROR(B6/C6,0)",
      ],
    ];
  if (id === "projects")
    return [
      ar
        ? [
            "المهمة",
            "المسؤول",
            "الساعات المخططة",
            "الساعات الفعلية",
            "الإنجاز",
            "الساعات المتبقية",
          ]
        : [
            "Task",
            "Owner",
            "Planned hours",
            "Actual hours",
            "Completion",
            "Hours remaining",
          ],
      [
        ar ? "بحث المستخدمين" : "User research",
        ar ? "سارة" : "Sara",
        20,
        18,
        "100%",
        "=MAX(0,C2*(1-E2))",
      ],
      [
        ar ? "تصميم الواجهات" : "UI design",
        ar ? "نور" : "Nour",
        40,
        24,
        "60%",
        "=MAX(0,C3*(1-E3))",
      ],
      [
        ar ? "التطوير" : "Development",
        ar ? "علي" : "Ali",
        80,
        20,
        "25%",
        "=MAX(0,C4*(1-E4))",
      ],
      [
        ar ? "الاختبار" : "Testing",
        ar ? "مريم" : "Mariam",
        24,
        0,
        "0%",
        "=MAX(0,C5*(1-E5))",
      ],
      [
        ar ? "الإجمالي" : "Total",
        "",
        "=SUM(C2:C5)",
        "=SUM(D2:D5)",
        "=IFERROR(SUMPRODUCT(C2:C5,E2:E5)/C6,0)",
        "=SUM(F2:F5)",
      ],
    ];
  if (id === "travel")
    return [
      ar
        ? [
            "البند",
            "التاريخ",
            "العملة",
            "المبلغ",
            "سعر التحويل إلى جنيه",
            "الإجمالي بالجنيه",
          ]
        : ["Expense", "Date", "Currency", "Amount", "Rate to EGP", "Total EGP"],
      [ar ? "فندق" : "Hotel", "2026-11-01", "USD", 150, 50, "=D2*E2"],
      [ar ? "مواصلات" : "Transport", "2026-11-02", "EGP", 450, 1, "=D3*E3"],
      [ar ? "وجبات" : "Meals", "2026-11-02", "EUR", 35, 55, "=D4*E4"],
      [ar ? "جولة" : "Tour", "2026-11-03", "USD", 40, 50, "=D5*E5"],
      [ar ? "الإجمالي" : "Total", "", "", "", "", "=SUM(F2:F5)"],
    ];
  if (id === "subscriptions")
    return [
      ar
        ? [
            "الخدمة",
            "الدورية",
            "سعر الدورة",
            "دورات بالسنة",
            "الحالة",
            "التكلفة السنوية",
          ]
        : [
            "Service",
            "Cycle",
            "Cycle price",
            "Cycles per year",
            "Status",
            "Annual cost",
          ],
      [
        ar ? "تخزين سحابي" : "Cloud storage",
        ar ? "شهري" : "Monthly",
        100,
        12,
        "Active",
        '=IF(E2="Active",C2*D2,0)',
      ],
      [
        ar ? "موسيقى" : "Music",
        ar ? "شهري" : "Monthly",
        70,
        12,
        "Active",
        '=IF(E3="Active",C3*D3,0)',
      ],
      [
        ar ? "نطاق الموقع" : "Domain",
        ar ? "سنوي" : "Annual",
        800,
        1,
        "Active",
        '=IF(E4="Active",C4*D4,0)',
      ],
      [
        ar ? "تطبيق مهام" : "Task app",
        ar ? "شهري" : "Monthly",
        120,
        12,
        "Canceled",
        '=IF(E5="Active",C5*D5,0)',
      ],
      [ar ? "الإجمالي" : "Total", "", "", "", "", "=SUM(F2:F5)"],
    ];
  return [];
}
