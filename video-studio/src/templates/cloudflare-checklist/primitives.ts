import { uid, type TextLayer, type LayerFrame } from "../../types";
import { label, shape, type Element } from "../editable/build";
import { frame } from "../../animation/layerFrames";
export const C = {
  orange: "#f6821f",
  white: "#f3f1ee",
  muted: "#9ba6b5",
  panel: "#171e28",
  line: "#344152",
  green: "#69e5a0",
  red: "#ff6274",
  blue: "#7cb9ff",
};
export const k = frame;
export class Scene {
  layers: TextLayer[] = [];
  constructor(
    public at: number,
    public duration: number,
    public slug: string,
  ) {}
  add(element: Element, delay = 0, end = this.duration) {
    const layer: TextLayer = {
      id: uid(),
      start: this.at + delay,
      end: this.at + end,
      animationIn: "fade",
      animationOut: "fade",
      animationDuration: 0.18,
      ...element,
    };
    this.layers.push(layer);
    return layer;
  }
  text(
    name: string,
    text: string,
    x: number,
    y: number,
    size = 36,
    color = C.white,
    delay = 0,
    extra: Partial<TextLayer> = {},
  ) {
    return this.add(label(name, text, x, y, size, color, extra), delay);
  }
  box(
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fill = C.panel,
    radius = 18,
    delay = 0,
    extra: Partial<TextLayer> = {},
  ) {
    return this.add(shape(name, x, y, w, h, fill, radius, extra), delay);
  }
  header(step: string, title: string) {
    this.text("اسم الخطوة", step, 50, 15, 25, C.orange, 0, { font: "mono" });
    this.text("عنوان المشهد", title, 50, 22, 54, C.white, 0.08);
  }
  window(name: string, y: number, h: number, delay = 0) {
    this.box(name, 50, y, 800, h, C.panel, 24, delay, {
      box: {
        width: 800,
        height: h,
        radius: 24,
        borderWidth: 2,
        borderColor: C.line,
      },
    });
    [C.red, C.orange, C.green].forEach((color, i) =>
      this.box(
        `مؤشر نافذة ${name} ${i + 1}`,
        14 + i * 3.1,
        y - h / 34.14 + 2.8,
        13,
        13,
        color,
        7,
        delay,
      ),
    );
  }
  note(text: string) {
    this.text("ملاحظة توضيحية", text, 50, 84, 23, C.muted, 0.3);
  }
}
export function entranceSpring(): LayerFrame[] {
  return [
    k(0, { scaleX: 0.7, scaleY: 0.7, opacity: 0 }),
    k(0.55, { easing: "spring" }),
  ];
}
