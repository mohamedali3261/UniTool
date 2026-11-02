/** Unitool / ONE WORKSPACE — all art, scenes, animation and audio are authored here.
 * Animation is a pure function of timeline seconds. No random state or timers in art.
 * EDIT HERE: copy, URL, palette, exact scene boundaries, music gain and UI cue times. */
export const CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 92,
  site: "unitool1.vercel.app",
  accent: "#59e4ef",
  secondary: "#a494ff",
  musicGain: 0.035,
  uiGain: 0.22,
};
export const TIMELINE = [
  {
    id: "hook",
    start: 0,
    end: 6,
    title: "بتفتح 10 مواقع علشان تخلّص شغلك؟",
    sample: 4.5,
  },
  { id: "pdf", start: 6, end: 22, title: "أدوات PDF كاملة", sample: 11.2 },
  {
    id: "images",
    start: 22,
    end: 36,
    title: "حوّل صورك في ثانية",
    sample: 30.7,
  },
  {
    id: "design",
    start: 36,
    end: 52,
    title: "استوديو تصميم جوه الأداة",
    sample: 44.3,
  },
  { id: "audio", start: 52, end: 68, title: "حوّل أي كتاب لصوت", sample: 60.5 },
  {
    id: "icons",
    start: 68,
    end: 80,
    title: "أيقونات SVG متحركة جاهزة",
    sample: 74.7,
  },
  { id: "more", start: 80, end: 86, title: "وأكتر من كده", sample: 83.3 },
  {
    id: "cta",
    start: 86,
    end: 92,
    title: "Unitool.. جرّبه مجانًا",
    sample: 90.2,
  },
] as const;
export const AUDIO_CUES = [
  ...Array.from({ length: 10 }, (_, i) => ({
    at: 0.35 + i * 0.18,
    kind: "pop",
  })),
  { at: 3.35, kind: "success" },
  ...[
    8.2, 12.2, 17.0, 20.4, 23.0, 26.0, 29.0, 32.0, 37.5, 39.0, 40.5, 42.2, 42.8,
    44.3, 49.2, 53.5, 56.0, 60.0, 69.0, 72.2, 76.6, 80.45, 80.63, 80.81, 80.99,
    81.17, 81.35, 87.3, 89.8,
  ].map((at) => ({ at, kind: "click" })),
  ...[10.5, 16.1, 19.7, 21.0, 33.5, 50.4, 77.0, 90.1].map((at) => ({
    at,
    kind: "success",
  })),
];
const C = {
  a: CONFIG.accent,
  b: CONFIG.secondary,
  white: "#f5f6ff",
  muted: "#94a0bb",
  green: "#76e6b1",
  panel: "#121c31",
  line: "#ffffff20",
};
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const spring = (n: number) => {
  const t = clamp(n);
  return (
    (1 - Math.exp(-7 * t) * Math.cos(10 * t)) /
    (1 - Math.exp(-7) * Math.cos(10))
  );
};
const inAt = (t: number, at: number, d = 0.55) => spring((t - at) / d);
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const g = (s: string, x = 0, y = 0, scale = 1, opacity = 1, rotate = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${Math.max(0.001, scale)})" opacity="${clamp(opacity)}">${s}</g>`;
const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill = "url(#glass)",
  radius = 24,
  stroke = C.line,
) =>
  `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const line = (
  x: number,
  y: number,
  x2: number,
  y2: number,
  color = C.line,
  width = 2,
) =>
  `<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
type TextOpts = {
  color?: string;
  anchor?: "middle" | "start" | "end";
  mono?: boolean;
  opacity?: number;
  safe?: boolean;
};
const text = (s: string, x: number, y: number, size = 30, o: TextOpts = {}) =>
  `<text ${o.safe === false ? "" : 'data-safe="text"'} x="${x}" y="${y}" font-size="${size}" fill="${o.color || C.white}" text-anchor="${o.anchor || "middle"}" direction="${o.mono ? "ltr" : "rtl"}" unicode-bidi="plaintext" font-family="${o.mono ? "FilmMono" : "FilmArabic,FilmLatin"}" font-weight="${o.mono ? 500 : 700}" opacity="${o.opacity ?? 1}">${esc(s)}</text>`;
const mono = (s: string, x: number, y: number, size = 24, color = C.muted) =>
  text(s, x, y, size, { mono: true, color });
const pill = (s: string, x: number, y: number, w: number, color = C.a) =>
  rect(x, y, w, 44, `${color}15`, 22, `${color}55`) +
  text(s, x + w / 2, y + 30, 21, { color });
