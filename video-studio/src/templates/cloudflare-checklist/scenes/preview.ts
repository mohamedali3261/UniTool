import { Scene, C, k, entranceSpring } from "../primitives";
export function preview() {
  const s = new Scene(40, 12, "preview");
  s.header("04 / PREVIEW DEPLOYMENTS", "جرّب قبل ما تنشر");
  s.window("لوحة النشر", 53, 900, 0.2);
  s.text("عنوان لوحة النشر", "PAGES / YOUR PROJECT", 50, 34, 25, C.muted, 0.3, {
    font: "mono",
  });
  s.box("زر Deploy", 50, 41, 390, 95, C.orange, 16, 0.5, {
    frames: [
      k(0),
      k(1.6),
      k(1.75, { scaleX: 0.95, scaleY: 0.95 }),
      k(2, { easing: "spring" }),
    ],
  });
  s.text("نص زر النشر", "Deploy  ↗", 50, 41, 40, "#151922", 0.5, {
    font: "mono",
  });
  const cursor = s.text("مؤشر الماوس", "➤", 82, 51, 58, C.white, 0.8, {
    rotation: 310,
    frames: [
      k(0),
      k(1.3, { x: -27, y: -9, easing: "smooth" }),
      k(1.5, { x: -27, y: -9, scaleX: 0.75, scaleY: 0.75 }),
      k(1.7, { x: -27, y: -9 }),
      k(2.2, { x: -27, y: -9, opacity: 0 }),
    ],
  });
  cursor.end = 44;
  s.text(
    "رابط Preview",
    "Preview  ·  a1b2c3.my-site.pages.dev",
    50,
    49,
    23,
    C.green,
    3.2,
    { font: "mono" },
  );
  s.text(
    "رابط Production",
    "Production  ·  my-site.pages.dev",
    50,
    54,
    23,
    C.muted,
    3.6,
    { font: "mono" },
  );
  s.box("مسار السويتش", 50, 61, 170, 65, C.line, 33, 4);
  s.box("كرة السويتش", 45, 61, 49, 49, C.orange, 25, 4, {
    frames: [
      k(0),
      k(2),
      k(2.5, { x: 10, easing: "spring" }),
      k(4),
      k(4.5, { easing: "spring" }),
    ],
  });
  s.text("تسمية Preview", "PREVIEW", 28, 61, 20, C.green, 4, { font: "mono" });
  s.text("تسمية Production", "PROD", 72, 61, 20, C.orange, 4, { font: "mono" });
  s.box("معاينة الصفحة", 50, 72, 690, 215, "#25362f", 16, 4.1, {
    frames: [
      k(0),
      k(1.9),
      k(2.5, { scaleX: 0.95, scaleY: 0.9 }),
      k(3),
      k(4.1),
      k(4.5),
    ],
  });
  const production = s.box(
    "لون صفحة الإنتاج",
    50,
    72,
    690,
    215,
    "#3b2b20",
    16,
    6.3,
    {
      frames: [
        k(0, { opacity: 0, scaleX: 0.95, scaleY: 0.9 }),
        k(0.4, { easing: "smooth" }),
        k(1.6),
        k(2, { opacity: 0 }),
      ],
    },
  );
  production.end = 48.6;
  const a = s.text(
    "حالة المعاينة",
    "PREVIEW / TEST BUILD",
    50,
    71,
    28,
    C.green,
    4.1,
    {
      font: "mono",
      frames: [
        k(0),
        k(1.9),
        k(2.3, { opacity: 0 }),
        k(4, { opacity: 0 }),
        k(4.5),
      ],
    },
  );
  const b = s.text(
    "حالة الإنتاج",
    "PRODUCTION / LIVE",
    50,
    71,
    28,
    C.orange,
    6.4,
    { font: "mono", frames: entranceSpring() },
  );
  b.end = 48.2;
  a.end = 52;
  s.text(
    "حالة الاختبار",
    "✓ اختبر التغييرات قبل اعتمادها",
    50,
    77,
    27,
    C.white,
    4.5,
  );
  s.note("روابط توضيحية لـ Pages • مش نشر حقيقي أو اتصال بحسابك");
  return s.layers;
}
