/** Render only a buffered ruler window, including hours into long projects. */
export function rulerTicks(
  width: number,
  zoom: number,
  bucket: number,
  viewport: number,
) {
  const step = zoom < 25 ? 5 : zoom < 55 ? 2 : 1;
  const first = Math.max(0, Math.floor((bucket * 600 - 600) / zoom / step));
  const count = Math.min(500, Math.ceil((viewport + 1800) / zoom / step) + 2);
  return Array.from({ length: count }, (_, i) => (first + i) * step).filter(
    (t) => t * zoom <= width,
  );
}
