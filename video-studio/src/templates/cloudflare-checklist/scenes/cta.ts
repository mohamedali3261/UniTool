import { Scene, C, k } from "../primitives";
export function cta() {
  const s = new Scene(60, 6, "cta");
  s.header("SAVE YOUR NEXT DEPLOY", "اكتب Cloudflare في التعليقات");
  s.text(
    "وعد إرسال القائمة",
    "وهبعتلك الـ checklist",
    50,
    30,
    42,
    C.orange,
    0.3,
  );
  s.window("خانة التعليق", 47, 210, 0.5);
  s.text("عنوان التعليق", "اكتب تعليقًا…", 50, 43, 27, C.muted, 0.6);
  s.text("الكلمة المكتوبة", "Cloudflare", 50, 49, 42, C.white, 1, {
    font: "mono",
    animationIn: "typewriter",
    animationDuration: 0.4,
  });
  s.box("خلفية الكيبورد", 50, 66, 850, 370, "#1b2330", 20, 0.7);
  const rows = ["ضصثقفغعهخحج", "شسيبلاتنمكط", "ئءؤرلىةوزظ"];
  rows.forEach((row, r) =>
    [...row].forEach((ch, i) =>
      s.box(
        `زر كيبورد ${ch}`,
        12.5 + i * 7.5,
        58 + r * 5,
        59,
        61,
        "#303b4c",
        8,
        0.8,
        { text: ch, color: C.white, size: 28 },
      ),
    ),
  );
  s.box("زر تبديل اللغة", 22, 76, 170, 53, C.line, 8, 0.8, {
    text: "عربي / EN",
    size: 20,
    color: C.muted,
  });
  s.box("زر المسافة", 53, 76, 370, 53, C.line, 8, 0.8);
  s.box("زر الإرسال", 83, 76, 130, 53, C.orange, 8, 0.8, {
    text: "↵",
    size: 30,
    color: "#151922",
  });
  // English word requested in an Arabic-layout keyboard; explicit language switch.
  s.text("توضيح لغة الكتابة", "عربي → EN", 50, 82, 22, C.muted, 1);
  [..."Cloudflare"].forEach((ch, i) => {
    const t = s.box(
      `إضاءة الحرف ${i + 1}`,
      12.5 + (i % 10) * 7.5,
      58 + (i % 3) * 5,
      59,
      61,
      C.orange,
      8,
      1 + i * 0.04,
      {
        text: ch.toUpperCase(),
        size: 25,
        color: "#11151b",
        frames: [k(0, { opacity: 0.1 }), k(0.04), k(0.12, { opacity: 0 })],
      },
    );
    t.end = 61 + i * 0.04 + 0.14;
  });
  s.text(
    "تذكير القائمة",
    "D1 · Secrets · Cache · Preview · Logs",
    50,
    87,
    21,
    C.orange,
    2,
    { font: "mono" },
  );
  for (const t of s.layers)
    if (
      t.name?.startsWith("زر ") ||
      t.name === "خلفية الكيبورد" ||
      t.name === "توضيح لغة الكتابة"
    )
      t.end = Math.min(t.end, 64.2);
  s.text("اسم الحساب الختامي", "@yourname", 50, 79, 40, C.white, 4.4, {
    font: "mono",
  });
  return s.layers;
}