function mark(x: number, y: number, size: number, glow = false) {
  return (
    g(
      `${rect(-size / 2, -size / 2, size, size, "url(#brand)", size * 0.27, "#b7f8ff55")}<path d="M${-size * 0.23} ${-size * 0.19}V${size * 0.08}Q${-size * 0.23} ${size * 0.3} 0 ${size * 0.3}Q${size * 0.23} ${size * 0.3} ${size * 0.23} ${size * 0.08}V${-size * 0.19}" fill="none" stroke="#07182b" stroke-width="${size * 0.105}" stroke-linecap="round"/>`,
      x,
      y,
      1,
      1,
    ) +
    (glow
      ? `<circle cx="${x}" cy="${y}" r="${size * 0.75}" fill="none" stroke="${C.a}" stroke-opacity=".12" stroke-width="18" filter="url(#glow)"/>`
      : "")
  );
}
function icon(
  name: string,
  x: number,
  y: number,
  size = 38,
  color = C.a,
  t = 0,
  animated = false,
) {
  const paths: Record<string, string> = {
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    loader: "M20 12a8 8 0 1 1-4-7M20 3v5h-5",
    check: "M4 12l5 5L20 5",
    sparkles: "m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z",
    upload: "M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5",
    download: "M12 3v13m-5-5 5 5 5-5M3 18v3h18v-3",
    code: "m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18",
    shield: "M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6ZM8 12l3 3 5-6",
    bolt: "M13 2 4 14h7l-1 8 10-12h-7Z",
    settings:
      "M12 4v-2m0 20v-2M4 12H2m20 0h-2M5 5l-2-2m18 18-2-2M5 19l-2 2M21 3l-2 2M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z",
    search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 7 7",
    pdf: "M5 2h9l5 5v15H5Zm9 0v6h5M8 12h8M8 16h6",
    image: "M3 3h18v18H3ZM3 17l6-7 5 5 3-3 4 5M16 7h.01",
    book: "M12 5Q6 1 2 4v16q4-3 10 1 6-4 10-1V4q-4-3-10 1Zm0 0v16",
    headphones: "M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v9H3Zm14 0h4v9h-4",
    qr: "M2 2h7v7H2Zm13 0h7v7h-7ZM2 15h7v7H2Zm13 0h3v3h-3m6-3v7h-6m0-1h3",
    ruler: "m3 16 13-13 6 6L9 22ZM7 12l3 3m0-6 3 3m0-6 3 3",
    lock: "M6 10V7a6 6 0 0 1 12 0v3M4 10h16v12H4Zm8 5v3",
    calc: "M4 2h16v20H4Zm3 3h10v4H7Zm0 8h2m6 0h2m-10 5h2m6 0h2",
    json: "M9 2H6v7l-3 3 3 3v7h3m6-20h3v7l3 3-3 3v7h-3",
    play: "m8 3 13 9L8 21Z",
    pause: "M7 4v16m10-16v16",
  };
  let rot = 0,
    scale = 1,
    dy = 0;
  if (animated) {
    if (name === "heart")
      scale = 1 + 0.12 * Math.pow(Math.max(0, Math.sin(t * 5)), 3);
    if (name === "bell")
      rot = Math.sin(t * 14) * 11 * Math.pow(Math.sin(t * 1.2), 2);
    if (name === "loader" || name === "settings")
      rot = t * (name === "loader" ? 140 : 28);
    if (name === "upload") dy = -3 * Math.pow(Math.sin(t * 2), 2);
    if (name === "download") dy = 3 * Math.pow(Math.sin(t * 2), 2);
    if (name === "sparkles") {
      scale = 1 + 0.1 * Math.sin(t * 3);
      rot = 8 * Math.sin(t * 2.5);
    }
    if (name === "search") {
      rot = 8 * Math.sin(t * 1.8);
      dy = 2 * Math.cos(t * 1.8);
    }
    if (name === "code") scale = 1 + 0.035 * Math.sin(t * 3.7);
  }
  const draw =
    (name === "check" || name === "shield") && animated
      ? ` pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 * (1 - smooth((t % 3) / 1.2))}"`
      : "";
  return g(
    `<g transform="translate(12 12) rotate(${rot}) scale(${scale}) translate(-12 -12)"><path d="${paths[name] || paths.sparkles}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity="${name === "bolt" && animated ? 0.62 + 0.38 * Math.pow(Math.sin(t * 4), 2) : 1}"${draw}/></g>`,
    x - size / 2,
    y - size / 2 + dy,
    size / 24,
  );
}
function panel(
  x: number,
  y: number,
  w: number,
  h: number,
  label = "UNITOOL / WORKSPACE",
) {
  return (
    `<g filter="url(#shadow)">${rect(x, y, w, h)}</g>` +
    line(x, y + 54, x + w, y + 54) +
    [0, 1, 2]
      .map(
        (i) =>
          `<circle cx="${x + 26 + i * 19}" cy="${y + 27}" r="4" fill="${i === 0 ? C.a : i === 1 ? C.b : "#64728b"}" opacity=".85"/>`,
      )
      .join("") +
    mono(label, x + w / 2, y + 35, 17)
  );
}
function heading(title: string, kicker: string, t: number, subtitle = "") {
  const p = smooth(t / 0.6);
  return `<g opacity="${p}" style="filter:blur(${8 * (1 - p)}px)" transform="translate(0 ${12 * (1 - p)})">${mono(kicker, 960, 126, 19, C.a)}${text(title, 960, 200, 64)}${subtitle ? text(subtitle, 960, 246, 27, { color: C.muted }) : ""}</g>`;
}
function pop(
  s: string,
  x: number,
  y: number,
  t: number,
  at: number,
  scale = 1,
) {
  const p = inAt(t, at);
  return g(s, x, y, p * scale, smooth((t - at) / 0.18));
}
function cursor(
  t: number,
  from: [number, number],
  to: [number, number],
  at: number,
  clickAt: number,
) {
  const p = smooth((t - at) / 0.85);
  const x = from[0] + (to[0] - from[0]) * p,
    y = from[1] + (to[1] - from[1]) * p - 90 * Math.sin(p * Math.PI);
  const click = clamp((t - clickAt) / 0.45);
  const scale = t > clickAt && t < clickAt + 0.18 ? 0.84 : 1;
  return `<g pointer-events="none">${t >= clickAt && t < clickAt + 0.45 ? `<circle cx="${to[0]}" cy="${to[1]}" r="${12 + click * 34}" stroke="${C.a}" stroke-width="3" opacity="${1 - click}" fill="none"/>` : ""}${g('<path d="M0 0 7 38 17 27 28 43 36 38 25 23 40 20Z" fill="#f4f8ff" stroke="#0b1020" stroke-width="2"/>', x, y, scale)}</g>`;
}
function success(
  x: number,
  y: number,
  t: number,
  at: number,
  label = "تم بنجاح",
) {
  return pop(
    `<circle r="25" fill="${C.green}18" stroke="${C.green}66"/>${icon("check", 0, 0, 28, C.green)}${text(label, 0, 55, 23, { color: C.green })}`,
    x,
    y,
    t,
    at,
  );
}
function documentCard(
  x: number,
  y: number,
  label: string,
  w = 150,
  accent = C.a,
) {
  return (
    rect(x - w / 2, y - 100, w, 200, "#18263d", 16, `${accent}55`) +
    icon("pdf", x, y - 32, 60, accent) +
    mono(label, x, y + 24, 21, C.white) +
    [0, 1, 2]
      .map((i) =>
        line(
          x - w * 0.3,
          y + 46 + i * 14,
          x + w * (i === 2 ? 0.05 : 0.3),
          y + 46 + i * 14,
          `${accent}25`,
          4,
        ),
      )
      .join("")
  );
}
function artwork(
  x: number,
  y: number,
  w: number,
  h: number,
  id: string,
  variant = 0,
) {
  return (
    `<g clip-path="url(#${id})"><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath></defs>${rect(x, y, w, h, variant ? "#162c42" : "#26274b", 0, "none")}<circle cx="${x + w * 0.73}" cy="${y + h * 0.29}" r="${h * 0.14}" fill="${variant ? C.a : C.b}"/>` +
    `<path d="M${x - w * 0.1} ${y + h}L${x + w * 0.36} ${y + h * 0.32}L${x + w * 0.82} ${y + h}Z" fill="${variant ? "#396d79" : "#7561a4"}"/><path d="M${x + w * 0.27} ${y + h}L${x + w * 0.72} ${y + h * 0.45}L${x + w * 1.15} ${y + h}Z" fill="${variant ? "#55b8c2" : "#a08bc5"}"/>` +
    Array.from({ length: 4 }, (_, i) =>
      line(
        x,
        y + h * 0.72 + i * 15,
        x + w,
        y + h * 0.72 + i * 15,
        "#ffffff10",
        1,
      ),
    ).join("") +
    "</g>"
  );
}

