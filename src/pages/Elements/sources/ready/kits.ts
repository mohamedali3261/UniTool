import { frame } from "../../../../../video-studio/src/animation/layerFrames";
import type { LibraryElement } from "../../types";
import type { TextLayer } from "../../../../../video-studio/src/types";
import { panel, label, palette } from "./primitives";
const names = [
  "بطاقة اسم متحدث",
  "عرض سعر وخصم",
  "استطلاع رأي",
  "إشعار تطبيق",
  "نافذة Terminal",
  "بطاقة إحصائيات",
  "شريط إنجاز",
  "نافذة موقع",
  "بطاقة اقتباس",
  "دعوة للاشتراك",
  "قبل وبعد",
  "قائمة إنجاز",
  "بث مباشر LIVE",
  "فاصل فصل",
  "تعليق توضيحي",
  "بطاقة حساب",
  "خطوات التنفيذ",
  "حلقة بودكاست",
  "شريط تواصل",
  "كوبون متجر",
];
export const readyKits: LibraryElement[] = names.map((name, i) => {
  const accent = palette[i % 5],
    prefix = `kit-${i}`,
    p = (
      id: string,
      x: number,
      y: number,
      w: number,
      h: number,
      fill?: string,
      r = 18,
    ) => panel(`${prefix}-${id}`, x, y, w, h, fill, r),
    t = (
      id: string,
      text: string,
      x: number,
      y: number,
      size = 32,
      color = "#edf5ef",
    ) => label(`${prefix}-${id}`, text, x, y, size, color);
  let layers: TextLayer[] = [
    p("card", 50, 50, 760, 310, "#12292c"),
    p("accent", 50, 25, 680, 5, accent, 2),
  ];
  switch (i) {
    case 0:
      layers = [
        p("bar", 50, 72, 740, 140),
        p("line", 83, 72, 8, 140, accent),
        t("name", "اسم المتحدث", 55, 68, 46),
        t("role", "المسمّى الوظيفي · شركتك", 55, 78, 23, accent),
      ];
      break;
    case 1:
      layers.push(
        t("title", "عرض لفترة محدودة", 50, 36),
        t("price", "٢٩٩ ج.م", 40, 53, 68, accent),
        p("badge", 73, 53, 160, 70, accent),
        t("discount", "−30%", 73, 53, 32, "#102222"),
        t("cta", "اطلب الآن ↗", 50, 70, 28),
      );
      break;
    case 2:
      layers.push(
        t("q", "تختار أنهي فكرة؟", 50, 35),
        p("a", 32, 56, 290, 90, "#31524d"),
        p("b", 68, 56, 290, 90, "#263954"),
        t("a-text", "الفكرة الأولى", 32, 56, 25),
        t("b-text", "الفكرة التانية", 68, 56, 25),
      );
      break;
    case 3:
      layers = [
        p("card", 50, 30, 760, 130),
        p("icon", 81, 30, 75, 75, accent),
        t("title", "رسالة جديدة", 48, 26, 34),
        t("message", "مشروعك جاهز للعرض ✦", 48, 36, 24, accent),
      ];
      break;
    case 4:
      layers.push(
        p("chrome", 50, 29, 760, 40, "#2a4247"),
        t("file", "~/project — Terminal", 50, 29, 18, accent),
        t("cmd", "$ npm run build", 50, 46, 35),
        t("result", "✓ Ready in 240ms", 50, 62, 27, accent),
      );
      break;
    case 5:
      layers.push(
        t("metric", "إجمالي المشاهدات", 50, 35, 26),
        t("value", "128,400", 50, 51, 62, accent),
        t("delta", "↑ 24.8% هذا الشهر", 50, 69, 25),
      );
      break;
    case 6:
      layers.push(
        t("title", "تحميل مشروعك", 50, 37),
        p("track", 50, 55, 600, 24, "#344a4a"),
        p("progress", 41, 55, 430, 24, accent),
        t("pct", "72% اكتمل", 50, 69, 25, accent),
      );
      break;
    case 7:
      layers.push(
        p("address", 50, 30, 660, 35, "#304347"),
        t("url", "yourbrand.com", 50, 30, 17, accent),
        t("hero", "موقعك. بشخصيتك.", 50, 48, 42),
        p("button", 50, 65, 220, 52, accent),
        t("action", "اكتشف أكتر", 50, 65, 23, "#112522"),
      );
      break;
    case 8:
      layers.push(
        t("mark", "“", 77, 39, 95, accent),
        t("quote", "كل فكرة عظيمة\nبدأت بخطوة صغيرة.", 47, 49, 38),
        t("author", "— اسم صاحب الاقتباس", 50, 72, 23, accent),
      );
      break;
    case 9:
      layers.push(
        t("title", "خليك جزء من الحكاية", 50, 38, 40),
        p("button", 50, 57, 360, 80, accent),
        t("cta", "اشترك الآن  ＋", 50, 57, 36, "#102522"),
        t("note", "فكرة جديدة كل أسبوع", 50, 73, 23),
      );
      break;
    case 10:
      layers = [
        p("before", 29, 50, 350, 300, "#303d49"),
        p("after", 71, 50, 350, 300, "#23584b"),
        t("b", "قبل", 29, 33, 36),
        t("a", "بعد", 71, 33, 36, accent),
        t("left", "التصميم القديم", 29, 58, 24),
        t("right", "النسخة الجديدة ✦", 71, 58, 24),
      ];
      break;
    case 11:
      layers.push(
        t("title", "جاهز للنشر؟", 50, 34, 40),
        ...["✓ مراجعة المحتوى", "✓ ضبط الألوان", "✓ تصدير الفيديو"].map(
          (s, j) =>
            t(`row-${j}`, s, 50, 47 + j * 11, 26, j === 2 ? accent : undefined),
        ),
      );
      break;
    case 12:
      layers = [
        p("pill", 50, 50, 450, 110, "#442d38"),
        p("dot", 69, 50, 30, 30, "#ff667d", 15),
        t("live", "LIVE  ·  مباشر الآن", 47, 50, 34),
      ];
      break;
    case 13:
      layers = [
        p("line", 50, 64, 650, 4, accent),
        t("num", "0 1", 50, 34, 85, accent),
        t("chapter", "الفصل الأول", 50, 54, 44),
        t("desc", "من الفكرة إلى التنفيذ", 50, 74, 27),
      ];
      break;
    case 14:
      layers = [
        p("note", 58, 43, 500, 150),
        t("title", "ركز في التفصيلة دي", 58, 39, 33, accent),
        t("sub", "قابلة للتعديل والتحريك", 58, 51, 23),
        p("pointer", 29, 62, 6, 150, accent, 0),
      ];
      break;
    case 15:
      layers.push(
        p("avatar", 77, 49, 120, 120, accent, 60),
        t("initial", "U", 77, 49, 62, "#123333"),
        t("handle", "@yourname", 43, 43, 38),
        t("bio", "صانع محتوى · أفكار مختلفة", 43, 58, 24, accent),
      );
      break;
    case 16:
      layers = [
        p("track", 50, 50, 650, 5, "#46645b"),
        ...[0, 1, 2].flatMap((j) => [
          p(`step-${j}`, 24 + j * 26, 50, 70, 70, accent, 35),
          t(`n-${j}`, String(j + 1), 24 + j * 26, 50, 30, "#102222"),
          t(`caption-${j}`, ["خطّط", "صمّم", "انشر"][j], 24 + j * 26, 67, 26),
        ]),
      ];
      break;
    case 17:
      layers.push(
        t("tag", "PODCAST / EP. 024", 50, 34, 22, accent),
        t("title", "حوار يستحق وقتك", 50, 49, 46),
        t("guest", "ضيف الحلقة: اسم الضيف", 50, 67, 26),
      );
      break;
    case 18:
      layers = [
        p("strip", 50, 74, 800, 90),
        ...["@yourbrand", "yourbrand.com", "تابعنا للمزيد"].map((s, j) =>
          t(`social-${j}`, s, 23 + j * 27, 74, 23, palette[j]),
        ),
      ];
      break;
    case 19:
      layers.push(
        t("heading", "خصم خاص ليك", 50, 35, 40),
        p("code", 50, 54, 420, 75, "#2e4c48"),
        t("coupon", "CREATE20", 50, 54, 42, accent),
        t("hint", "استخدم الكود عند الدفع", 50, 71, 24),
      );
      break;
  }
  layers = layers.map((l, j) => ({
    ...l,
    frames: [
      frame(0, { y: 4, opacity: 0 }),
      frame(0.35 + j * 0.06, { easing: "smooth" }),
      frame(7.5),
      frame(8, { y: -2, opacity: 0 }),
    ],
  }));
  return {
    id: prefix,
    name,
    source: "unitool-kits",
    sourceName: "UniTool Ready Kits",
    kind: "group",
    category: "kits",
    layers,
    animated: true,
  };
});
