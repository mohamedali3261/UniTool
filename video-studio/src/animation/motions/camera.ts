import { frame, type MotionDefinition } from "./types";
export const cameraMotions: MotionDefinition[] = [
  {
    id: "push-in",
    name: "اقتراب بطيء",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1 + p * 0.18 });
    },
  },
  {
    id: "pull-out",
    name: "ابتعاد بطيء",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.18 - p * 0.18 });
    },
  },
  {
    id: "pan-left",
    name: "تحريك لليسار",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.15, x: (0.5 - p) * 10 });
    },
  },
  {
    id: "pan-right",
    name: "تحريك لليمين",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.15, x: (p - 0.5) * 10 });
    },
  },
  {
    id: "camera-up",
    name: "صعود الكاميرا",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.2, y: (0.5 - p) * 14 });
    },
  },
  {
    id: "camera-down",
    name: "هبوط الكاميرا",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.2, y: (p - 0.5) * 14 });
    },
  },
  {
    id: "camera-nw",
    name: "رحلة للشمال الغربي",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.22, x: (0.5 - p) * 12, y: (0.5 - p) * 9 });
    },
  },
  {
    id: "camera-se",
    name: "رحلة للجنوب الشرقي",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.22, x: (p - 0.5) * 12, y: (p - 0.5) * 9 });
    },
  },
  {
    id: "camera-ne",
    name: "رحلة للشمال الشرقي",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.22, x: (p - 0.5) * 12, y: (0.5 - p) * 9 });
    },
  },
  {
    id: "camera-sw",
    name: "رحلة للجنوب الغربي",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.22, x: (0.5 - p) * 12, y: (p - 0.5) * 9 });
    },
  },
  {
    id: "camera-ease-zoom",
    name: "اقتراب متسارع",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1 + p * p * 0.35 });
    },
  },
  {
    id: "camera-reveal",
    name: "كشف بانورامي",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1.4 - 0.4 * Math.sqrt(p), x: 8 * (1 - p) });
    },
  },
  {
    id: "camera-rise-depth",
    name: "صعود إلى العمق",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({ scale: 1 + p * 0.3, y: -7 * p * p });
    },
  },
  {
    id: "camera-arc-zoom",
    name: "اقتراب مقوّس",
    category: "camera",
    sample: (p) => {
      const q = Math.pow(1 - p, 3),
        a = p * Math.PI * 2;
      return frame({
        scale: 1 + p * 0.22,
        x: 5 * Math.sin(p * Math.PI),
        y: -3 * p,
      });
    },
  },
];
