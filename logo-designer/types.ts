/** نموذج مستقل: وحدات التصميم منطقية ولا تتأثر بتكبير اللوحة. */
export type Lang = "ar" | "en";
export type Element = {
  id: string;
  name: string;
  kind: "shape" | "icon" | "text" | "image" | "vector";
  asset: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  fill: string;
  fill2: string;
  gradient: boolean;
  stroke: string;
  strokeWidth: number;
  radius: number;
  shadow: number;
  blur: number;
  flipX: boolean;
  flipY: boolean;
  hidden: boolean;
  locked: boolean;
  group?: string;
  text: string;
  font: string;
  fontSize: number;
  weight: number;
  spacing: number;
  lineHeight: number;
  align: "start" | "middle" | "end";
  curve: number;
  paths?: { d: string; fill: string }[];
  reflection?: boolean;
  recolor?: boolean;
};
export type Project = {
  version: 1;
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  nodes: Element[];
  updated: number;
};
export const uid = () => crypto.randomUUID();
export function node(p: Partial<Element> = {}): Element {
  return {
    id: uid(),
    name: "Element",
    kind: "shape",
    asset: "circle",
    x: 400,
    y: 300,
    w: 160,
    h: 160,
    rotation: 0,
    opacity: 1,
    fill: "#71e3bf",
    fill2: "#758bff",
    gradient: false,
    stroke: "#122c33",
    strokeWidth: 0,
    radius: 20,
    shadow: 0,
    blur: 0,
    reflection: false,
    flipX: false,
    flipY: false,
    hidden: false,
    locked: false,
    text: "اسم علامتك",
    font: "cairo",
    fontSize: 52,
    weight: 400,
    spacing: 0,
    lineHeight: 1.4,
    align: "middle",
    curve: 0,
    ...p,
  };
}
export const blank = (): Project => ({
  version: 1,
  id: uid(),
  name: "Untitled brand",
  width: 800,
  height: 600,
  background: "",
  nodes: [],
  updated: Date.now(),
});
export function bounds(nodes: Element[]) {
  if (!nodes.length) return { x: 0, y: 0, w: 1, h: 1 };
  const minX = Math.min(...nodes.map((n) => n.x - n.w / 2)),
    minY = Math.min(...nodes.map((n) => n.y - n.h / 2));
  return {
    x: minX,
    y: minY,
    w: Math.max(...nodes.map((n) => n.x + n.w / 2)) - minX,
    h: Math.max(...nodes.map((n) => n.y + n.h / 2)) - minY,
  };
}