// 00 — Too many tabs collapse into a single purposeful workspace.
export function sceneHook(t: number) {
  let s = heading(TIMELINE[0].title, "01 / ONE WORKSPACE", t);
  const collapse = smooth((t - 2.7) / 0.8);
  for (let i = 0; i < 10; i++) {
    const p = inAt(t, 0.35 + i * 0.18);
    const sx = 460 + (i % 5) * 235,
      sy = 425 + Math.floor(i / 5) * 180;
    const x = sx + (960 - sx) * collapse,
      y = sy + (575 - sy) * collapse;
    const sc = (0.78 + 0.03 * (i % 3)) * (1 - collapse) + collapse * 0.045;
    const card =
      panel(
        -205,
        -110,
        410,
        225,
        [
          "PDF MERGE",
          "IMAGE CONVERT",
          "DESIGN STUDIO",
          "AUDIO BOOK",
          "SVG ICONS",
          "COMPRESS",
          "QR CODE",
          "SPLIT PDF",
          "EXPORT",
          "TOOLBOX",
        ][i],
      ) +
      Array.from({ length: 3 }, (_, j) =>
        rect(
          -165,
          -25 + j * 32,
          280 - j * 38,
          12,
          j === 0 ? "#ffffff35" : "#ffffff12",
          6,
          "none",
        ),
      ).join("");
    s += g(
      card,
      x,
      y,
      sc * p,
      (1 - collapse) * smooth((t - 0.35 - i * 0.18) / 0.16),
      0,
    );
  }
  const p = inAt(t, 3.22, 0.75);
  s += g(mark(0, 0, 150, true), 960, 525, p, smooth((t - 3.22) / 0.2));
  s += g(
    text("Unitool.. كل أدواتك في مكان واحد", 960, 740, 68),
    0,
    20 * (1 - p),
    1,
    smooth((t - 3.5) / 0.4),
  );
  s += g(
    mono("LESS TABS. MORE FLOW.", 960, 805, 24, C.a),
    0,
    0,
    1,
    smooth((t - 3.8) / 0.4),
  );
  return s;
}

