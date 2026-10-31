import { frame, unit, type MotionDefinition } from "../types";
const families = [
  "مدار ثلاثي",
  "موجة مرنة",
  "قفزة نابضة",
  "كشف سينمائي",
  "اندفاع قطري",
  "تأرجح واسع",
  "نبض عدسة",
  "رحلة لولبية",
  "مسار درج",
  "انجراف تنفسي",
];
const variants = ["هادئ", "مرن", "سريع", "واسع", "عميق"];
/** Ten path families × five spatial/temporal treatments = fifty persisted presets. */
export const extendedMotions: MotionDefinition[] = families.flatMap((name, f) =>
  variants.map((v, i) => ({
    id: `extended-${f}-${i}`,
    name: `${name} — ${v}`,
    category: (f === 3 || f === 4
      ? "entry"
      : "loop") as MotionDefinition["category"],
    sample: (progress: number) => {
      const p = unit(progress),
        a = 3 + i * 2,
        t = p * Math.PI * 2 * (1 + i * 0.25),
        s = Math.sin(t),
        c = Math.cos(t);
      let x = 0,
        y = 0,
        scale = 1,
        opacity = 1;
      switch (f) {
        case 0:
          x = c * a;
          y = Math.sin(t * 2) * a * 0.6;
          scale = 1.05 + s * 0.03;
          break;
        case 1:
          x = Math.sin(t) * a;
          y = Math.sin(t * 3) * a * 0.4;
          break;
        case 2:
          y = -Math.abs(s) * a;
          scale = 1 + Math.abs(c) * (0.02 + i * 0.01);
          break;
        case 3:
          x = (1 - p) ** (2 + i * 0.3) * -a * 1.8;
          scale = 0.85 + 0.15 * p;
          opacity = Math.min(1, p * (3 + i));
          break;
        case 4:
          x = (1 - p) * a * 1.8;
          y = (1 - p) * -a * 1.5;
          opacity = Math.min(1, p * 5);
          break;
        case 5:
          x = s * a;
          y = (1 - c) * a * 0.5;
          break;
        case 6:
          scale = 1 + (0.03 + i * 0.02) * (1 - c);
          x = Math.sin(t * 0.5) * i;
          break;
        case 7:
          x = c * p * a;
          y = s * p * a;
          scale = 1 + p * 0.05;
          break;
        case 8:
          x = (Math.floor(p * (4 + i)) / (4 + i)) * a;
          y = Math.sin(p * Math.PI) * -a;
          break;
        case 9:
          x = s * a * 0.4;
          y = Math.cos(t * 0.5) * a * 0.5;
          scale = 1 + s * 0.02;
          break;
      }
      return frame({ x, y, scale, opacity });
    },
  })),
);
