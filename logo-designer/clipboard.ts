import { bounds, uid, type Element } from "./types";
/** حافظة داخل المحرر: نسخ عميق مع معرّفات ومجموعات جديدة لكل لصق. */
export function pasteNodes(
  source: Element[],
  at?: { x: number; y: number },
): Element[] {
  const b = bounds(source),
    dx = at ? at.x - (b.x + b.w / 2) : 24,
    dy = at ? at.y - (b.y + b.h / 2) : 24,
    groups = new Map<string, string>();
  return source.map((n) => {
    if (n.group && !groups.has(n.group)) groups.set(n.group, uid());
    return {
      ...structuredClone(n),
      id: uid(),
      group: n.group ? groups.get(n.group) : undefined,
      x: n.x + dx,
      y: n.y + dy,
      locked: false,
      hidden: false,
    };
  });
}