// 01 — One operation is in focus at a time; source files never jump randomly.
export function scenePdf(t: number) {
  let s = heading(
    "أدوات PDF كاملة",
    "02 / DOCUMENTS, SORTED",
    t,
    "من أول ملف… لآخر نسخة جاهزة",
  );
  s += panel(240, 295, 1440, 625, "UNITOOL / PDF WORKSPACE");
  const labels = ["دمج", "تقسيم", "ضغط", "تحويل لـ Word", "حماية بباسورد"];
  for (let i = 0; i < 5; i++) {
    const selected = t < 6 ? 0 : t < 10.7 ? 2 : t < 14.3 ? 1 : 4;
    s += pop(
      rect(
        -117,
        -30,
        234,
        60,
        i === selected ? `${C.a}20` : "#ffffff05",
        15,
        i === selected ? C.a : C.line,
      ) + text(labels[i], 0, 10, 25, { color: i === selected ? C.a : C.muted }),
      405 + i * 278,
      395,
      t,
      0.35 + i * 0.15,
    );
  }
  if (t < 6) {
    const drag = smooth((t - 0.6) / 1.5),
      merge = smooth((t - 3.1) / 1.2);
    s += g(
      documentCard(0, 0, "report.pdf"),
      570 + drag * 180 + merge * 210,
      610 + drag * 12,
      1 - merge * 0.12,
      1 - merge,
    );
    s += g(
      documentCard(0, 0, "notes.pdf"),
      1350 - drag * 180 - merge * 210,
      610 + drag * 12,
      1 - merge * 0.12,
      1 - merge,
    );
    s += g(
      documentCard(0, 0, "merged.pdf", 190),
      960,
      620,
      inAt(t, 4.1),
      smooth((t - 4.1) / 0.2),
    );
    s += text("ملفّين… نسخة واحدة مرتّبة", 960, 840, 31, { color: C.muted });
    s += cursor(t, [570, 580], [780, 610], 0.6, 2.2);
    if (t > 4.4) s += success(1130, 624, t, 4.5);
  } else if (t < 10.7) {
    const p = smooth((t - 6.2) / 2.6);
    s += icon("pdf", 610, 620, 110, C.a);
    s += mono(`${(12 - 10 * p).toFixed(1)} MB`, 1100, 619, 82, C.white);
    s +=
      rect(790, 675, 560, 16, "#ffffff10", 8, "none") +
      rect(790, 675, 560 * (1 - 0.83 * p), 16, "url(#brand)", 8, "none");
    s += pill("حجم أقل. نفس ترتيبك.", 850, 756, 390);
    s += mono("12 MB → 2 MB  /  DEMO", 1100, 848, 18);
    s += success(1450, 635, t, 10.1);
  } else if (t < 14.3) {
    const p = smooth((t - 11) / 1.6);
    s += g(
      documentCard(0, 0, "part-01.pdf", 165),
      960 - p * 175,
      620,
      1,
      -0 + 1,
    );
    s += g(
      documentCard(0, 0, "part-02.pdf", 165, C.b),
      960 + p * 175,
      620,
      1,
      p,
    );
    s +=
      line(960, 485, 960, 760, C.a, 3) +
      `<path d="M960 485V760" stroke="${C.a}" stroke-width="10" opacity="${0.5 * (1 - p)}" filter="url(#glow)"/>`;
    s += text("قسّم الملف… وخُد اللي محتاجه", 960, 840, 31, { color: C.muted });
    s += success(1330, 630, t, 13.7);
  } else {
    s += documentCard(790, 620, "secure.pdf", 170);
    s += pop(icon("lock", 0, 0, 95, C.a), 1090, 610, t, 14.4);
    s +=
      rect(980, 715, 270, 55, "#ffffff08", 14, C.line) +
      mono("••••••••", 1115, 753, 26, C.white);
    s += text("حماية بكلمة مرور", 1100, 820, 30, { color: C.muted });
    s += success(1380, 620, t, 15.0);
  }
  return s;
}

// 02 — A single authored vector image, not stock photography or fake bitmap tracing.
export function sceneImages(t: number) {
  let s = heading(
    "حوّل صورك في ثانية",
    "03 / EVERY FORMAT. ONE FLOW.",
    t,
    "صيغ مختلفة… ومساحة أكبر للاختيار",
  );
  s += panel(240, 295, 1440, 625, "UNITOOL / IMAGE CONVERTER");
  const formats = ["PNG", "JPG", "WebP", "SVG"];
  const stage = Math.min(3, Math.floor(Math.max(0, t - 1) / 3));
  for (let i = 0; i < 4; i++) {
    const p = inAt(t, 0.3 + i * 0.12);
    s += g(
      pill(formats[i], -70, -24, 140, i === stage ? C.a : C.muted),
      605 + i * 235,
      391,
      p,
    );
    if (i < 3) s += mono("→", 722 + i * 235, 398, 23);
  }
  const flip = (t - 1) % 3;
  const scaleX = Math.abs(Math.cos(Math.PI * clamp(flip / 0.4)));
  s += `<g transform="translate(960 490) scale(${Math.max(0.05, scaleX)} 1)">${pill(formats[stage], -69, -30, 138)}</g>`;
  const imgx = 645,
    imgy = 505,
    w = 630,
    h = 280;
  const cycle = clamp((t % 3) / 1.5);
  const disperse = Math.sin(Math.PI * clamp((((t - 1) % 3) - 0.3) / 0.65));
  if (t > 1 && (t - 1) % 3 < 1) {
    for (let row = 0; row < 6; row++)
      for (let col = 0; col < 12; col++) {
        const dx = (col - 5.5) * disperse * 8,
          dy = (row - 2.5) * disperse * 7;
        s += rect(
          imgx + (col * w) / 12 + dx,
          imgy + (row * h) / 6 + dy,
          w / 12 - 3,
          h / 6 - 3,
          (row + col) % 3 === 0 ? C.a : (row + col) % 2 ? C.b : "#3d5076",
          5,
          "none",
        );
      }
  } else {
    s += artwork(imgx, imgy, w, h, "image-original", 0);
    const compare = smooth((t - 7) / 2.5);
    if (t > 7) {
      const split = w * (0.15 + 0.7 * compare);
      s +=
        `<defs><clipPath id="after"><rect x="${imgx}" y="${imgy}" width="${split}" height="${h}"/></clipPath></defs><g clip-path="url(#after)">${artwork(imgx, imgy, w, h, "image-after", 1)}</g>` +
        line(imgx + split, imgy, imgx + split, imgy + h, C.white, 3) +
        `<circle cx="${imgx + split}" cy="${imgy + h / 2}" r="22" fill="${C.a}"/>` +
        mono("↔", imgx + split, imgy + h / 2 + 7, 22, "#0c2030");
    }
  }
  const r = 37,
    circ = 2 * Math.PI * r;
  s +=
    `<circle cx="1470" cy="640" r="${r}" fill="none" stroke="#ffffff16" stroke-width="7"/><circle cx="1470" cy="640" r="${r}" fill="none" stroke="${C.a}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - cycle)}" transform="rotate(-90 1470 640)"/>` +
    mono(`${Math.round(cycle * 100)}%`, 1470, 650, 20, C.white);
  s +=
    mono("BEFORE", 750, 832, 18) +
    mono("AFTER", 1180, 832, 18, C.a) +
    text("رسم متجه أصلي • معاينات صيغ توضيحية", 960, 881, 21, {
      color: C.muted,
    });
  return s;
}

