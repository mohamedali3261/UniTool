import type { EffectDefinition } from "../types";
export const retroEffects: EffectDefinition[] = [
  {
    id: "vintage",
    name: "ذكريات",
    description: "ألوان صورة قديمة بتشبع هادئ",
    css: "sepia(.65) contrast(.85)",
    category: "retro",
    kind: "filter",
  },
  {
    id: "film-grain",
    name: "حبوب فيلم",
    description: "ملمس فيلم حتمي وخفيف، بدون معالجة بكسلات",
    category: "retro",
    kind: "effect",
    overlay: (ctx, { w, h, t, amount }) => {
      const frame = Math.floor(t * 12);
      for (let i = 0; i < 65; i++) {
        const x = (((i * 137 + frame * 31) % 997) / 997) * w;
        const y = (((i * 263 + frame * 47) % 991) / 991) * h;
        ctx.fillStyle = `rgba(${i % 2 ? "255,241,212" : "0,0,0"},${0.13 * amount})`;
        ctx.fillRect(x, y, Math.max(1, w / 360), Math.max(1, h / 200));
      }
    },
  },
  {
    id: "scanlines",
    name: "شاشة قديمة",
    description: "خطوط مسح دقيقة بروح التلفزيون القديم",
    category: "retro",
    kind: "effect",
    overlay: (ctx, { w, h, t, amount }) => {
      ctx.fillStyle = `rgba(0,0,0,${0.2 * amount})`;
      const gap = Math.max(4, h / 100);
      for (let y = (t * 8) % gap; y < h; y += gap)
        ctx.fillRect(0, y, w, Math.max(1, h / 600));
    },
  },
  {
    id: "vhs",
    name: "شريط VHS",
    description: "انزلاق طفيف وخط تتبع متحرك",
    category: "retro",
    kind: "effect",
    camera: ({ t, amount, w }) => ({
      zoom: 1 + 0.025 * amount,
      x: Math.sin(t * 11) * w * 0.003 * amount,
    }),
    overlay: (ctx, { w, h, t, amount }) => {
      ctx.fillStyle = `rgba(210,240,255,${0.12 * amount})`;
      ctx.fillRect(0, ((t * 0.14) % 1) * h, w, Math.max(2, h * 0.015));
    },
  },
  {
    id: "rose-wash",
    animated: false,
    name: "ذاكرة وردية",
    description: "طبقة لونية وردية هادئة",
    category: "retro",
    kind: "effect",
    overlay: (ctx, { w, h, amount }) => {
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = `rgba(226,120,141,${0.65 * amount})`;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: "film-frame",
    animated: false,
    name: "إطار سينما",
    description: "شريطان سينمائيان بنسبة ثابتة",
    category: "retro",
    kind: "effect",
    overlay: (ctx, { w, h, amount }) => {
      ctx.fillStyle = "#08090b";
      ctx.fillRect(0, 0, w, h * 0.09 * amount);
      ctx.fillRect(0, h * (1 - 0.09 * amount), w, h * 0.09 * amount);
    },
  },
];
