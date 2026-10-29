import type { TextLayer } from "../../types";
export type TextPresetStyle = Pick<
  TextLayer,
  | "font"
  | "bold"
  | "size"
  | "color"
  | "background"
  | "outline"
  | "rotation"
  | "animationIn"
  | "animationOut"
  | "animationDuration"
  | "x"
  | "y"
>;
export type TextPreset = {
  id: string;
  name: string;
  text: string;
  category: string;
  style: TextPresetStyle;
};
/** Six editorial families, ten typographic layouts. All content is independently authored. */
export function buildPresets(
  category: string,
  family: number,
  entries: [string, string][],
): TextPreset[] {
  const palettes = [
    "#f5eee0",
    "#b7f568",
    "#ffd48b",
    "#f5b5cf",
    "#8fd9ff",
    "#e5c1ff",
  ];
  const sizes = [70, 42, 54, 62, 48, 36, 44, 58, 80, 40];
  const fonts = [
    "sans",
    "mono",
    "sans",
    "serif",
    "serif",
    "sans",
    "mono",
    "sans",
    "sans",
    "serif",
  ] as const;
  const motions = ["fade", "slide", "pop", "typewriter", "none"] as const;
  return entries.map(([name, text], i) => ({
    id: `${category}-${i + 1}`,
    category,
    name,
    text,
    style: {
      font: fonts[i],
      bold: i !== 3 && i !== 5 && i !== 9,
      size: sizes[i] + family * 2,
      color: i === 2 ? "#101820" : palettes[family],
      background:
        i === 2
          ? palettes[family]
          : i === 6
            ? "#13242e"
            : i === 7
              ? "#351e46"
              : undefined,
      outline: i === 4 || i === 8,
      rotation: i === 7 ? 356 : i === 1 ? 2 : 0,
      animationIn: motions[(i + family) % motions.length],
      animationOut: i % 2 ? "slide" : "fade",
      animationDuration: 0.45 + (i % 3) * 0.15,
      x: 50,
      y: i === 5 ? 84 : i === 1 ? 24 : 46 + family * 2,
    },
  }));
}