// 03 — A precise cursor route, a deliberate design, then a real visual export cue.
export function sceneDesign(t: number) {
  let s = heading(
    "استوديو تصميم جوه الأداة",
    "04 / MAKE IT YOURS.",
    t,
    "فكرتك… من كانفاس فاضي لتصميم جاهز",
  );
  s += panel(200, 295, 1520, 625, "UNITOOL / DESIGN STUDIO");
  s += rect(230, 370, 215, 510, "#080f1b70", 18, "none");
  ["نص", "شكل", "صورة", "أيقونة"].forEach(
    (v, i) =>
      (s += pop(
        rect(-85, -30, 170, 60, "#ffffff07", 13) + text(v, 0, 9, 25),
        337,
        422 + i * 93,
        t,
        0.35 + i * 0.1,
      )),
  );
  const exportP = smooth((t - 13.1) / 0.8),
    canvasScale = 1 - exportP * 0.68,
    canvasX = 975 + (1440 - 975) * exportP,
    canvasY = 615 + (765 - 615) * exportP;
  let canvas = rect(-350, -225, 700, 450, "#eff3f4", 12, "none");
  const p1 = inAt(t, 1.5);
  canvas += g(
    rect(-350, -225, 700, 106, "#29354e", 0, "none"),
    0,
    0,
    1,
    smooth((t - 1.5) / 0.2),
  );
  canvas += g(
    text("صمّمها بطريقتك", 0, -78, 48, { color: "#16243b" }),
    0,
    0,
    p1,
    smooth((t - 1.5) / 0.2),
  );
  const move = smooth((t - 5.5) / 1.4);
  canvas += g(
    rect(-110, -45, 220, 90, t < 6.5 ? C.b : C.a, 20, "none"),
    -100 + move * 160,
    35,
    Math.max(0.001, inAt(t, 3)),
    smooth((t - 3) / 0.2),
  );
  canvas += g(
    artwork(-125, -70, 250, 140, "design-photo", 1),
    -140,
    130,
    Math.max(0.001, inAt(t, 4.5)),
    smooth((t - 4.5) / 0.2),
  );
  canvas += pop(
    icon("sparkles", 0, 0, 76, t < 6.5 ? C.b : "#247d8b"),
    200,
    125,
    t,
    6.2,
  );
  s += g(canvas, canvasX, canvasY, canvasScale);
  const pal = inAt(t, 6.8);
  s += g(
    rect(-110, -115, 220, 230, "#182239", 20) +
      mono("COLORS", 0, -70, 19) +
      [C.a, C.b, "#f3ce8c"]
        .map(
          (c, i) => `<circle cx="${-65 + i * 65}" cy="0" r="22" fill="${c}"/>`,
        )
        .join("") +
      text("لونك. هويتك.", 0, 75, 22, { color: C.muted }),
    1520 + (1 - pal) * 240,
    565,
    1,
    smooth((t - 6.8) / 0.3),
  );
  if (t < 8.5) s += cursor(t, [1450, 800], [1030, 650], 5.4, 6.2);
  const templates = ["بوستر", "بوست سوشيال", "غلاف"];
  for (let i = 0; i < 3; i++) {
    const shown = inAt(t, 8.3 + i * 0.22);
    const flip = Math.max(
      0.08,
      Math.abs(Math.cos(Math.PI * clamp((t - 8.3 - i * 0.22) / 0.55))),
    );
    s += g(
      rect(-95, -42, 190, 84, "#15223a", 13) +
        text(templates[i], 0, 9, 23, {
          color: i === Math.floor((t - 9) % 3) ? C.a : C.muted,
        }),
      650 + i * 250,
      856,
      shown * flip,
      smooth((t - 8.3 - i * 0.22) / 0.2),
    );
  }
  s +=
    rect(1450, 375, 210, 60, C.a, 15, "none") +
    text("تصدير", 1555, 415, 28, { color: "#071e2b" });
  if (t > 11.6) s += cursor(t, [1320, 540], [1555, 405], 11.9, 13.2);
  if (t > 13.8)
    s += pop(
      icon("download", 0, 0, 66, C.a) + mono("design.png", 0, 70, 20, C.white),
      1460,
      760,
      t,
      13.8,
    );
  if (t > 14.4) s += success(1210, 740, t, 14.4, "جاهز للتحميل");
  return s;
}

