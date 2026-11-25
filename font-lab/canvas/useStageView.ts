/** Coordinate maths for the outline stage: em units ⇄ screen pixels. */
import { useCallback, useMemo } from 'react';

export interface StageViewport {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  upm: number;
  padding: number;
}

export interface Mapper {
  toScreen: (x: number, y: number) => { x: number; y: number };
  toFont: (x: number, y: number) => { x: number; y: number };
  scale: number;
  originX: number;
  originY: number;
}

/** Fit-the-em scale: the em box always fits the viewport with breathing room. */
export function viewMapper({ width, height, zoom, pan, upm, padding }: StageViewport): Mapper {
  const usableWidth = Math.max(80, width - padding * 2);
  const usableHeight = Math.max(80, height - padding * 2);
  const base = Math.min(usableWidth / upm, usableHeight / upm);
  const scale = base * zoom;
  // the em box is centred: x=0 sits half an em left of the viewport centre
  const originX = width / 2 + pan.x - (upm / 2) * scale;
  const originY = height / 2 + pan.y + (upm / 2) * scale;
  return {
    scale,
    originX,
    originY,
    toScreen: (x, y) => ({ x: originX + x * scale, y: originY - y * scale }),
    toFont: (x, y) => ({ x: (x - originX) / scale, y: (originY - y) / scale }),
  };
}

export function useStageMapper(viewport: StageViewport) {
  return useMemo(() => viewMapper(viewport), [viewport.width, viewport.height, viewport.zoom, viewport.pan.x, viewport.pan.y, viewport.upm, viewport.padding]);
}

/** Wheel zoom that keeps the point under the cursor fixed. */
export function zoomAround(
  viewport: { zoom: number; pan: { x: number; y: number }; upm: number; padding: number; width: number; height: number },
  nextZoom: number,
  pointer: { x: number; y: number },
) {
  const before = viewMapper(viewport);
  const fontPoint = before.toFont(pointer.x, pointer.y);
  const after = viewMapper({ ...viewport, zoom: nextZoom });
  const target = after.toScreen(fontPoint.x, fontPoint.y);
  return {
    zoom: nextZoom,
    pan: {
      x: viewport.pan.x + (pointer.x - target.x),
      y: viewport.pan.y + (pointer.y - target.y),
    },
  };
}

export function useScreenToFont(viewport: StageViewport) {
  const mapper = useStageMapper(viewport);
  return useCallback((x: number, y: number) => mapper.toFont(x, y), [mapper]);
}
