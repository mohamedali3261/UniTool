import { frame, type MotionDefinition } from "./types";
export const entryMotions: MotionDefinition[] = [
  {
    id: "enter-left",
    name: "دخول يسار",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: -18 * q, opacity: p });
    },
  },
  {
    id: "enter-right",
    name: "دخول يمين",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: 18 * q, opacity: p });
    },
  },
  {
    id: "enter-top",
    name: "دخول أعلى",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ y: -18 * q, opacity: p });
    },
  },
  {
    id: "enter-bottom",
    name: "دخول أسفل",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ y: 18 * q, opacity: p });
    },
  },
  {
    id: "enter-nw",
    name: "قطر علوي يسار",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: -15 * q, y: -15 * q, opacity: p });
    },
  },
  {
    id: "enter-ne",
    name: "قطر علوي يمين",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: 15 * q, y: -15 * q, opacity: p });
    },
  },
  {
    id: "enter-sw",
    name: "قطر سفلي يسار",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: -15 * q, y: 15 * q, opacity: p });
    },
  },
  {
    id: "enter-se",
    name: "قطر سفلي يمين",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ x: 15 * q, y: 15 * q, opacity: p });
    },
  },
  {
    id: "enter-grow",
    name: "نمو من المركز",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 0.55 + 0.45 * (1 - q), opacity: p });
    },
  },
  {
    id: "enter-settle",
    name: "استقرار من العمق",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1 + 0.6 * q, opacity: p });
    },
  },
  {
    id: "enter-spring",
    name: "نابض افتتاحي",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        scale: 1 - 0.35 * Math.exp(-6 * p) * Math.cos(p * 10),
        opacity: Math.min(1, p * 3),
      });
    },
  },
  {
    id: "enter-bounce",
    name: "ارتداد صاعد",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ y: -18 * Math.abs(Math.cos(p * 7)) * q, opacity: p });
    },
  },
  {
    id: "enter-arc",
    name: "قوس جانبي",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        x: -16 * q,
        y: -10 * Math.sin(p * Math.PI) * q,
        scale: 1 + 0.1 * q,
        opacity: p,
      });
    },
  },
  {
    id: "enter-land",
    name: "هبوط قوسي",
    category: "entry",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        x: 10 * Math.sin(p * Math.PI) * q,
        y: -20 * q,
        opacity: Math.sqrt(p),
      });
    },
  },
];