// 04 — Original book excerpt; highlighting and the waveform share the same clock.
export function sceneAudio(t: number) {
  let s = heading(
    "حوّل أي كتاب لصوت",
    "05 / READ LESS. LISTEN MORE.",
    t,
    "اختار صوتك ولغتك… وكمّل يومك",
  );
  s += panel(240, 295, 1440, 625, "UNITOOL / AUDIO READER");
  const open = inAt(t, 0.6);
  s += g(
    rect(-310, -208, 620, 416, "#edf0f0", 16, "none"),
    710,
    592,
    Math.max(0.001, open),
  );
  s += line(710, 390, 710, 795, "#afbbc9", 2);
  const words = [
    "كل",
    "فكرة",
    "عظيمة",
    "تبدأ",
    "بخطوة",
    "صغيرة",
    "امنح",
    "فضولك",
    "مساحة",
    "واصنع",
    "شيئًا",
    "يستحق",
  ];
  const index = Math.floor(Math.max(0, t - 2.4) / 0.55) % words.length;
  for (let i = 0; i < words.length; i++) {
    const row = Math.floor(i / 3),
      col = i % 3;
    const x = 930 - col * 218,
      y = 461 + row * 72;
    if (col === 1 || i === index)
      s += rect(
        x - 85,
        y - 37,
        170,
        51,
        i === index ? "#8fe7ed" : "#edf0f0",
        8,
        "none",
      );
    s += text(words[i], x, y, 34, {
      color: i === index ? "#0a4550" : "#2a3a4b",
    });
  }
  s +=
    mono("THE FIRST STEP", 1284, 420, 20, C.a) +
    icon("headphones", 1284, 490, 65, C.a);
  for (let i = 0; i < 29; i++) {
    const h =
      22 +
      84 *
        Math.pow(Math.sin(t * 3.8 + i * 0.39), 2) *
        (0.45 + 0.55 * Math.sin(i * 0.65) ** 2);
    s += rect(
      1080 + i * 14.5,
      615 - h / 2,
      7,
      h,
      i % 4 === 0 ? C.b : C.a,
      3,
      "none",
    );
  }
  s +=
    rect(1060, 716, 455, 74, "#ffffff07", 20) +
    icon(t < 3 ? "play" : "pause", 1108, 752, 31, C.a) +
    mono(
      "00:" + String(Math.floor(t * 1.5)).padStart(2, "0"),
      1210,
      760,
      23,
      C.white,
    ) +
    pill("x1.5", 1390, 730, 90, C.b);
  s +=
    pill("صوت ذكر", 488, 841, 180, t < 8 ? C.a : C.muted) +
    pill("صوت أنثى", 690, 841, 180, t >= 8 ? C.a : C.muted) +
    pill("عربي", 1110, 841, 150, C.a) +
    pill("English", 1280, 841, 160, C.muted);
  s += text("الأصوات واللغات المتاحة تعتمد على الجهاز", 1270, 698, 21, {
    color: C.muted,
  });
  return s;
}

// 05 — Twelve distinct SVG animations, then a hover/copy interaction.
export function sceneIcons(t: number) {
  let s = heading(
    "أيقونات SVG متحركة جاهزة",
    "06 / SMALL DETAILS. BIG PERSONALITY.",
    t,
  );
  s += panel(200, 295, 1520, 625, "UNITOOL / ANIMATED SVG");
  const names = [
    "heart",
    "bell",
    "loader",
    "check",
    "sparkles",
    "upload",
    "download",
    "code",
    "shield",
    "bolt",
    "settings",
    "search",
  ];
  for (let i = 0; i < 12; i++) {
    const row = Math.floor(i / 4),
      col = i % 4,
      x = 350 + col * 195,
      y = 445 + row * 165;
    const hover = i === 1 ? smooth((t - 3.5) / 0.5) : 0;
    s += pop(
      rect(
        -75,
        -63,
        150,
        126,
        i === 1 && t > 3.5 ? `${C.a}15` : "#ffffff05",
        20,
        i === 1 && t > 3.5 ? C.a : C.line,
      ) +
        icon(
          names[i],
          0,
          -6,
          52 * (1 + 0.15 * hover),
          i % 3 === 0 ? C.b : C.a,
          t + i * 0.17,
          true,
        ) +
        mono(names[i], 0, 43, 14),
      x,
      y,
      t,
      0.4 + i * 0.07,
    );
  }
  s +=
    rect(1135, 400, 510, 320, "#080f1d", 20) +
    mono("SVG / CSS", 1390, 445, 20, C.a);
  const code = [
    '<svg viewBox="0 0 24 24">',
    '  <path class="bell"',
    '    stroke="currentColor" />',
    "</svg>",
    "",
    ".bell {",
    "  animation: ring 1.2s ease;",
    "}",
  ];
  const visible = Math.floor(Math.max(0, t - 4) * 48);
  let remaining = visible;
  for (let i = 0; i < code.length; i++) {
    const v = code[i].slice(0, Math.max(0, remaining));
    remaining -= code[i].length;
    s += text(v, 1165, 482 + i * 25, 16, {
      mono: true,
      anchor: "start",
      color: i === 0 || i === 3 ? C.b : C.muted,
    });
  }
  s +=
    rect(
      1215,
      760,
      350,
      64,
      t > 8.8 ? `${C.green}20` : C.a,
      15,
      t > 8.8 ? C.green : "none",
    ) +
    text(t > 8.8 ? "تم النسخ ✓" : "انسخ الكود", 1390, 803, 29, {
      color: t > 8.8 ? C.green : "#09202d",
    });
  if (t < 6.5) s += cursor(t, [1045, 825], [545, 440], 2.5, 4.2);
  else s += cursor(t, [1320, 650], [1400, 783], 7.7, 8.6);
  return s;
}

