export function fittedInitialZoom(width: number, height: number, availableWidth: number, availableHeight: number) {
  return Math.max(.01, Math.min(.9, availableWidth / width, availableHeight / height));
}
/** Count UTF-16 string storage conservatively; keep one oversized current state. */
export function boundedHistory(stack: string[], index: number, snapshot: string, budget = 24 * 1024 * 1024) {
  const next = stack.slice(0, index + 1);
  if (next[next.length - 1] === snapshot) return next;
  next.push(snapshot);
  let bytes = next.reduce((sum, item) => sum + item.length * 2, 0);
  while (next.length > 1 && (next.length > 30 || bytes > budget)) bytes -= next.shift()!.length * 2;
  return next;
}
