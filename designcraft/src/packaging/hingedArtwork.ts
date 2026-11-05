import { hingedGeometry } from "./hinged";
import type { CartonSize } from "./geometry";
import type { ArtworkOptions } from "./artwork";
const PX = 96 / 25.4;
export function hingedArtwork(
  size: CartonSize,
  o: ArtworkOptions,
  theme: { background: string; ink: string; accent: string },
) {
  if (o.style === "blank") return [];
  const g = hingedGeometry(size),
    lid = g.faces.top,
    ink = o.stock === "kraft" ? "#38271e" : theme.ink,
    bg = o.stock === "kraft" ? "#bd945f" : theme.background,
    accent = o.accent;
  const objects: Record<string, any>[] = [];
  const add = (type: string, name: string, props: Record<string, any>) =>
    objects.push({
      type,
      version: "5.3.0",
      id: `art-hinged-${objects.length}`,
      name,
      originX: "left",
      originY: "top",
      selectable: true,
      evented: true,
      strokeWidth: 0,
      ...props,
    });
  const rect = (
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke?: string,
  ) =>
    add("rect", name, {
      left: x * PX,
      top: y * PX,
      width: w * PX,
      height: h * PX,
      fill,
      stroke: stroke || null,
      strokeWidth: stroke ? 0.35 * PX : 0,
    });
  const text = (
    name: string,
    value: string,
    x: number,
    y: number,
    w: number,
    font: number,
    color = ink,
    extra = {},
  ) =>
    add("textbox", name, {
      text: value,
      left: x * PX,
      top: y * PX,
      width: w * PX,
      fontSize: font * PX,
      fontFamily: "Arial",
      textAlign: "center",
      fill: color,
      ...extra,
    });
  rect("Board color / لون الورق", 0, 0, g.width, g.height, bg);
  const inset = Math.min(10, size.width * 0.04),
    unit = Math.min(size.width, size.depth);
  rect(
    "Lid border / إطار الغطاء",
    lid.x + inset,
    lid.y + inset,
    lid.width - inset * 2,
    lid.height - inset * 2,
    "transparent",
    accent,
  );
  if (size.family === "pizza") {
    const radius = unit * 0.17,
      cx = lid.x + lid.width / 2,
      cy = lid.y + lid.height * 0.32;
    add("circle", "Pizza mark / شعار البيتزا", {
      left: (cx - radius) * PX,
      top: (cy - radius) * PX,
      radius: radius * PX,
      fill: "transparent",
      stroke: accent,
      strokeWidth: unit * 0.009 * PX,
    });
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7,
        r = radius * 0.58;
      add("circle", "Printed topping / زخرفة مطبوعة", {
        left: (cx + Math.cos(angle) * r - unit * 0.014) * PX,
        top: (cy + Math.sin(angle) * r - unit * 0.014) * PX,
        radius: unit * 0.014 * PX,
        fill: accent,
      });
    }
  }
  text(
    "Brand / العلامة",
    o.brand,
    lid.x + lid.width * 0.1,
    lid.y + lid.height * (size.family === "pizza" ? 0.54 : 0.27),
    lid.width * 0.8,
    unit * 0.095,
    accent,
    { fontWeight: "bold" },
  );
  text(
    "Product / المنتج",
    o.product,
    lid.x + lid.width * 0.1,
    lid.y + lid.height * 0.69,
    lid.width * 0.8,
    unit * 0.035,
  );
  text(
    "Descriptor / وصف",
    o.quantity || o.descriptor || "MADE WITH CARE",
    lid.x + lid.width * 0.1,
    lid.y + lid.height * 0.8,
    lid.width * 0.8,
    unit * 0.022,
  );
  for (const id of ["front", "back"] as const) {
    const f = g.faces[id];
    text(
      id + " print",
      o.brand + " · " + o.product,
      f.x + f.width * 0.05,
      f.y + f.height * 0.3,
      f.width * 0.9,
      Math.min(f.height * 0.27, f.width * 0.025),
      accent,
      { fontWeight: "bold" },
    );
  }
  for (const id of ["left", "right"] as const) {
    const f = g.faces[id];
    text(
      id + " print",
      o.brand,
      f.x + f.width * 0.68,
      f.y + f.height * 0.1,
      f.height * 0.8,
      f.width * 0.27,
      accent,
      { angle: 90, fontWeight: "bold" },
    );
  }
  return objects;
}