// 06 — QR and image compression are existing tools; the others are a clearly labelled concept.
export function sceneMore(t: number) {
  let s = heading(
    "وأكتر من كده",
    "07 / YOUR EVERYDAY TOOLBOX",
    t,
    "تفاصيل صغيرة… بتوفّر عليك خطوات كتير",
  );
  const items = [
    ["qr", "QR Code"],
    ["image", "ضغط صور"],
    ["ruler", "محول وحدات"],
    ["lock", "مولد باسورد"],
    ["calc", "حاسبة"],
    ["json", "تنسيق JSON"],
  ];
  for (let i = 0; i < items.length; i++) {
    const x = 410 + (i % 3) * 550,
      y = 454 + Math.floor(i / 3) * 290;
    const pulse =
      1 +
      0.025 *
        Math.sin(Math.max(0, t - 0.6 - i * 0.18) * 4) *
        smooth((t - 0.6 - i * 0.18) / 0.4);
    s += pop(
      g(
        rect(-220, -102, 440, 205, "url(#glass)", 24) +
          icon(items[i][0], 0, -25, 62, i % 2 ? C.b : C.a) +
          text(items[i][1], 0, 62, 31),
        0,
        0,
        pulse,
      ),
      x,
      y,
      t,
      0.45 + i * 0.18,
    );
  }
  s += text(
    "مشهد تصوّري لأدوات إضافية • التوافر حسب إصدار الأداة",
    960,
    968,
    20,
    { color: C.muted },
  );
  return s;
}

// 07 — Calm logo resolve, editable real site address and a purposeful CTA pulse.
export function sceneCta(t: number) {
  let s = "";
  const p = inAt(t, 0.2, 0.9);
  s += g(mark(0, 0, 166, true), 960, 310, p, smooth((t - 0.2) / 0.3));
  s += g(
    text("Unitool.. جرّبه مجانًا", 960, 550, 81),
    0,
    16 * (1 - p),
    1,
    smooth((t - 0.5) / 0.4),
  );
  const url = CONFIG.site.slice(0, Math.floor(Math.max(0, t - 1.25) / 0.04));
  s += mono(url + (t > 1.25 && t < 2.6 ? "▏" : ""), 960, 632, 35, C.a);
  const pulse = 1 + 0.025 * Math.pow(Math.sin(t * 2.5), 2);
  s += g(
    rect(-170, -40, 340, 80, C.a, 22, "none") +
      text("ابدأ الآن", 0, 15, 38, { color: "#082633" }),
    960,
    757,
    pulse,
    smooth((t - 1.8) / 0.4),
  );
  s += g(
    text("شاركه مع حد محتاجه", 960, 925, 35, { color: C.muted }),
    0,
    0,
    1,
    smooth((t - 3) / 0.5),
  );
  return s;
}
export const SCENES = [
  sceneHook,
  scenePdf,
  sceneImages,
  sceneDesign,
  sceneAudio,
  sceneIcons,
  sceneMore,
  sceneCta,
];
export function render(t: number) {
  t = Math.max(0, Math.min(CONFIG.duration - 1 / CONFIG.fps, t));
  let index = TIMELINE.findIndex((s) => t >= s.start && t < s.end);
  if (index < 0) index = 7;
  const local = t - TIMELINE[index].start;
  const transition = smooth(local / 0.38);
  let content = "";
  if (index > 0 && local < 0.38)
    content += g(
      SCENES[index - 1](
        TIMELINE[index - 1].end - TIMELINE[index - 1].start - 0.38 + local,
      ),
      -28 * transition,
      0,
      1,
      1 - transition,
    );
  content += g(
    SCENES[index](local),
    28 * (1 - transition),
    0,
    1,
    index === 0 ? 1 : transition,
  );
  const dots = TIMELINE.map((_, i) => {
    const w = i === index ? 68 : 12;
    return {
      w,
      color: i <= index ? C.a : "#68748a",
      opacity: i === index ? 1 : i < index ? 0.45 : 0.35,
    };
  });
  const total = dots.reduce((n, d) => n + d.w + 15, 0) - 15;
  let x = 960 - total / 2;
  let progress = "";
  for (const d of dots) {
    progress += `<rect x="${x}" y="62" width="${d.w}" height="8" rx="4" fill="${d.color}" opacity="${d.opacity}"/>`;
    x += d.w + 15;
  }
  return `<svg id="film-svg" xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#090e1d"/><stop offset=".55" stop-color="#14152c"/><stop offset="1" stop-color="#102233"/></linearGradient><radialGradient id="halo"><stop stop-color="#7663dd" stop-opacity=".15"/><stop offset="1" stop-color="#7663dd" stop-opacity="0"/></radialGradient><linearGradient id="glass" x2=".7" y2="1"><stop stop-color="#27334e" stop-opacity=".64"/><stop offset="1" stop-color="#111b31" stop-opacity=".82"/></linearGradient><linearGradient id="brand" x2="1" y2="1"><stop stop-color="${C.a}"/><stop offset="1" stop-color="#8bb6ff"/></linearGradient><filter id="shadow" x="-25%" y="-25%" width="150%" height="165%"><feDropShadow dx="0" dy="16" stdDeviation="19" flood-color="#000" flood-opacity=".24"/></filter><filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="13"/></filter><pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse"><path d="M64 0H0V64" fill="none" stroke="#b8c5ff" stroke-opacity=".035"/></pattern></defs><rect width="1920" height="1080" fill="url(#bg)"/><ellipse cx="1200" cy="380" rx="970" ry="720" fill="url(#halo)"/><rect width="1920" height="1080" fill="url(#grid)"/>${content}${progress}${mark(104, 69, 48)}${text("Unitool", 225, 84, 38, { mono: true })}${mono("ONE WORKSPACE", 1650, 82, 17, C.muted)}${line(80, 1008, 1840, 1008, "#ffffff10", 1)}${mono(`${String(index + 1).padStart(2, "0")} / 08`, 126, 1047, 18)}${text("عرض توضيحي مبني بالكامل بالكود", 1710, 1047, 18, { color: C.muted })}</svg>`;
}

