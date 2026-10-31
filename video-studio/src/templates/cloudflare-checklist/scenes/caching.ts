import { Scene, C, k } from "../primitives";
export function caching() {
  const s = new Scene(28, 12, "cache");
  s.header("03 / CACHING", "خلّي الموقع يطير");
  s.text("عدّاد الاستجابة", "2.4s", 50, 34, 110, C.orange, 0.6, {
    font: "mono",
    counter: { from: 2.4, to: 0.3, duration: 2, decimals: 1, suffix: "s" },
  });
  s.text("وصف العدّاد", "RESPONSE TIME  /  DEMO", 50, 42, 24, C.muted, 0.6, {
    font: "mono",
  });
  s.box("منطقة الرسم البياني", 50, 56, 800, 350, C.panel, 22, 0.2);
  [0, 1, 2, 3, 4].forEach((i) => {
    const height = 80 + i * 30;
    const y = 62 - height / 34.14;
    s.box(`عمود قبل ${i + 1}`, 19 + i * 8, y, 45, height, C.line, 5, 0.4, {
      frames: [
        k(0),
        k(0.6),
        k(2.6, { scaleY: 0.2, y: (height * 0.4) / 17.07, easing: "smooth" }),
      ],
    });
  });
  s.text("تسمية قبل", "BEFORE  2.4s", 29, 65, 23, C.muted, 0.5, {
    font: "mono",
  });
  s.box("عمود بعد الكاش", 74, 60, 100, 40, C.orange, 6, 2.7, {
    frames: [k(0, { scaleY: 0.1 }), k(0.4, { easing: "spring" })],
  });
  s.text("تسمية بعد", "EDGE  0.3s", 74, 65, 23, C.orange, 2.7, {
    font: "mono",
  });
  // Stylized editable land masses, not a geographic coverage claim.
  const lands = [
    {
      x: 25,
      y: 73,
      w: 210,
      h: 100,
      points: [
        [-1, -0.2],
        [-0.6, -0.8],
        [0.1, -1],
        [1, -0.5],
        [0.9, 0],
        [0.4, 0.2],
        [0.2, 1],
        [-0.3, 0.5],
        [-0.6, 0],
      ],
    },
    {
      x: 36,
      y: 78,
      w: 85,
      h: 120,
      points: [
        [-0.7, -1],
        [0.6, -0.7],
        [1, -0.2],
        [0.3, 0.4],
        [-0.1, 1],
        [-0.5, 0.4],
        [-0.5, -0.1],
      ],
    },
    {
      x: 51,
      y: 72,
      w: 90,
      h: 50,
      points: [
        [-1, 0.2],
        [-0.6, -0.7],
        [0.1, -0.2],
        [0.7, -1],
        [1, 0.4],
        [0.3, 1],
        [-0.2, 0.6],
      ],
    },
    {
      x: 53,
      y: 77,
      w: 95,
      h: 120,
      points: [
        [-0.8, -0.7],
        [0, -1],
        [1, -0.3],
        [0.5, 0.6],
        [0, 1],
        [-0.3, 0.5],
        [-0.6, 0.1],
      ],
    },
    {
      x: 69,
      y: 73,
      w: 240,
      h: 110,
      points: [
        [-1, -0.4],
        [-0.6, -0.8],
        [0, -1],
        [0.7, -0.7],
        [1, -0.2],
        [0.7, 0.3],
        [0.4, 0.1],
        [0.1, 1],
        [-0.2, 0.4],
        [-0.5, 0.7],
        [-0.7, 0],
      ],
    },
    {
      x: 82,
      y: 80,
      w: 95,
      h: 60,
      points: [
        [-1, -0.4],
        [-0.3, -1],
        [0.5, -0.8],
        [1, 0.3],
        [0.4, 1],
        [-0.8, 0.5],
      ],
    },
  ];
  lands.forEach((land, i) =>
    s.box(
      `قارة تخطيطية ${i + 1}`,
      land.x,
      land.y,
      land.w,
      land.h,
      "#283443",
      0,
      3,
      {
        box: {
          width: land.w,
          height: land.h,
          points: land.points.map(([x, y]) => ({ x, y })),
        },
      },
    ),
  );
  [
    [22, 72],
    [30, 74],
    [36, 78],
    [49, 73],
    [54, 76],
    [65, 72],
    [74, 74],
    [82, 78],
  ].forEach(([x, y], i) =>
    s.box(`نقطة Edge ${i + 1}`, x, y, 13, 13, C.orange, 7, 3.5 + i * 0.18, {
      frames: [
        k(0, { opacity: 0, scaleX: 0.2, scaleY: 0.2 }),
        k(0.35, { easing: "spring" }),
        k(1, { opacity: 0.6 }),
        k(1.6),
      ],
    }),
  );
  s.note("أرقام توضيحية • Cache للملفات العامة، مش بيانات المستخدم");
  return s.layers;
}
