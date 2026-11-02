export function colName(index: number) {
  let s = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}
export const address = (row: number, col: number) => colName(col) + (row + 1);
export function position(ref: string) {
  const m = /^\$?([A-Z]+)\$?(\d+)$/i.exec(ref);
  if (!m) throw Error("Invalid cell");
  return {
    row: Number(m[2]) - 1,
    col:
      [...m[1].toUpperCase()].reduce(
        (n, c) => n * 26 + c.charCodeAt(0) - 64,
        0,
      ) - 1,
  };
}
export function bounds(a: string, b = a) {
  const p = position(a),
    q = position(b);
  return {
    r1: Math.min(p.row, q.row),
    r2: Math.max(p.row, q.row),
    c1: Math.min(p.col, q.col),
    c2: Math.max(p.col, q.col),
  };
}
export function refs(a: string, b = a) {
  const s = bounds(a, b),
    out: string[] = [];
  for (let r = s.r1; r <= s.r2; r++)
    for (let c = s.c1; c <= s.c2; c++) out.push(address(r, c));
  return out;
}
/** لا نغيّر مراجع داخل النصوص، ونحترم تثبيت الصف/العمود بعلامة $. */
export function shiftFormula(raw: string, dr: number, dc = 0) {
  if (!raw.startsWith("=")) return raw;
  return raw
    .split(/("(?:[^"]|"")*")/g)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(
            /(?<![\w.])(?<ca>\$?)(?<col>[A-Z]{1,3})(?<ra>\$?)(?<row>[1-9]\d*)(?![\w!])/g,
            (_, ca, col, ra, row) => {
              const p = position(col + row),
                r = p.row + (ra ? 0 : dr),
                c = p.col + (ca ? 0 : dc);
              return r < 0 || c < 0
                ? "#REF!"
                : `${ca}${colName(c)}${ra}${r + 1}`;
            },
          ),
    )
    .join("");
}
export function normalizeFormula(raw: string) {
  let quoted = false,
    depth = 0,
    out = "";
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (quoted && raw[i + 1] === '"') {
        out += '""';
        i++;
        continue;
      }
      quoted = !quoted;
    }
    if (!quoted) {
      if (c === "{") depth++;
      if (c === "}") depth--;
      if ((c === ";" && depth === 0) || c === "،") {
        out += ",";
        continue;
      }
    }
    out += c;
  }
  return out;
}
