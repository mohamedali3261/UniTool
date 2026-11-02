import { Scene, C, k, entranceSpring } from "../primitives";
export function secrets() {
  const s = new Scene(16, 12, "secrets");
  s.header("02 / ENVIRONMENT", "متحطش المفاتيح في الكود");
  s.window("ملف الكود", 44, 360, 0.2);
  s.text(
    "اسم ملف الكود",
    "src/config.ts  ·  DEMO KEY",
    50,
    36,
    25,
    C.muted,
    0.3,
    { font: "mono" },
  );
  s.text("اسم المتغير", "API_KEY =", 31, 44, 29, C.blue, 0.5, { font: "mono" });
  const key = s.text(
    "مفتاح توضيحي مكشوف",
    '"demo_12345"',
    67,
    44,
    30,
    C.red,
    0.6,
    { font: "mono" },
  );
  key.end = 18.4;
  key.frames = [
    k(0),
    k(0.65),
    k(1.35, { blur: 18, opacity: 0.25 }),
    k(1.7, { blur: 20, opacity: 0 }),
  ];
  s.text("المفتاح المخفي", '"**********"', 67, 44, 30, C.green, 2.15, {
    font: "mono",
  });
  s.text("الطريقة الآمنة داخل الكود", "env.API_KEY", 50, 51, 34, C.green, 3.1, {
    font: "mono",
  });
  s.window("Terminal الأسرار", 65, 260, 3.7);
  const cmd = "npx wrangler secret put API_KEY";
  s.text("أمر تخزين السر", cmd, 50, 64, 29, C.green, 4, {
    font: "mono",
    animationIn: "typewriter",
    animationDuration: cmd.length * 0.04,
  });
  s.text(
    "نتيجة تخزين السر",
    "✓  Secret stored securely",
    50,
    70,
    25,
    C.muted,
    5.5,
    { font: "mono" },
  );
  s.box("جسم القفل", 50, 77, 68, 55, C.orange, 10, 6, {
    frames: entranceSpring(),
  });
  s.box("قوس القفل", 50, 74.6, 45, 45, C.orange, 22, 6, {
    background: undefined,
    box: {
      width: 45,
      height: 45,
      radius: 22,
      borderWidth: 7,
      borderColor: C.orange,
    },
    frames: [k(0, { rotation: -35, x: 1 }), k(0.6, { easing: "spring" })],
  });
  s.note("الأمر لـ Workers • في Pages استخدم pages secret put");
  return s.layers;
}
