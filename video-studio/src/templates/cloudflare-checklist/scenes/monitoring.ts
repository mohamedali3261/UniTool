import { Scene, C, k } from "../primitives";
export function monitoring() {
  const s = new Scene(52, 8, "monitor");
  s.header("05 / MONITORING", "اعرف المشكلة قبل المستخدم");
  s.window("لوحة المراقبة", 54, 710, 0.2);
  s.text(
    "اسم الرسم البياني",
    "ERROR RATE  /  LIVE DEMO",
    50,
    36,
    24,
    C.muted,
    0.3,
    { font: "mono" },
  );
  [45, 53, 61, 69].forEach((y, i) =>
    s.box(`خط شبكة ${i + 1}`, 50, y, 700, 2, C.line, 0, 0.4),
  );
  const points = [
    [16, 61],
    [24, 60],
    [32, 61],
    [40, 59],
    [48, 60],
    [54, 61],
    [62.5, 61],
    [71, 61],
    [80, 60],
    [86, 61],
  ];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i],
      [x2, y2] = points[i + 1];
    const dx = (x2 - x1) * 9.6,
      dy = (y2 - y1) * 17.07;
    const length = Math.hypot(dx, dy);
    const rotation = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const baseline = s.box(
      `جزء الخط الطبيعي ${i + 1}`,
      (x1 + x2) / 2,
      (y1 + y2) / 2,
      length,
      5,
      C.green,
      2,
      0.5,
    );
    if (i === 5 || i === 6)
      baseline.frames = [
        k(0),
        k(1.5),
        k(1.9, { opacity: 0 }),
        k(4.5, { opacity: 0 }),
        k(5),
      ];
  }
  // Red spike grows over a normal baseline, then recovers without layout rebuilds.
  [
    [54, 61, 62.5, 47.5],
    [62.5, 47.5, 71, 61],
  ]
    .map(([x1, y1, x2, y2], i) => {
      const dx = (x2 - x1) * 9.6,
        dy = (y2 - y1) * 17.07;
      return s.box(
        i === 0 ? "صعود الخطأ" : "هبوط الخطأ",
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        Math.hypot(dx, dy),
        6,
        C.red,
        3,
        2,
        { rotation: ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360 },
      );
    })
    .forEach((t) => {
      t.end = 57.2;
      t.frames = [
        k(0, { scaleX: 0.001, opacity: 0 }),
        k(0.4, { easing: "smooth" }),
        k(2),
        k(3.2, { scaleX: 0.001, opacity: 0, easing: "smooth" }),
      ];
    });
  const notice = s.box("خلفية التنبيه", 50, 43, 690, 96, "#472631", 16, 2.5, {
    frames: [
      k(0, { y: -12, opacity: 0 }),
      k(0.5, { easing: "spring" }),
      k(2),
      k(2.5, { opacity: 0, y: -4 }),
    ],
  });
  notice.end = 57.5;
  const nt = s.text(
    "نص التنبيه",
    "⚠️ Error rate مرتفع",
    50,
    43,
    32,
    C.red,
    2.5,
    { frames: notice.frames },
  );
  nt.end = 57.5;
  s.text(
    "حالة التعافي",
    "✓  Resolved / back to normal",
    50,
    75,
    28,
    C.green,
    5.6,
    { font: "mono" },
  );
  s.note("مثال توضيحي • اربط Logs وأداة تنبيهات مناسبة لمشروعك");
  return s.layers;
}
