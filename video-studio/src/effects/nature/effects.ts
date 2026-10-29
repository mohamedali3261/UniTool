import { overlay, seed, phase, dot, line, glow } from "../drawing";
const make = overlay.bind(null, "nature");
export const natureEffects = [
  make(
    "rain-curtain",
    "ستار المطر",
    "قطرات مائلة بطبقات سرعة مختلفة",
    (c, { t }) => {
      for (let i = 0; i < 60; i++) {
        const x = seed(i),
          y = phase(t, 0.4 + seed(i + 1) * 0.3, i + 2);
        line(c, x, y, x - 0.015, y + 0.065, "#d1eaff80");
      }
    },
  ),
  make(
    "snow-drift",
    "ثلج متهادي",
    "بلورات بيضاء تنجرف مع الريح",
    (c, { t }) => {
      for (let i = 0; i < 42; i++)
        dot(
          c,
          seed(i) + Math.sin(t + i) * 0.035,
          phase(t, 0.07, i + 10),
          0.002 + seed(i + 2) * 0.005,
          "#ffffffb0",
        );
    },
  ),
  make(
    "firefly-garden",
    "حديقة اليراعات",
    "نقاط ذهبية تطفو وتتوهج بهدوء",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 24; i++)
        glow(
          c,
          seed(i) + Math.sin(t * 0.4 + i) * 0.05,
          seed(i + 40) + Math.cos(t * 0.6 + i) * 0.06,
          0.018,
          `rgba(210,255,95,${0.25 + 0.2 * Math.sin(t + i)})`,
        );
    },
  ),
  make(
    "morning-mist",
    "ضباب الصباح",
    "سحب ضباب متدرجة تعبر أسفل الكادر",
    (c, { t }) => {
      for (let i = 0; i < 6; i++)
        glow(
          c,
          phase(t, 0.025, i) * 1.4 - 0.2,
          0.75 + Math.sin(i + t * 0.2) * 0.18,
          0.48,
          "#e9f5ff45",
        );
    },
  ),
  make(
    "star-map",
    "سماء النجوم",
    "نجوم متقاطعة فوق خلفية المشهد",
    (c, { t }) => {
      for (let i = 0; i < 32; i++) {
        const x = seed(i),
          y = seed(i + 20),
          r = 0.002 + (1 + Math.sin(t + i)) * 0.002;
        line(c, x - r, y, x + r, y, "#ffffdfb0");
        line(c, x, y - r * 2, x, y + r * 2, "#ffffdfb0");
      }
    },
  ),
  make(
    "soap-bubbles",
    "فقاعات صابون",
    "دوائر شفافة لامعة تصعد ببطء",
    (c, { t }) => {
      for (let i = 0; i < 14; i++) {
        const x = seed(i),
          y = 1 - phase(t, 0.06, i + 1),
          r = 0.015 + seed(i + 4) * 0.035;
        c.strokeStyle = "#bdeeff80";
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.stroke();
        dot(c, x - r * 0.3, y - r * 0.45, r * 0.18, "#ffffff80");
      }
    },
  ),
  make(
    "sakura-fall",
    "بتلات ساكورا",
    "بتلات وردية تدور أثناء السقوط",
    (c, { t }) => {
      c.fillStyle = "#ffa6caa0";
      for (let i = 0; i < 26; i++) {
        c.beginPath();
        c.ellipse(
          seed(i) + Math.sin(t + i) * 0.06,
          phase(t, 0.09, i + 9),
          0.007,
          0.015,
          t + i,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
    },
  ),
  make(
    "celebration-confetti",
    "قصاصات احتفال",
    "قصاصات ملونة بأشكال وزوايا متنوعة",
    (c, { t }) => {
      const colors = ["#ffcc66", "#8bf0d1", "#ec92ff", "#ff847c"];
      for (let i = 0; i < 40; i++) {
        c.save();
        c.translate(seed(i), phase(t, 0.15, i + 7));
        c.rotate(t * 0.6 + i);
        c.fillStyle = colors[i % 4];
        c.fillRect(-0.003, -0.008, 0.006, 0.016);
        c.restore();
      }
    },
  ),
  make(
    "floating-embers",
    "جمر طائر",
    "شرارات برتقالية تصعد من حواف الصورة",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 28; i++) {
        const y = 1 - phase(t, 0.17, i);
        glow(c, seed(i + 50) + Math.sin(t + i) * 0.02, y, 0.012, "#ff8833a0");
      }
    },
  ),
  make(
    "autumn-leaves",
    "أوراق الخريف",
    "أوراق مسننة في مسارات متعرجة",
    (c, { t }) => {
      for (let i = 0; i < 16; i++) {
        c.save();
        c.translate(
          seed(i) + Math.sin(t * 0.4 + i) * 0.08,
          phase(t, 0.065, i + 4),
        );
        c.rotate(t * 0.4 + i);
        c.fillStyle = i % 2 ? "#c77526b0" : "#d6a747b0";
        c.beginPath();
        c.moveTo(0, -0.023);
        c.lineTo(0.012, -0.005);
        c.lineTo(0.007, 0.015);
        c.lineTo(0, 0.025);
        c.lineTo(-0.013, 0);
        c.closePath();
        c.fill();
        c.restore();
      }
    },
  ),
  make(
    "water-rings",
    "دوائر الماء",
    "تموجات متسعة تتلاشى على سطح المشهد",
    (c, { t }) => {
      for (let i = 0; i < 6; i++) {
        const p = phase(t, 0.18, i);
        c.strokeStyle = `rgba(160,225,255,${(1 - p) * 0.5})`;
        c.beginPath();
        c.ellipse(
          seed(i + 3),
          seed(i + 30),
          p * 0.3 + 0.01,
          p * 0.12 + 0.004,
          0,
          0,
          Math.PI * 2,
        );
        c.stroke();
      }
    },
  ),
  make(
    "aurora-ribbon",
    "شفق قطبي",
    "ستائر خضراء وبنفسجية متموجة",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 35; i++) {
        const x = i / 34,
          y = 0.2 + Math.sin(x * 7 + t * 0.35) * 0.08;
        const g = c.createLinearGradient(0, y, 0, y + 0.35);
        g.addColorStop(0, i % 2 ? "#7d68ff55" : "#63ffbd66");
        g.addColorStop(1, "transparent");
        c.fillStyle = g;
        c.fillRect(x, y, 0.03, 0.35);
      }
    },
  ),
  make(
    "cloud-shadows",
    "ظلال السحاب",
    "كتل ظل ناعمة تتحرك فوق الصورة",
    (c, { t }) => {
      c.globalCompositeOperation = "multiply";
      for (let i = 0; i < 5; i++)
        glow(c, phase(t, 0.035, i) * 1.6 - 0.3, seed(i + 8), 0.36, "#26384b60");
    },
  ),
  make(
    "sun-shafts",
    "خيوط الشمس",
    "أشعة مائلة تخرج من أعلى الكادر",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 7; i++) {
        const x = 0.1 + i * 0.13 + Math.sin(t * 0.2) * 0.025;
        c.fillStyle = "#fff4b514";
        c.beginPath();
        c.moveTo(0.8, -0.1);
        c.lineTo(x - 0.035, 1);
        c.lineTo(x + 0.035, 1);
        c.closePath();
        c.fill();
      }
    },
  ),
  make(
    "underwater-caustics",
    "انعكاس تحت الماء",
    "شبكة انكسارات مائية متحركة",
    (c, { t }) => {
      c.globalCompositeOperation = "screen";
      for (let i = 0; i < 12; i++) {
        c.strokeStyle = "#6de5ed45";
        c.beginPath();
        for (let j = 0; j <= 32; j++) {
          const x = j / 32,
            y = i / 12 + Math.sin(x * 17 + t + i) * 0.025;
          j ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
    },
  ),
];
