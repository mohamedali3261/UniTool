import { overlay, seed, phase, dot, line } from "../drawing";
const make = overlay.bind(null, "geometry");
export const geometryEffects = [
  make(
    "neon-border",
    "حدود نيون",
    "إطار مضيء متدرج اللون حول المشهد",
    (c, { t }) => {
      c.strokeStyle = `hsla(${(t * 15) % 360},90%,70%,.8)`;
      c.lineWidth = 0.008;
      c.strokeRect(0.025, 0.035, 0.95, 0.93);
      c.lineWidth = 0.002;
      c.strokeRect(0.04, 0.055, 0.92, 0.89);
    },
  ),
  make(
    "focus-reticle",
    "محدد التركيز",
    "مؤشرات زاوية تتحرك حول مركز الصورة",
    (c, { t }) => {
      const r = 0.18 + Math.sin(t) * 0.02;
      for (const x of [-1, 1])
        for (const y of [-1, 1]) {
          const px = 0.5 + x * r,
            py = 0.5 + y * r;
          line(c, px, py, px - x * 0.06, py, "#ffffffc0");
          line(c, px, py, px, py - y * 0.08, "#ffffffc0");
        }
      dot(c, 0.5, 0.5, 0.004, "#ffffffa0");
    },
  ),
  make(
    "horizon-grid",
    "شبكة الأفق",
    "خطوط منظور تتحرك باتجاه نقطة تلاشي",
    (c, { t }) => {
      for (let i = 0; i < 15; i++)
        line(c, 0.5, 0.45, (i - 2) / 10, 1, "#8dc9ff45");
      for (let i = 0; i < 9; i++) {
        const y = 0.46 + Math.pow(phase(t, 0.08, i), 2) * 0.54;
        line(c, 0, y, 1, y, "#8dc9ff70");
      }
    },
  ),
  make(
    "orbit-dots",
    "نقاط مدارية",
    "ثلاثة مدارات بيضاوية بنقاط متحركة",
    (c, { t }) => {
      for (let i = 0; i < 3; i++) {
        const r = 0.18 + i * 0.07;
        c.strokeStyle = "#f9ca7035";
        c.beginPath();
        c.ellipse(0.5, 0.5, r, r * 0.6, i * 0.5, 0, Math.PI * 2);
        c.stroke();
        const a = t * 0.5 + i * 2;
        dot(
          c,
          0.5 + Math.cos(a) * r,
          0.5 + Math.sin(a) * r * 0.6,
          0.008,
          "#ffdc91c0",
        );
      }
    },
  ),
  make(
    "radar-sweep",
    "مسح رادار",
    "دوائر مع شعاع مسح مستمر بلا وميض",
    (c, { t }) => {
      for (let i = 1; i < 5; i++) {
        c.strokeStyle = "#78faca35";
        c.beginPath();
        c.arc(0.5, 0.5, i * 0.095, 0, Math.PI * 2);
        c.stroke();
      }
      for (let i = 0; i < 18; i++) {
        const a = t * 0.6 - i * 0.014;
        line(
          c,
          0.5,
          0.5,
          0.5 + Math.cos(a) * 0.39,
          0.5 + Math.sin(a) * 0.39,
          `rgba(110,255,185,${0.3 - i * 0.015})`,
        );
      }
    },
  ),
  make(
    "hexagon-drift",
    "سداسيات",
    "أشكال سداسية مجوفة تطفو على الأطراف",
    (c, { t }) => {
      for (let i = 0; i < 14; i++) {
        const x = seed(i),
          y = phase(t, 0.035, i + 10),
          r = 0.025 + seed(i + 3) * 0.025;
        c.strokeStyle = "#a3d7ff60";
        c.beginPath();
        for (let j = 0; j < 6; j++) {
          const a = (j * Math.PI) / 3 + t * 0.1;
          j
            ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
            : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        c.closePath();
        c.stroke();
      }
    },
  ),
  make(
    "diagonal-ribbons",
    "شرائط قطرية",
    "شرائط شفافة تنزلق قطريًا",
    (c, { t }) => {
      for (let i = 0; i < 6; i++) {
        const x = phase(t, 0.04, i) * 1.8 - 0.4;
        c.fillStyle = i % 2 ? "#e3a5ff22" : "#83e0e52b";
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 0.06, 0);
        c.lineTo(x - 0.35, 1);
        c.lineTo(x - 0.41, 1);
        c.closePath();
        c.fill();
      }
    },
  ),
  make(
    "halftone-corners",
    "زوايا هالفتون",
    "نقاط طباعة تتدرج في زوايا الصورة",
    (c, { t }) => {
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8 - i; j++) {
          const r =
            0.003 + (0.007 - i * 0.0006) * (1 + Math.sin(t * 0.4)) * 0.5;
          dot(c, i * 0.027, j * 0.035, r, "#101c3480");
          dot(c, 1 - i * 0.027, 1 - j * 0.035, r, "#fff3da60");
        }
    },
  ),
  make(
    "blueprint-grid",
    "شبكة التصميم",
    "مربعات قياس مع محورين متحركين",
    (c, { t }) => {
      for (let i = 1; i < 12; i++) {
        line(c, i / 12, 0, i / 12, 1, "#abdff52c");
        line(c, 0, i / 12, 1, i / 12, "#abdff52c");
      }
      line(
        c,
        0.5 + Math.sin(t * 0.3) * 0.2,
        0,
        0.5 + Math.sin(t * 0.3) * 0.2,
        1,
        "#abdfffa0",
      );
    },
  ),
  make(
    "concentric-diamonds",
    "معينات متداخلة",
    "إطارات ماسية تتسع تدريجيًا",
    (c, { t }) => {
      for (let i = 0; i < 5; i++) {
        const r = 0.1 + phase(t, 0.08, i) * 0.65;
        c.strokeStyle = `rgba(231,195,255,${0.5 - r * 0.6})`;
        c.beginPath();
        c.moveTo(0.5, 0.5 - r);
        c.lineTo(0.5 + r, 0.5);
        c.lineTo(0.5, 0.5 + r);
        c.lineTo(0.5 - r, 0.5);
        c.closePath();
        c.stroke();
      }
    },
  ),
  make(
    "wave-ribbon",
    "شريط موجي",
    "موجة مزدوجة تلتف أسفل الصورة",
    (c, { t }) => {
      for (let k = 0; k < 2; k++) {
        c.strokeStyle = k ? "#a194ffc0" : "#78e7d9b0";
        c.lineWidth = 0.004;
        c.beginPath();
        for (let j = 0; j <= 60; j++) {
          const x = j / 60,
            y = 0.88 + Math.sin(x * 12 + t + k) * 0.035;
          j ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
    },
  ),
  make(
    "floating-triangles",
    "مثلثات عائمة",
    "مثلثات متفاوتة تدور ببطء",
    (c, { t }) => {
      for (let i = 0; i < 15; i++) {
        c.save();
        c.translate(seed(i), phase(t, 0.03, i + 20));
        c.rotate(t * 0.12 + i);
        c.strokeStyle = "#ffc6a080";
        c.beginPath();
        c.moveTo(0, -0.025);
        c.lineTo(0.022, 0.018);
        c.lineTo(-0.022, 0.018);
        c.closePath();
        c.stroke();
        c.restore();
      }
    },
  ),
  make(
    "dashed-orbit-frame",
    "إطار متقطع",
    "إطار منقط تتدفق علاماته حول الكادر",
    (c, { t }) => {
      c.strokeStyle = "#ffffffb0";
      c.setLineDash([0.014, 0.01]);
      c.lineDashOffset = -t * 0.025;
      c.strokeRect(0.045, 0.06, 0.91, 0.88);
    },
  ),
  make(
    "corner-brackets",
    "أقواس تحرير",
    "علامات قص هندسية عند أطراف الكادر",
    (c, { t }) => {
      const m = 0.055 + Math.sin(t * 0.4) * 0.005;
      c.lineWidth = 0.006;
      for (const x of [m, 1 - m])
        for (const y of [m, 1 - m]) {
          line(c, x, y, x + (x < 0.5 ? 0.1 : -0.1), y, "#b7f568b0");
          line(c, x, y, x, y + (y < 0.5 ? 0.12 : -0.12), "#b7f568b0");
        }
    },
  ),
  make(
    "constellation-links",
    "وصلات الكوكبات",
    "شبكة نجوم متصلة تنساب ببطء",
    (c, { t }) => {
      for (let i = 0; i < 22; i++) {
        const x = seed(i) + Math.sin(t * 0.2 + i) * 0.02,
          y = seed(i + 25);
        dot(c, x, y, 0.003, "#c3edffc0");
        if (i % 3 !== 0)
          line(
            c,
            x,
            y,
            seed(i - 1) + Math.sin(t * 0.2 + i - 1) * 0.02,
            seed(i + 24),
            "#acd4ff45",
          );
      }
    },
  ),
];
