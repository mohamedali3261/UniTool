/** Clearing all characters starts a fresh ordinary text run, without losing position/size. */
export function resetEmptyText(target: any, fill = "#0F172A") {
  if (
    !target ||
    !["textbox", "i-text", "text"].includes(target.type) ||
    target.text !== ""
  )
    return false;
  target.set({
    styles: {},
    fontFamily: "Cairo",
    fontWeight: 400,
    fontStyle: "normal",
    underline: false,
    overline: false,
    linethrough: false,
    fill,
    stroke: null,
    strokeWidth: 0,
    shadow: null,
    textBackgroundColor: "",
    backgroundColor: "",
    charSpacing: 0,
    deltaY: 0,
    path: null,
  });
  target._forceClearCache = true;
  target.dirty = true;
  if (typeof target.initDimensions === "function") target.initDimensions();
  return true;
}

export function normalTextFill(background: unknown) {
  if (typeof background !== "string") return "#0F172A";
  let h = background.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return "#0F172A";
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 135
    ? "#FFFFFF"
    : "#0F172A";
}
