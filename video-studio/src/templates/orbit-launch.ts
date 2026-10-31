import type { StudioTemplate } from "./types";
import {
  buildEditable,
  label as t,
  shape as s,
  type Element,
} from "./editable/build";
export const orbitLaunch: StudioTemplate = {
  id: "orbit-launch",
  name: "ORBIT — انطلاقة مختلفة",
  ratio: "9:16",
  colors: ["#171329", "#e5bf7b"],
  description:
    "٣٠ ثانية • إطلاق منتج بأسلوب فضائي • الخلفيات والكروت والأزرار والنصوص كلها طبقات مستقلة",
  scenes: [
    { text: "ابدأ من مدار مختلف", caption: "إطلاق العلامة", seconds: 6 },
    { text: "تصميم يستحق الانتباه", caption: "بطاقة المنتج", seconds: 6 },
    { text: "تفاصيل أكبر. مجهود أقل.", caption: "المميزات", seconds: 6 },
    { text: "الفرق في الأثر", caption: "الأرقام", seconds: 6 },
    { text: "جاهز لانطلاقتك؟", caption: "دعوة للتجربة", seconds: 6 },
  ],
};
const ink = "#f5efe4",
  gold = "#e5bf7b",
  muted = "#b5a8d2";
const base = (i: number): Element[] => [
  s("خلفية المشهد", 50, 50, 960, 1707, "#171329"),
  s("الهالة البنفسجية", 83, 25, 680, 680, "#332552", 340),
  s("مدار ذهبي", 50, 49, 790, 790, "#171329", 395, {
    background: undefined,
    box: {
      width: 790,
      height: 790,
      radius: 395,
      borderColor: gold,
      borderWidth: 2,
    },
  }),
  t("اسم العلامة", "O R B I T", 25, 8, 28, gold, { font: "mono" }),
  t("رقم المشهد", `0${i + 1} / 05`, 80, 8, 22, muted, { font: "mono" }),
  s("خط التذييل", 50, 91, 800, 2, "#57466e"),
  t("حسابك", "@yourbrand  ·  MAKE YOUR NEXT MOVE", 50, 94, 19, muted, {
    font: "mono",
  }),
];
export function orbitElements(): Element[][] {
  return [
    [
      ...base(0),
      t("العنوان", "ابدأ من\nمدار مختلف", 50, 33, 86, ink),
      s("لوحة الشعار", 50, 63, 430, 360, "#403058", 48, { rotation: 352 }),
      t("رمز العلامة", "O", 50, 61, 180, gold, { font: "serif" }),
      t("وصف الإطلاق", "فكرتك تستحق انطلاقة استثنائية", 50, 80, 32, muted),
    ],
    [
      ...base(1),
      t("عنوان المنتج", "تصميم يستحق\nالانتباه", 50, 22, 66, ink),
      s("بطاقة المنتج", 50, 55, 690, 660, "#292139", 40),
      s("واجهة المنتج", 50, 51, 370, 350, "#e5bf7b", 36),
      t("اسم المنتج", "ORBIT\nPRO", 50, 48, 64, "#21182f", { font: "mono" }),
      t("إصدار المنتج", "YOUR PRODUCT / 2026", 50, 69, 25, muted, {
        font: "mono",
      }),
      t("وصف المنتج", "أقل تعقيدًا. أكثر تأثيرًا.", 50, 81, 36, ink),
    ],
    [
      ...base(2),
      t("عنوان المميزات", "تفاصيل أكبر.\nمجهود أقل.", 50, 23, 66, ink),
      ...[0, 1, 2].flatMap((i) => [
        s(`كارت ميزة ${i + 1}`, 50, 46 + i * 15, 760, 190, "#292139", 26),
        t(
          `عنوان ميزة ${i + 1}`,
          [
            "01   سرعة من أول لمسة",
            "02   كل التفاصيل في مكانها",
            "03   مرونة تناسب طريقتك",
          ][i],
          50,
          46 + i * 15,
          31,
          ink,
        ),
      ]),
    ],
    [
      ...base(3),
      t("عنوان الأثر", "الفرق في الأثر", 50, 23, 66, ink),
      t("الرقم الرئيسي", "3×", 50, 43, 172, gold, { font: "serif" }),
      t("وصف الرقم", "مساحة أكبر للإبداع", 50, 57, 36, ink),
      s("بطاقة الإحصائية", 50, 73, 700, 240, "#332552", 30),
      t("إحصائية ثانية", "100%  YOUR STYLE", 50, 72, 40, gold, {
        font: "mono",
      }),
      t(
        "ملاحظة الأرقام",
        "أرقام توضيحية — عدّلها لنتائجك الحقيقية",
        50,
        84,
        22,
        muted,
      ),
    ],
    [
      ...base(4),
      t("العنوان الختامي", "جاهز\nلانطلاقتك؟", 50, 34, 88, ink),
      s("خلفية زر الدعوة", 50, 65, 700, 150, gold, 75),
      t("نص زر الدعوة", "ابدأ تجربتك الآن  ↗", 50, 65, 40, "#21182f"),
      t("رابط الموقع", "YOURBRAND.COM", 50, 78, 29, muted, { font: "mono" }),
    ],
  ];
}
export const buildOrbitLaunch = () =>
  buildEditable(orbitLaunch, orbitElements());
