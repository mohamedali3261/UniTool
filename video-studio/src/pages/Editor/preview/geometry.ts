export type Viewport = { zoom: number; x: number; y: number };
export const FIT_VIEW: Viewport = { zoom: 1, x: 0, y: 0 };
/** Display pixels only: composition coordinates and export dimensions never change. */
export function boundView(
  view: Viewport,
  frame: { width: number; height: number },
  area: { width: number; height: number },
): Viewport {
  const zoom = Math.max(
    0.25,
    Math.min(4, Number.isFinite(view.zoom) ? view.zoom : 1),
  );
  const maxX = Math.max(0, (frame.width * zoom - area.width) / 2);
  const maxY = Math.max(0, (frame.height * zoom - area.height) / 2);
  return {
    zoom,
    x: Math.max(-maxX, Math.min(maxX, view.x || 0)),
    y: Math.max(-maxY, Math.min(maxY, view.y || 0)),
  };
}
