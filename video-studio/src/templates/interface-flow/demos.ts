import {
  clamp,
  ease,
  panel,
  text,
  line,
  windowFrame,
  cursor,
  reveal,
  code,
} from "./canvas";
export function intro(c: CanvasRenderingContext2D, t: number, a: string) {
  for (let i = 0; i < 3; i++)
    reveal(c, t, i * 0.22, () => {
      c.save();
      c.translate(360, 600 + i * 30);
      c.rotate((i - 1) * 0.08);
      windowFrame(
        c,
        -265,
        -155,
        530,
        275,
        ["portfolio.design", "studio.app", "made-for-you"][i],
      );
      panel(c, -240, -83, 170, 142, i === 1 ? "#284c42" : "#183533");
      text(c, ["MAKE IT", "CREATE", "HELLO."][i], -48, -28, 39, a);
      line(c, -47, 20, 170);
      line(c, -47, 44, 115);
      c.restore();
    });
  reveal(c, t, 0.8, () => {
    windowFrame(c, 48, 860, 624, 230, "terminal / hero.tsx");
    code(
      c,
      [
        '<section class="hero">',
        "  <h1>Make it yours</h1>",
        "  <Button>Start</Button>",
        "</section>",
      ],
      70,
      930,
      t - 1,
      a,
    );
  });
}
function mixColor(a: string, b: string, p: number) {
  const channels = [0, 2, 4].map((i) =>
    Math.round(
      parseInt(a.slice(1 + i, 3 + i), 16) * (1 - p) +
        parseInt(b.slice(1 + i, 3 + i), 16) * p,
    ),
  );
  return `rgb(${channels.join(",")})`;
}
function website(c: CanvasRenderingContext2D, m: number, a: string) {
  panel(c, 75, 510, 570, 395, mixColor("#19232a", "#173d35", m));
  text(c, "STUDIO", 100, 545, 15, a);
  text(c, "WORK / ABOUT", 615, 545, 13, "#a6beb8", "right", true);
  c.save();
  c.globalAlpha *= 1 - m;
  text(c, "Make it", 105, 630, 43, "#f0f4e9");
  text(c, "yours", 105, 700, 43, "#f0f4e9");
  c.restore();
  c.save();
  c.globalAlpha *= m;
  text(c, "MADE", 105, 630, 64, "#f0f4e9");
  text(c, "DIFFERENT.", 105, 700, 54, a);
  c.restore();
  panel(c, 100, 770, 200, 48, a, a, 24);
  text(c, "Explore →", 200, 795, 18, "#05221b", "center");
  c.save();
  c.translate(530, 735);
  c.rotate(m * 0.6);
  panel(c, -67, -73, 135, 145, mixColor("#34434d", "#e5b0f1", m), a, 22);
  c.restore();
}
export function design(c: CanvasRenderingContext2D, t: number, a: string) {
  const m = ease((t - 3) / 1.2);
  windowFrame(c, 48, 400, 624, 620, "design / compare");
  text(c, "بص على الفرق قبل البرومبت الجاي", 630, 475, 23, "#bcd5cc", "right");
  c.save();
  c.filter = t < 2.8 ? "blur(4px)" : "none";
  website(c, m, a);
  c.restore();
  if (t < 2.8) {
    const x = 210 + ease(t / 2.8) * 290;
    c.save();
    c.beginPath();
    c.arc(x, 690, 100, 0, Math.PI * 2);
    c.clip();
    website(c, 0, a);
    c.restore();
    c.strokeStyle = a;
    c.lineWidth = 4;
    c.beginPath();
    c.arc(x, 690, 100, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(x + 75, 765);
    c.lineTo(x + 124, 814);
    c.stroke();
  }
  panel(c, 200, 940, 320, 50, "#081b19");
  panel(c, 207 + 153 * m, 947, 150, 36, a, a, 10);
  text(c, "عادي", 280, 966, 19, m > 0.5 ? "#adc7c0" : "#05251c", "center");
  text(c, "مميز", 435, 966, 19, m > 0.5 ? "#05251c" : "#adc7c0", "center");
  const p = ease((t - 2) / 1);
  cursor(
    c,
    600 - p * 150,
    1040 - p * 68,
    t > 3 && t < 3.6 ? (t - 3) / 0.6 : 0,
    a,
  );
}
export function components(c: CanvasRenderingContext2D, t: number, a: string) {
  windowFrame(c, 48, 420, 624, 630, "dashboard / overview");
  text(c, "Overview", 80, 500, 28);
  text(c, "Last 30 days", 640, 500, 16, "#83a49a", "right");
  for (let i = 0; i < 3; i++)
    reveal(c, t, 0.3 + i * 0.18, () => {
      panel(c, 75 + i * 192, 548, 178, 122);
      text(
        c,
        ["Projects", "Rating", "Growth"][i],
        92 + i * 192,
        576,
        15,
        "#8fa8a0",
      );
      text(
        c,
        [
          String(Math.round(42 * ease(t / 3))),
          (4.8 * ease(t / 3)).toFixed(1),
          `${Math.round(31 * ease(t / 3))}%`,
        ][i],
        92 + i * 192,
        628,
        38,
        a,
      );
    });
  for (let i = 0; i < 5; i++)
    reveal(c, t, 0.8 + i * 0.15, () => {
      const y = 710 + i * 54;
      line(c, 76, y + 38, 570);
      panel(c, 80, y - 7, 26, 26, i % 2 ? a : "#889bc7", undefined, 6);
      text(
        c,
        [
          "Website redesign",
          "Landing page",
          "Design system",
          "Product launch",
          "Mobile layout",
        ][i],
        124,
        y + 7,
        18,
      );
      panel(c, 530, y - 7, 96, 28, "#21483e");
      text(c, i % 2 ? "Review" : "Done", 577, y + 7, 13, a, "center");
    });
}
export function magic(c: CanvasRenderingContext2D, t: number, a: string) {
  windowFrame(c, 48, 420, 624, 640, "components / live-demo");
  const tab = Math.floor(t / 2.8) % 3;
  for (let i = 0; i < 3; i++) {
    panel(c, 84 + i * 184, 493, 174, 45, i === tab ? a : "#182c2b");
    text(
      c,
      ["Buttons", "Cards", "Switch"][i],
      171 + i * 184,
      516,
      18,
      i === tab ? "#062a21" : "#adc7c0",
      "center",
    );
  }
  const pulse = 1 + Math.sin(t * 2) * 0.025;
  c.save();
  c.translate(360, 635);
  c.scale(pulse, pulse);
  panel(c, -177, -40, 354, 80, a, a, 24);
  text(c, "ابدأ مجانًا", 0, 2, 29, "#05251d", "center");
  c.restore();
  const lift = Math.sin(t * 1.3) * 9;
  panel(c, 95, 730 + lift, 530, 155, "#192b37", "#4bdfc540");
  text(c, "A little magic.", 130, 777 + lift, 31);
  text(c, "Motion that feels intentional", 130, 825 + lift, 18, "#89a3b1");
  const on = Math.floor(t / 2) % 2 === 1;
  panel(c, 280, 938, 160, 62, on ? "#287964" : "#34454b", undefined, 32);
  c.fillStyle = "#eafff8";
  c.beginPath();
  c.arc(on ? 408 : 312, 969, 24, 0, Math.PI * 2);
  c.fill();
  cursor(c, 170 + tab * 184, 560, t % 2.8 < 0.45 ? (t % 2.8) / 0.45 : 0, a);
}
export function figma(c: CanvasRenderingContext2D, t: number, a: string) {
  windowFrame(c, 48, 420, 624, 360, "Figma / hero-frame");
  panel(c, 110, 500, 500, 200, "#153d38");
  text(c, "Your next big idea.", 140, 558, 31);
  panel(c, 140, 607, 190, 47, a, a);
  text(c, "Get started", 235, 631, 17, "#09291f", "center");
  c.strokeStyle = "#b7a5ff";
  c.lineWidth = 2;
  c.strokeRect(104, 494, 512, 212);
  for (const x of [104, 616])
    for (const y of [494, 706])
      panel(c, x - 5, y - 5, 10, 10, "#d6cbff", "#a995ff", 0);
  const p = ease((t - 1.5) / 1.5);
  c.strokeStyle = a;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(360, 785);
  c.lineTo(360, 785 + 60 * p);
  c.stroke();
  if (p > 0.8) {
    c.beginPath();
    c.moveTo(347, 833);
    c.lineTo(360, 847);
    c.lineTo(373, 833);
    c.stroke();
  }
  reveal(c, t, 2, () => {
    windowFrame(c, 48, 865, 624, 225, "React / Hero.tsx");
    code(
      c,
      [
        "get_design_context();",
        "export function Hero() {",
        "  return <HeroSection />;",
        "}",
      ],
      70,
      937,
      t - 2,
      a,
    );
  });
}
export function devtools(c: CanvasRenderingContext2D, t: number, a: string) {
  windowFrame(c, 48, 420, 624, 640, "Chrome / performance");
  panel(c, 74, 490, 240, 220, "#13362e");
  text(c, "Hello, web.", 94, 542, 28);
  for (let i = 0; i < 4; i++) line(c, 94, 586 + i * 22, 170 - i * 18);
  for (let i = 0; i < 7; i++) {
    const height = (65 + ((i * 47) % 135)) * ease((t - i * 0.1) / 1.8);
    panel(
      c,
      340 + i * 42,
      700 - height,
      26,
      height || 1,
      i < 4 ? "#58a791" : a,
      undefined,
      4,
    );
  }
  text(c, "Performance trace", 350, 475, 16, "#9cb9ad");
  const values = [
    Math.round(42 + 56 * ease(t / 4)),
    (4.8 - 3.7 * ease(t / 4)).toFixed(1),
    (0.31 - 0.29 * ease(t / 4)).toFixed(2),
  ];
  for (let i = 0; i < 3; i++)
    reveal(c, t, 1.2 + i * 0.25, () => {
      panel(c, 76, 750 + i * 94, 568, 78);
      text(c, ["Performance", "LCP", "CLS"][i], 100, 789 + i * 94, 23);
      text(
        c,
        String(values[i]) + (i === 1 ? " s" : ""),
        615,
        789 + i * 94,
        31,
        a,
        "right",
        true,
      );
    });
}
export function outro(c: CanvasRenderingContext2D, t: number, a: string) {
  const labels = [
    "frontend-design",
    "shadcn/ui MCP",
    "21st.dev Magic",
    "Figma MCP",
    "Chrome DevTools MCP",
  ];
  labels.forEach((s, i) =>
    reveal(c, t, i * 0.35, () => {
      panel(c, 75, 388 + i * 52, 570, 43);
      text(c, "✓", 103, 410 + i * 52, 23, a);
      text(c, s, 142, 410 + i * 52, 20, "#e4efe9", "left", true);
    }),
  );
  panel(c, 75, 720, 570, 80, "#112b26", a);
  text(c, "تعليق", 620, 692, 18, "#91b3a3", "right");
  if (t < 10) {
    const rows = [
        "ض ص ث ق ف غ ع ه خ ح ج",
        "ش س ي ب ل ا ت ن م ك ط",
        "ئ ء ؤ ر لا ى ة و ز ظ",
      ],
      letters = ["ك", "ل", "و", "د"],
      index = Math.floor(Math.max(0, t - 6) / 0.45);
    panel(c, 48, 840, 624, 245, "#132721");
    rows.forEach((row, r) =>
      row.split(" ").forEach((key, i) => {
        const keys = row.split(" "),
          ww = 550 / keys.length,
          x = 80 + i * ww;
        panel(
          c,
          x,
          862 + r * 60,
          ww - 5,
          48,
          t >= 6 && key === letters[index] ? a : "#243d35",
          undefined,
          7,
        );
        text(
          c,
          key,
          x + (ww - 5) / 2,
          886 + r * 60,
          21,
          t >= 6 && key === letters[index] ? "#08261c" : "#e0f2e7",
          "center",
        );
      }),
    );
  } else {
    panel(c, 75, 840, 570, 210, "#17392f");
    panel(c, 300, 865, 120, 70, a, a, 30);
    text(c, "YOU", 360, 900, 29, "#09281e", "center", true);
    text(c, "مساحتك. محتواك. بصمتك.", 360, 984, 25, "#e1f5ea", "center");
  }
}
