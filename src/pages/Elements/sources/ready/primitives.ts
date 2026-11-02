import type { TextLayer } from "../../../../../video-studio/src/types";
export const label = (
  id: string,
  text: string,
  x = 50,
  y = 50,
  size = 40,
  color = "#e0f6ec",
): TextLayer => ({
  id,
  name: text,
  text,
  x,
  y,
  size,
  color,
  start: 0,
  end: 8,
  font: "sans",
  bold: true,
  animationIn: "none",
  animationOut: "none",
});
export const panel = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = "#173a38",
  radius = 20,
): TextLayer => ({
  ...label(id, "", x, y, 12, fill),
  name: id,
  background: fill,
  box: { width: w, height: h, radius },
});
export const palette = ["#73e4be", "#94aaff", "#ffc577", "#ff94b2", "#c4eb76"];
