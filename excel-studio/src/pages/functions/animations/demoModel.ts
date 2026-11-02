import type { FormulaLesson } from "./types";
export function cellPosition(ref: string) {
  const match = /^([A-D])([1-3])$/.exec(ref);
  if (!match) throw Error("Invalid demo cell");
  return { col: match[1].charCodeAt(0) - 65, row: Number(match[2]) - 1 };
}
export function demoFrame(
  lesson: FormulaLesson,
  index: number,
  progress: number,
) {
  const action = lesson.demo[index];
  const p = Math.max(0, Math.min(1, progress));
  let formula = lesson.demo
    .slice(0, index)
    .map((a) => a.text || "")
    .join("");
  if (action.kind === "type")
    formula += (action.text || "").slice(
      0,
      Math.floor((action.text || "").length * p),
    );

  let point = { col: 3, row: 1 };
  let range: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = null;
  if (action.kind === "click") point = { col: 3, row: 1 - p };
  if (action.kind === "select") {
    const start = cellPosition(action.fromCell!),
      end = cellPosition(action.toCell!);
    point = {
      col: start.col + (end.col - start.col) * p,
      row: start.row + (end.row - start.row) * p,
    };
    const current =
      String.fromCharCode(65 + Math.round(point.col)) +
      (Math.round(point.row) + 1);
    formula +=
      current === action.fromCell ? current : action.fromCell + ":" + current;
    range = {
      left: Math.min(start.col, point.col) * 25,
      top: (Math.min(start.row, point.row) * 100) / 3,
      width: (Math.abs(point.col - start.col) + 1) * 25,
      height: ((Math.abs(point.row - start.row) + 1) * 100) / 3,
    };
  }
  const done = action.kind === "enter" && p >= 0.55;
  return {
    formula,
    done,
    point: { x: (point.col + 0.5) * 25, y: ((point.row + 0.5) * 100) / 3 },
    range,
  };
}
