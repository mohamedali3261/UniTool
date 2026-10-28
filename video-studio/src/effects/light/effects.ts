import type { EffectDefinition } from "../types";
export const lightEffects: EffectDefinition[] = [
  {
    id: "light-leak",
    name: "تسرّب ضوء",
    description: "ضوء دافئ ينساب من حافة المشهد",
    category: "light",
    kind: "effect",
    overlay: (ctx, { w, h, t, amount }) => {
      const x = w * (0.1 + 0.1 * Math.sin(t * 0.6));
      const g = ctx.createRadialGradient(x, h * 0.4, 0, x, h * 0.4, w * 0.9);
      g.addColorStop(0, `rgba(255,134,63,${0.48 * amount})`);
      g.addColorStop(0.5, `rgba(255,60,100,${0.15 * amount})`);
      g.addColorStop(1, "transparent");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "bloom",
    name: "وهج ذهبي",
    description: "هالة مضيئة تتحرك ببطء",
    category: "light",
    kind: "effect",
    overlay: (ctx, { w, h, t, amount }) => {
      const x = w * (0.6 + Math.sin(t * 0.4) * 0.15);
      const g = ctx.createRadialGradient(x, h * 0.2, 0, x, h * 0.2, w * 0.7);
      g.addColorStop(0, `rgba(255,230,163,${0.45 * amount})`);
      g.addColorStop(1, "transparent");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "vignette",
    animated: false,
    name: "تركيز",
    description: "ظلال خفيفة حول أطراف الكادر",
    category: "light",
    kind: "effect",
    overlay: (ctx, { w, h, amount }) => {
      const g = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.15,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.65,
      );
      g.addColorStop(0, "transparent");
      g.addColorStop(1, `rgba(0,0,0,${0.85 * amount})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "prism",
    name: "بريزم",
    description: "انعكاسات ألوان شفافة متحركة",
    category: "light",
    kind: "effect",
    overlay: (ctx, { w, h, t, amount }) => {
      const x = Math.sin(t * 0.5) * w * 0.2;
      const g = ctx.createLinearGradient(x, 0, w + x, h);
      g.addColorStop(0, `rgba(107,80,255,${0.25 * amount})`);
      g.addColorStop(0.5, "transparent");
      g.addColorStop(1, `rgba(244,142,68,${0.3 * amount})`);
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "spotlight",
    name: "سبوت لايت",
    description: "بقعة ضوء ناعمة تجول داخل المشهد",
    category: "light",
    kind: "effect",
    overlay: (ctx, { w, h, t, amount }) => {
      const x = w * (0.5 + 0.2 * Math.sin(t * 0.5));
      const g = ctx.createRadialGradient(
        x,
        h * 0.4,
        w * 0.05,
        x,
        h * 0.4,
        w * 0.7,
      );
      g.addColorStop(0, "transparent");
      g.addColorStop(1, `rgba(6,12,25,${0.6 * amount})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
  },
];
