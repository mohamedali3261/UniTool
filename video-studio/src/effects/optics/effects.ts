import { overlay, seed, phase, dot, line, glow } from "../drawing";
const make = overlay.bind(null, "optics");
export const opticsEffects = [
  make(
    "lens-flare-chain",
    "سلسلة العدسة",
    "انعكاسات عدسة متسلسلة عبر قطر الصورة",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      const x = 0.2 + Math.sin(t * 0.3) * 0.1;
      for (let i = 0; i < 7; i++)
        glow(
          c,
          x + i * 0.1,
          0.15 + i * 0.1,
          0.02 + i * 0.009,
          i % 2 ? "#ffb77d70" : "#92caff65",
        );
      glow(c, x, 0.15, 0.19, "#fff7d995");
    },
  ),
  make(
    "bokeh-circles",
    "بوكيه دائري",
    "دوائر عدسة كبيرة خارج نطاق التركيز",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 15; i++)
        glow(
          c,
          seed(i),
          phase(t, 0.018, i + 5),
          0.045 + seed(i + 8) * 0.06,
          i % 2 ? "#ffc4ac55" : "#a6ceff50",
        );
    },
  ),
  make(
    "anamorphic-streak",
    "شعاع أنامورفيك",
    "خط عدسة أزرق أفقي ناعم",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      const y = 0.35 + Math.sin(t * 0.35) * 0.15;
      const g = c.createLinearGradient(0, y - 0.035, 0, y + 0.035);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, "#acdfff95");
      g.addColorStop(1, "transparent");
      c.fillStyle = g;
      c.fillRect(0, y - 0.035, 1, 0.07);
      glow(c, 0.7, y, 0.12, "#d2edff90");
    },
  ),
  make(
    "rainbow-arc",
    "قوس طيفي",
    "طيف ملون منحني عند حافة الكادر",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      const colors = [
        "#ff68683b",
        "#ffcc683b",
        "#f2ff683b",
        "#68ffc43b",
        "#68c0ff3b",
        "#b868ff3b",
      ];
      colors.forEach((v, i) => {
        c.strokeStyle = v;
        c.lineWidth = 0.014;
        c.beginPath();
        c.arc(
          0.5,
          1.05,
          0.65 + i * 0.015 + Math.sin(t * 0.2) * 0.01,
          Math.PI,
          Math.PI * 2,
        );
        c.stroke();
      });
    },
  ),
  make(
    "iris-breath",
    "قزحية العدسة",
    "حواف دائرية تتنفس دون إخفاء المركز",
    (c, { t }) => {
      c.fillStyle = "#05091490";
      c.beginPath();
      c.rect(0, 0, 1, 1);
      c.arc(0.5, 0.5, 0.5 + Math.sin(t * 0.35) * 0.045, 0, Math.PI * 2, true);
      c.fill("evenodd");
    },
  ),
  make(
    "velvet-curtains",
    "ستائر مخملية",
    "ظلال جانبية مطوية تتمايل",
    (c, { t }) => {
      for (const side of [0, 1])
        for (let i = 0; i < 9; i++) {
          const width = 0.012 + Math.sin(t * 0.3 + i) * 0.003;
          c.fillStyle = `rgba(25,8,36,${0.5 - i * 0.045})`;
          c.fillRect(side ? 1 - i * 0.015 - width : i * 0.015, 0, width, 1);
        }
    },
  ),
  make(
    "radial-speed",
    "خطوط السرعة",
    "أشعة قصيرة تمتد من أطراف الكادر",
    (c, { t }) => {
      for (let i = 0; i < 34; i++) {
        const a = (i / 34) * Math.PI * 2,
          r = 0.47 + phase(t, 0.25, i) * 0.15;
        line(
          c,
          0.5 + Math.cos(a) * r,
          0.5 + Math.sin(a) * r,
          0.5 + Math.cos(a) * (r + 0.14),
          0.5 + Math.sin(a) * (r + 0.14),
          "#ffffff55",
        );
      }
    },
  ),
  make(
    "soft-window",
    "ضوء الشباك",
    "ظل نافذة مستطيلة بضوء منتشر",
    (c, { t }) => {
      c.globalCompositeOperation = "multiply";
      c.fillStyle = "#33435635";
      const x = Math.sin(t * 0.15) * 0.03;
      for (let i = 0; i < 4; i++) c.fillRect(x + i * 0.28, 0, 0.025, 1);
      c.fillRect(0, 0.36, 1, 0.035);
      c.fillRect(0, 0.73, 1, 0.035);
    },
  ),
  make(
    "mirror-shards",
    "شظايا مرآة",
    "مثلثات لامعة رقيقة على الحواف",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 10; i++) {
        const y = seed(i),
          x = i % 2 ? 1 : 0;
        c.fillStyle = `rgba(200,220,255,${0.06 + 0.04 * Math.sin(t * 0.4 + i)})`;
        c.beginPath();
        c.moveTo(x, y - 0.2);
        c.lineTo(x + (x ? -0.15 : 0.15), y);
        c.lineTo(x, y + 0.22);
        c.closePath();
        c.fill();
      }
    },
  ),
  make(
    "cinema-gate",
    "بوابة الفيلم",
    "حواف شريط فيلم بفتحات جانبية",
    (c, { t }) => {
      c.fillStyle = "#0b101bd0";
      c.fillRect(0, 0, 0.04, 1);
      c.fillRect(0.96, 0, 0.04, 1);
      for (let i = 0; i < 12; i++) {
        const y = phase(t, 0.045, i);
        c.fillStyle = "#d9d4b1b0";
        c.fillRect(0.01, y, 0.018, 0.035);
        c.fillRect(0.972, y, 0.018, 0.035);
      }
    },
  ),
  make(
    "glass-sweep",
    "مسحة زجاج",
    "لمعة قطرية واسعة تمر فوق الصورة",
    (c, { t }) => {
      const x = phase(t, 0.09, 0) * 2 - 0.5;
      const g = c.createLinearGradient(x, 0, x + 0.3, 0);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, "#dbeeff40");
      g.addColorStop(1, "transparent");
      c.save();
      c.transform(1, 0, -0.3, 1, 0, 0);
      c.fillStyle = g;
      c.fillRect(x, 0, 0.3, 1);
      c.restore();
    },
  ),
  make(
    "soft-spot-cluster",
    "بقع المسرح",
    "ثلاثة منابع ضوء ملونة متقاطعة",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 3; i++)
        glow(
          c,
          0.2 + i * 0.3 + Math.sin(t * 0.2 + i) * 0.1,
          0.1,
          0.38,
          ["#ff83bf40", "#79eaff40", "#ffc97140"][i],
        );
    },
  ),
  make(
    "edge-chroma",
    "حواف كروماتية",
    "حافتان لونيّتان متقابلتان تنزلقان بهدوء",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (const side of [0, 1]) {
        const g = c.createLinearGradient(side, 0, side ? 0.82 : 0.18, 0);
        g.addColorStop(0, side ? "#ff447d70" : "#48dcff70");
        g.addColorStop(1, "transparent");
        c.fillStyle = g;
        c.fillRect(side ? 0.8 : 0, 0, 0.2, 1);
      }
      c.globalAlpha *= 0.4;
      line(
        c,
        0,
        0.5 + Math.sin(t) * 0.02,
        1,
        0.5 + Math.sin(t) * 0.02,
        "#cb93ff60",
      );
    },
  ),
  make(
    "comet-trails",
    "ذيول المذنبات",
    "آثار ضوئية تمر عبر السماء",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 5; i++) {
        const p = phase(t, 0.1, i),
          x = p * 1.4 - 0.2,
          y = seed(i + 6) * 0.55;
        c.lineWidth = 0.003;
        for (let j = 0; j < 10; j++)
          line(
            c,
            x - j * 0.01,
            y - j * 0.006,
            x - (j + 1) * 0.01,
            y - (j + 1) * 0.006,
            `rgba(209,239,255,${0.65 - j * 0.06})`,
          );
        dot(c, x, y, 0.004, "#effaffd0");
      }
    },
  ),
  make(
    "paper-texture",
    "نسيج الورق",
    "ألياف دقيقة ثابتة تتحرك كطبعة عضوية",
    (c, { t }) => {
      for (let i = 0; i < 75; i++) {
        const x = seed(i),
          y = seed(i + 100) + Math.sin(t * 0.1) * 0.002;
        line(
          c,
          x,
          y,
          x + 0.008 + seed(i + 1) * 0.015,
          y + 0.001,
          i % 2 ? "#fff0bc25" : "#37251d25",
        );
      }
    },
  ),
];
