export type Lang = "ar" | "en";
export interface Design {
  text: string;
  signature: string;
  font: "cairo" | "amiri" | "changa" | "noto";
  weight: 400 | 700;
  size: number;
  lineHeight: number;
  spacing: number;
  align: "left" | "center" | "right";
  direction: "auto" | "rtl" | "ltr";
  color: string;
  color2: string;
  textGradient: boolean;
  background: "solid" | "gradient" | "transparent";
  bg: string;
  bg2: string;
  effect: "none" | "shadow" | "glow" | "outline";
  decoration: "none" | "orbit" | "frame" | "dots";
  width: number;
  height: number;
  padding: number;
  autoFit: boolean;
}
export const defaults: Design = {
  text: "كل فكرة عظيمة\nتبدأ بكلمة.",
  signature: "اكتب شيئًا يستحق أن يُرى",
  font: "cairo",
  weight: 700,
  size: 88,
  lineHeight: 1.6,
  spacing: 0,
  align: "center",
  direction: "auto",
  color: "#f5e8cf",
  color2: "#b3f1dd",
  textGradient: false,
  background: "solid",
  bg: "#172d29",
  bg2: "#132b45",
  effect: "none",
  decoration: "orbit",
  width: 1080,
  height: 1080,
  padding: 100,
  autoFit: true,
};
const choices = {
  font: ["cairo", "amiri", "changa", "noto"],
  align: ["left", "center", "right"],
  direction: ["auto", "rtl", "ltr"],
  background: ["solid", "gradient", "transparent"],
  effect: ["none", "shadow", "glow", "outline"],
  decoration: ["none", "orbit", "frame", "dots"],
} as const;
const ranges = {
  size: [16, 180],
  lineHeight: [1, 2.2],
  spacing: [0, 8],
  width: [320, 2048],
  height: [320, 2048],
  padding: [24, 160],
} as const;
/** Strict, versioned, allowlisted project input; never execute imported markup. */
export function parseProject(input: unknown): Design {
  if (!input || typeof input !== "object" || (input as any).version !== 1)
    throw Error("VERSION");
  const d = (input as any).design;
  if (!d || typeof d !== "object") throw Error("DESIGN");
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Design)[]) {
    const value = d[key];
    if (key === "text" || key === "signature") {
      if (
        typeof value !== "string" ||
        value.length > (key === "text" ? 1500 : 100)
      )
        throw Error(key);
      (result as any)[key] = value;
    } else if (key in choices) {
      if (!(choices as any)[key].includes(value)) throw Error(key);
      (result as any)[key] = value;
    } else if (key in ranges) {
      const [min, max] = (ranges as any)[key];
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < min ||
        value > max
      )
        throw Error(key);
      (result as any)[key] = ["width", "height", "padding", "size"].includes(
        key,
      )
        ? Math.round(value)
        : value;
    } else if (["color", "color2", "bg", "bg2"].includes(key)) {
      if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value))
        throw Error(key);
      (result as any)[key] = value;
    } else if (key === "weight") {
      if (value !== 400 && value !== 700) throw Error(key);
      result.weight = value;
    } else {
      if (typeof value !== "boolean") throw Error(key);
      (result as any)[key] = value;
    }
  }
  return result;
}
export const serializeProject = (design: Design) =>
  JSON.stringify({ version: 1, design }, null, 2);
export function textDirection(text: string, choice: Design["direction"]) {
  if (choice !== "auto") return choice;
  for (const char of text) {
    if (char === "ـ" || !/\p{Letter}/u.test(char)) continue;
    return /[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(char) ? "rtl" : "ltr";
  }
  return "rtl";
}
export function statistics(text: string) {
  return {
    characters: Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    ).length,
    words: Array.from(
      new Intl.Segmenter(undefined, { granularity: "word" }).segment(text),
    ).filter((x) => x.isWordLike).length,
    lines: text ? text.split("\n").length : 0,
  };
}
export type CleanAction =
  "spaces" | "diacritics" | "tatweel" | "upper" | "lower";
export function cleanText(text: string, action: CleanAction) {
  switch (action) {
    case "spaces":
      return text
        .split("\n")
        .map((s) => s.replace(/[^\S\n]+/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    case "diacritics":
      return text.replace(
        /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g,
        "",
      );
    case "tatweel":
      return text.replace(/\u0640/g, "");
    case "upper":
      return text.toLocaleUpperCase();
    case "lower":
      return text.toLocaleLowerCase();
  }
}
