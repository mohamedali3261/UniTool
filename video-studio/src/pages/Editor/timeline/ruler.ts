/** Render only a buffered ruler window, including hours into long projects. */
export function rulerTicks(
  width: number,
  zoom: number,
  bucket: number,
  viewport: number,
) {
  // Keep labels readable even when fitting hours into a narrow mobile viewport.
  const step =
    zoom >= 55
      ? 1
      : zoom >= 25
        ? 2
        : [5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600, 7200].find(
            (s) => s * zoom >= 40,
          ) || 7200;
  const first = Math.max(0, Math.floor((bucket * 600 - 600) / zoom / step));
  const count = Math.min(500, Math.ceil((viewport + 1800) / zoom / step) + 2);
  return Array.from({ length: count }, (_, i) => (first + i) * step).filter(
    (t) => t * zoom <= width,
  );
}
