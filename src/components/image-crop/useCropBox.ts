import { useCallback, useEffect, useRef, useState } from 'react';

export interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DisplaySize {
  width: number;
  height: number;
}

type DragState = { type: 'move' | 'resize'; handle: string } | null;
type DragStart = { startX: number; startY: number; box: CropBox } | null;

const MIN_CROP_SIZE = 20;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const defaultBox = (width: number, height: number): CropBox => ({
  x: Math.round(width * 0.08),
  y: Math.round(height * 0.08),
  width: Math.round(width * 0.84),
  height: Math.round(height * 0.84),
});

export function useCropBox() {
  const [box, setBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState<DisplaySize>({ width: 0, height: 0 });
  const [drag, setDrag] = useState<DragState>(null);
  const dragStart = useRef<DragStart>(null);

  const reset = useCallback(() => {
    setDisplaySize({ width: 0, height: 0 });
    setBox({ x: 0, y: 0, width: 0, height: 0 });
  }, []);

  const init = useCallback((rect: DOMRect) => {
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width === 0 || height === 0) return;
    setDisplaySize({ width, height });
    setBox(defaultBox(width, height));
  }, []);

  const startDrag = useCallback((e: React.PointerEvent, type: 'move' | 'resize', handle = '') => {
    if (displaySize.width === 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragStart.current = { startX: e.clientX, startY: e.clientY, box: { ...box } };
    setDrag({ type, handle });
  }, [box, displaySize.width]);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const start = dragStart.current;
      if (!start) return;
      const { width: dsW, height: dsH } = displaySize;
      if (dsW === 0 || dsH === 0) return;
      const dx = e.clientX - start.startX;
      const dy = e.clientY - start.startY;
      const b = start.box;

      if (drag.type === 'move') {
        setBox({
          ...b,
          x: clamp(b.x + dx, 0, dsW - b.width),
          y: clamp(b.y + dy, 0, dsH - b.height),
        });
        return;
      }

      let nx = b.x;
      let ny = b.y;
      let nw = b.width;
      let nh = b.height;
      const h = drag.handle;
      if (h.includes('e')) nw = clamp(b.width + dx, MIN_CROP_SIZE, dsW - b.x);
      if (h.includes('s')) nh = clamp(b.height + dy, MIN_CROP_SIZE, dsH - b.y);
      if (h.includes('w')) {
        nw = clamp(b.width - dx, MIN_CROP_SIZE, b.x + b.width);
        nx = b.x + b.width - nw;
      }
      if (h.includes('n')) {
        nh = clamp(b.height - dy, MIN_CROP_SIZE, b.y + b.height);
        ny = b.y + b.height - nh;
      }
      setBox({ x: nx, y: ny, width: nw, height: nh });
    };
    const end = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, [drag, displaySize]);

  const outputSize = (naturalWidth: number, naturalHeight: number) => ({
    width: displaySize.width > 0 ? Math.max(1, Math.round(box.width * naturalWidth / displaySize.width)) : 0,
    height: displaySize.height > 0 ? Math.max(1, Math.round(box.height * naturalHeight / displaySize.height)) : 0,
  });

  const toSourceRect = (naturalWidth: number, naturalHeight: number) => {
    if (displaySize.width === 0 || displaySize.height === 0) return null;
    const scaleX = naturalWidth / displaySize.width;
    const scaleY = naturalHeight / displaySize.height;
    const x = Math.max(0, Math.round(box.x * scaleX));
    const y = Math.max(0, Math.round(box.y * scaleY));
    return {
      x,
      y,
      width: Math.min(naturalWidth - x, Math.max(1, Math.round(box.width * scaleX))),
      height: Math.min(naturalHeight - y, Math.max(1, Math.round(box.height * scaleY))),
    };
  };

  return { box, displaySize, drag, reset, init, startDrag, outputSize, toSourceRect };
}

export function cropImageElement(
  img: HTMLImageElement,
  rect: { x: number; y: number; width: number; height: number },
): { dataUrl: string; sizeBytes: number } | null {
  if (rect.width < 1 || rect.height < 1) return null;
  const canvas = document.createElement('canvas');
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  const dataUrl = canvas.toDataURL('image/png');
  const sizeBytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
  return { dataUrl, sizeBytes };
}
