import { Scene, C, entranceSpring } from "../primitives";
export function database() {
  const s = new Scene(4, 12, "database");
  s.header("01 / DATABASE", "اختار قاعدة بيانات صح");
  s.window("Terminal قاعدة البيانات", 42, 260, 0.2);
  s.text(
    "عنوان التيرمينال",
    "TERMINAL  /  D1 + SQLite",
    47,
    36,
    23,
    C.muted,
    0.3,
    { font: "mono" },
  );
  const cmd = "npx wrangler d1 create my-db";
  s.text("أمر إنشاء قاعدة البيانات", cmd, 50, 43, 30, C.green, 0.6, {
    font: "mono",
    animationIn: "typewriter",
    animationDuration: cmd.length * 0.04,
  });
  s.text(
    "نتيجة الإنشاء",
    "✓  Database created successfully",
    50,
    47,
    24,
    C.muted,
    2.1,
    { font: "mono" },
  );
  s.window("جدول قاعدة البيانات", 64, 380, 2.3);
  s.text("عنوان الجدول", "my-db  /  users", 50, 56, 26, C.orange, 2.5, {
    font: "mono",
  });
  ["ID", "NAME", "STATUS"].forEach((v, i) =>
    s.text(`عمود ${v}`, v, [22, 47, 75][i], 61, 23, C.muted, 2.6, {
      font: "mono",
    }),
  );
  ["Mona", "Omar", "Nour"].forEach((name, i) => {
    s.box(
      `خلفية صف ${i + 1}`,
      50,
      66 + i * 4,
      720,
      50,
      i % 2 ? "#202b39" : "#1b2531",
      5,
      3 + i * 0.3,
    );
    [String(i + 1).padStart(2, "0"), name, "ACTIVE"].forEach((v, j) =>
      s.text(
        `صف ${i + 1} حقل ${j + 1}`,
        v,
        [22, 47, 75][j],
        66 + i * 4,
        24,
        j === 2 ? C.green : C.white,
        3 + i * 0.3,
        { font: "mono" },
      ),
    );
  });
  s.text("اكتمال قاعدة البيانات", "✓", 84, 51, 65, C.green, 4.3, {
    frames: entranceSpring(),
  });
  s.note("D1 لو SQLite مناسب لك • اربط DB وشغّل migrations");
  return s.layers;
}
