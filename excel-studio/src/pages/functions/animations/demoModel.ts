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
  const action = lesson.demo[index],
    p = Math.max(0, Math.min(1, progress));
  let formula = lesson.demo
    .slice(0, index)
    .map((a) => a.text || "")
    .join("");
  let previous = { col: 3, row: 1 };
  for (const a of lesson.demo.slice(0, index)) {
    if (a.kind === "click") previous = cellPosition(a.cell || "D1");
    if (a.kind === "select") previous = cellPosition(a.toCell!);
  }
  let point = previous;
  let range: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = null;
  const reference = lesson.demo
    .slice(0, index)
    .reverse()
    .find((a) => a.kind === "select");
  if (reference && action.kind !== "click" && action.kind !== "select") {
    const start = cellPosition(reference.fromCell!),
      end = cellPosition(reference.toCell!);
    range = {
      left: Math.min(start.col, end.col) * 25,
      top: (Math.min(start.row, end.row) * 100) / 3,
      width: (Math.abs(end.col - start.col) + 1) * 25,
      height: ((Math.abs(end.row - start.row) + 1) * 100) / 3,
    };
  }
  const lerp = (a: typeof point, b: typeof point, t: number) => ({
    col: a.col + (b.col - a.col) * t,
    row: a.row + (b.row - a.row) * t,
  });
  const ease = (t: number) => t * t * (3 - 2 * t);
  if (action.kind === "click")
    point = lerp(
      previous,
      cellPosition(action.cell || "D1"),
      ease(Math.min(1, p / 0.65)),
    );
  if (action.kind === "type")
    formula += (action.text || "").slice(
      0,
      Math.floor((action.text || "").length * p),
    );
  if (action.kind === "select") {
    const start = cellPosition(action.fromCell!),
      end = cellPosition(action.toCell!);
    // First move to the range, then hold the mouse and drag. Typing keeps the pointer still.
    point =
      p < 0.2
        ? lerp(previous, start, ease(p / 0.2))
        : lerp(start, end, (p - 0.2) / 0.8);
    if (p >= 0.2) {
      const col = Math.round(point.col),
        row = Math.round(point.row),
        current = String.fromCharCode(65 + col) + (row + 1);
      formula +=
        current === action.fromCell ? current : action.fromCell + ":" + current;
      range = {
        left: Math.min(start.col, col) * 25,
        top: (Math.min(start.row, row) * 100) / 3,
        width: (Math.abs(col - start.col) + 1) * 25,
        height: ((Math.abs(row - start.row) + 1) * 100) / 3,
      };
    }
  }
  const done = action.kind === "enter" && p >= 0.55;
  if (done) range = null;
  return {
    formula,
    done,
    point: { x: (point.col + 0.5) * 25, y: ((point.row + 0.5) * 100) / 3 },
    range,
  };
}
