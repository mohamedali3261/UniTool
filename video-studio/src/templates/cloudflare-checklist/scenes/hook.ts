import { Scene, C, k } from "../primitives";
export function hook() {
  const s = new Scene(0, 4, "hook");
  s.header("BEFORE YOU DEPLOY", "موقعك وقع بعد ما رفعته؟ 😬");
  s.window("نافذة الموقع", 53, 650);
  const items = [
    s.box("هيدر الموقع", 50, 39, 700, 58, C.line),
    s.box("صورة الموقع", 30, 53, 280, 260, "#3b4a60"),
    s.box("عنوان الموقع", 67, 48, 300, 35, "#a6b3c4"),
    s.box("سطر محتوى ١", 67, 53, 300, 18, C.line),
    s.box("سطر محتوى ٢", 67, 57, 250, 18, C.line),
    s.box("زر الموقع", 66, 63, 250, 65, C.orange),
  ];
  for (const [i, t] of items.entries())
    t.frames = [
      k(0),
      k(0.45),
      k(0.53, { x: -1 }),
      k(0.61, { x: 1 }),
      k(0.69, { x: -1 }),
      k(0.77),
      k(1.55, {
        x: (i % 2 ? 1 : -1) * (3 + i),
        y: 24 + i * 2,
        rotation: (i % 2 ? 1 : -1) * 22,
        opacity: 0,
        easing: "smooth",
      }),
    ];
  s.box("خلفية خطأ 500", 50, 54, 670, 330, "#431e28", 22, 1.15, {
    frames: [
      k(0, { x: -3, opacity: 0 }),
      k(0.1, { x: 2 }),
      k(0.18, { x: -1, opacity: 0.4 }),
      k(0.25),
    ],
  });
  s.text("رقم الخطأ", "500", 50, 50, 115, C.red, 1.15, {
    font: "mono",
    frames: [
      k(0, { x: 3, opacity: 0 }),
      k(0.1, { x: -2 }),
      k(0.2, { x: 2 }),
      k(0.28),
    ],
  });
  s.text("رسالة الخطأ", "INTERNAL SERVER ERROR", 50, 60, 25, C.red, 1.4, {
    font: "mono",
  });
  s.text(
    "نص الهوك اللاحق",
    "اعمل الـ 5 دول الأول",
    50,
    76,
    47,
    C.orange,
    2.35,
    { frames: entrance() },
  );
  return s.layers;
}
function entrance() {
  return [k(0, { y: 4, opacity: 0 }), k(0.35, { easing: "smooth" })];
}