/** Original quiet ambient bed + deterministic UI sounds. No copyrighted audio. */
export function audioSample(time: number, music = true) {
  let sample = 0;
  if (music) {
    const chords = [
      [130.8128, 155.5635, 195.9977],
      [103.8262, 130.8128, 155.5635],
      [155.5635, 195.9977, 233.0819],
      [116.5409, 146.8324, 174.6141],
    ];
    const chord = chords[Math.floor(time / 8) % 4],
      p = time % 8;
    const env =
      smooth(p / 0.9) *
      smooth((8 - p) / 1.1) *
      smooth(time / 3) *
      smooth((92 - time) / 3);
    sample =
      (chord.reduce(
        (v, f) =>
          v +
          Math.sin(2 * Math.PI * f * time) +
          0.22 * Math.sin(2 * Math.PI * f * 2 * time),
        0,
      ) /
        4) *
      CONFIG.musicGain *
      env;
  }
  for (const cue of AUDIO_CUES) {
    const t = time - cue.at;
    if (t < 0 || t > 0.48) continue;
    if (cue.kind === "click")
      sample +=
        Math.sin(2 * Math.PI * (1050 * t - 1100 * t * t)) *
        Math.exp(-t * 80) *
        CONFIG.uiGain *
        0.45;
    else if (cue.kind === "pop")
      sample +=
        Math.sin(2 * Math.PI * (280 * t - 170 * t * t)) *
        Math.exp(-t * 23) *
        Math.min(1, t * 400) *
        CONFIG.uiGain *
        0.48;
    else {
      const notes = [523.25, 659.25, 783.99];
      for (let i = 0; i < 3; i++) {
        const n = t - i * 0.07;
        if (n >= 0)
          sample +=
            Math.sin(2 * Math.PI * notes[i] * n) *
            Math.exp(-n * 16) *
            Math.min(1, n * 350) *
            CONFIG.uiGain *
            0.25;
      }
    }
  }
  return Math.max(-0.9, Math.min(0.9, sample));
}

// Browser preview shell only. The renderer calls seekFrame(n), never wall-clock capture.
if (typeof window !== "undefined") {
  const host = document.getElementById("stage")!;
  let t = 0,
    playing = false,
    origin = 0,
    raf = 0,
    audio: AudioContext | null = null,
    node: AudioBufferSourceNode | null = null;
  let buffer: AudioBuffer | null = null;
  const draw = (seconds: number) => {
    t = seconds;
    host.innerHTML = render(t);
    const seek = document.getElementById("seek") as HTMLInputElement | null;
    if (seek) seek.value = String(t);
    const clock = document.getElementById("clock");
    if (clock) clock.textContent = `${t.toFixed(1)} / ${CONFIG.duration}s`;
  };
  const stop = () => {
    playing = false;
    cancelAnimationFrame(raf);
    try {
      node?.stop();
    } catch {}
    node = null;
    const b = document.getElementById("play");
    if (b) b.textContent = "تشغيل ▶";
  };
  const api = {
    CONFIG,
    TIMELINE,
    AUDIO_CUES,
    seekFrame: (frame: number) => {
      stop();
      draw(frame / CONFIG.fps);
    },
    seek: (seconds: number) => {
      stop();
      draw(seconds);
    },
    render,
    audioSample,
  };
  Object.assign(window, { UnitoolFilm: api });
  document.getElementById("play")?.addEventListener("click", async () => {
    if (playing) {
      stop();
      return;
    }
    if (t >= 91.96) t = 0;
    if ((document.getElementById("sound") as HTMLInputElement).checked) {
      audio ??= new AudioContext();
      await audio.resume();
      if (!buffer) {
        buffer = audio.createBuffer(1, Math.ceil(92 * 24000), 24000);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++)
          samples[i] = audioSample(i / 24000);
      }
      node = audio.createBufferSource();
      node.buffer = buffer;
      node.connect(audio.destination);
      node.start(0, t);
    }
    origin = performance.now() - t * 1000;
    playing = true;
    document.getElementById("play")!.textContent = "إيقاف ❚❚";
    const tick = (now: number) => {
      if (!playing) return;
      draw(Math.min(91.999, (now - origin) / 1000));
      if (t >= 91.99) {
        stop();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
  document.getElementById("seek")?.addEventListener("input", (e) => {
    stop();
    draw(+(e.target as HTMLInputElement).value);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  for (const scene of TIMELINE) {
    const button = document.createElement("button");
    button.textContent = `${scene.start}s · ${scene.title}`;
    button.onclick = () => api.seek(scene.sample);
    document.getElementById("chapters")?.appendChild(button);
  }
  draw(0);
}
