export type EffectCategory =
  | "cinematic"
  | "color"
  | "motion"
  | "light"
  | "retro"
  | "nature"
  | "geometry"
  | "optics";
export type Frame = {
  w: number;
  h: number;
  t: number;
  progress: number;
  amount: number;
};
export type Camera = { zoom?: number; x?: number; y?: number; rotate?: number };
export type EffectDefinition = {
  id: string;
  name: string;
  description: string;
  category: EffectCategory;
  kind: "filter" | "effect";
  css?: string;
  animated?: boolean;
  camera?: (f: Frame) => Camera;
  overlay?: (ctx: CanvasRenderingContext2D, f: Frame) => void;
};
