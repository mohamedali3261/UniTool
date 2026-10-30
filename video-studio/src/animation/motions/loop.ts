import { frame, type MotionDefinition } from "./types";
export const loopMotions: MotionDefinition[] = [
  {
    id: "loop-orbit",
    name: "مدار بيضاوي",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: 3 * Math.cos(a), y: 2 * Math.sin(a), scale: 1.1 });
    },
  },
  {
    id: "loop-eight",
    name: "مسار رقم ثمانية",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: 4 * Math.sin(a), y: 2 * Math.sin(a * 2), scale: 1.12 });
    },
  },
  {
    id: "loop-wave",
    name: "موجة أفقية",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: (p - 0.5) * 8, y: 2 * Math.sin(a * 2), scale: 1.12 });
    },
  },
  {
    id: "loop-sway",
    name: "تمايل جانبي",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: 3 * Math.sin(a), scale: 1.08 });
    },
  },
  {
    id: "loop-float-up",
    name: "طفو رأسي",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ y: 3 * Math.cos(a), scale: 1.1 });
    },
  },
  {
    id: "loop-heartbeat",
    name: "نبضتان",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        scale:
          1 +
          0.07 * Math.pow(Math.sin(a), 8) +
          0.04 * Math.pow(Math.sin(a + 1), 12),
      });
    },
  },
  {
    id: "loop-breath",
    name: "تنفس عميق",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.05 + 0.05 * Math.sin(a) });
    },
  },
  {
    id: "loop-drift",
    name: "انجراف مزدوج",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        x: 2 * Math.sin(a),
        y: 3 * Math.cos(a * 0.5),
        scale: 1.12,
      });
    },
  },
  {
    id: "loop-hops",
    name: "قفزات متوالية",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ y: -5 * Math.abs(Math.sin(a * 2)), scale: 1.08 });
    },
  },
  {
    id: "loop-spiral",
    name: "حلزون",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        x: 4 * p * Math.cos(a * 2),
        y: 4 * p * Math.sin(a * 2),
        scale: 1.15,
      });
    },
  },
  {
    id: "loop-diamond",
    name: "مسار ماسي",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        x: 4 * (Math.abs(Math.sin(a)) - 0.5),
        y: 4 * (Math.abs(Math.cos(a)) - 0.5),
        scale: 1.1,
      });
    },
  },
  {
    id: "loop-sway-depth",
    name: "تمايل مع عمق",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: 3 * Math.sin(a), scale: 1.07 + 0.05 * Math.cos(a) });
    },
  },
  {
    id: "loop-pendulum",
    name: "بندول قوسي",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        x: 5 * Math.sin(a),
        y: 2 * (1 - Math.cos(a)),
        scale: 1.12,
      });
    },
  },
  {
    id: "loop-soft-opacity",
    name: "تلاشي تنفسي",
    category: "loop",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ opacity: 0.8 + 0.2 * Math.cos(a), scale: 1.02 });
    },
  },
];
