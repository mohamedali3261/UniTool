/** Clearing all characters starts a fresh ordinary text run, without losing position/size. */
export function resetEmptyText(target: any, fill = "#000000") {
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

export function normalTextFill(_background: unknown) {
  return "#000000";
}
