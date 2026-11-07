import { SURFACE_PALETTES } from '../data/boardModes';
import type {
  BoardElement,
  BoardGrid,
  BoardSurface,
  LaserTrail,
  ShapeItem,
  StrokeItem,
  TextItem,
} from './types';

export const BOARD_LOGICAL_WIDTH = 1280;
export const BOARD_LOGICAL_HEIGHT = 720;

const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(dataUrl: string, onLoad?: () => void): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  const cached = imageCache.get(dataUrl);
  if (cached) return cached.complete ? cached : null;
  const img = new Image();
  img.onload = () => onLoad?.();
  img.src = dataUrl;
  imageCache.set(dataUrl, img);
  return null;
}

export function drawBoardBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  surface: BoardSurface,
  grid: BoardGrid
): void {
  const pal = SURFACE_PALETTES[surface] || SURFACE_PALETTES.white;
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  if (grid === 'lined') {
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1.2;
    const step = 42;
    for (let y = step * 1.5; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(w - 32, y);
      ctx.stroke();
    }
    // Margin line
    ctx.strokeStyle = pal.subLine;
    ctx.beginPath();
    ctx.moveTo(w - 76, 20);
    ctx.lineTo(w - 76, h - 20);
    ctx.stroke();
  } else if (grid === 'grid') {
    const step = 36;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    for (let x = step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (grid === 'dots') {
    const step = 34;
    ctx.fillStyle = pal.axis;
    ctx.globalAlpha = 0.34;
    for (let y = step; y < h; y += step) {
      for (let x = step; x < w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (grid === 'axes') {
    const step = 36;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    const cx = Math.round(w / 2);
    const cy = Math.round(h / 2);
    for (let x = cx % step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = cy % step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Bold X & Y Axes
    ctx.strokeStyle = pal.axis;
    ctx.fillStyle = pal.axis;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(28, cy);
    ctx.lineTo(w - 28, cy);
    ctx.moveTo(cx, 24);
    ctx.lineTo(cx, h - 24);
    ctx.stroke();

    // Ticks & numbers
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    let unit = 1;
    for (let x = cx + step; x < w - 40; x += step, unit++) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 4);
      ctx.lineTo(x, cy + 4);
      ctx.stroke();
      ctx.fillText(String(unit), x, cy + 16);
    }
    unit = -1;
    for (let x = cx - step; x > 40; x -= step, unit--) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 4);
      ctx.lineTo(x, cy + 4);
      ctx.stroke();
      ctx.fillText(String(unit), x, cy + 16);
    }
    unit = 1;
    for (let y = cy - step; y > 36; y -= step, unit++) {
      ctx.beginPath();
      ctx.moveTo(cx - 4, y);
      ctx.lineTo(cx + 4, y);
      ctx.stroke();
      ctx.fillText(String(unit), cx + 15, y + 4);
    }
    unit = -1;
    for (let y = cy + step; y < h - 36; y += step, unit--) {
      ctx.beginPath();
      ctx.moveTo(cx - 4, y);
      ctx.lineTo(cx + 4, y);
      ctx.stroke();
      ctx.fillText(String(unit), cx + 16, y + 4);
    }
  } else if (grid === 'english-4line') {
    const groupGap = 96;
    const lineGap = 16;
    for (let baseY = 72; baseY < h - 60; baseY += groupGap) {
      for (let i = 0; i < 4; i++) {
        const y = baseY + i * lineGap;
        ctx.beginPath();
        ctx.strokeStyle = i === 0 || i === 3 ? pal.subLine : pal.line;
        ctx.lineWidth = i === 2 ? 1.5 : 1;
        if (i === 1) ctx.setLineDash([6, 5]);
        else ctx.setLineDash([]);
        ctx.moveTo(36, y);
        ctx.lineTo(w - 36, y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
  } else if (grid === 'music') {
    const groupGap = 112;
    const lineGap = 11;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1.2;
    for (let baseY = 76; baseY < h - 64; baseY += groupGap) {
      for (let i = 0; i < 5; i++) {
        const y = baseY + i * lineGap;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(w - 40, y);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number
): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawStroke(ctx: CanvasRenderingContext2D, item: StrokeItem): void {
  if (item.points.length === 0) return;
  ctx.save();
  ctx.strokeStyle = item.color;
  ctx.fillStyle = item.color;
  ctx.lineCap = item.style === 'calligraphy' ? 'butt' : 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = item.style === 'highlighter' ? item.size * 3.2 : item.size;
  if (item.style === 'highlighter') ctx.globalAlpha = 0.34;
  if (item.style === 'dashed') ctx.setLineDash([item.size * 2.5, item.size * 1.8]);

  if (item.points.length === 1) {
    ctx.beginPath();
    ctx.arc(item.points[0].x, item.points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (item.style === 'calligraphy') {
    // Angled Arabic calligraphy nib ribbon
    const nib = item.size * 1.35;
    const dx = nib * Math.cos(Math.PI / 5);
    const dy = -nib * Math.sin(Math.PI / 5);
    ctx.beginPath();
    for (let i = 0; i < item.points.length - 1; i++) {
      const p1 = item.points[i];
      const p2 = item.points[i + 1];
      ctx.moveTo(p1.x - dx, p1.y - dy);
      ctx.lineTo(p1.x + dx, p1.y + dy);
      ctx.lineTo(p2.x + dx, p2.y + dy);
      ctx.lineTo(p2.x - dx, p2.y - dy);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(item.points[0].x, item.points[0].y);
  for (let i = 1; i < item.points.length - 1; i++) {
    const midX = (item.points[i].x + item.points[i + 1].x) / 2;
    const midY = (item.points[i].y + item.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(item.points[i].x, item.points[i].y, midX, midY);
  }
  const last = item.points[item.points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, item: ShapeItem): void {
  ctx.save();
  ctx.strokeStyle = item.color;
  ctx.fillStyle = item.color;
  ctx.lineWidth = item.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const { x, y, w, h, shapeType } = item;
  const rx = w >= 0 ? x : x + w;
  const ry = h >= 0 ? y : y + h;
  const rw = Math.abs(w);
  const rh = Math.abs(h);

  if (shapeType === 'line') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
  } else if (shapeType === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    drawArrowHead(ctx, x, y, x + w, y + h, Math.max(11, item.strokeWidth * 3.2));
  } else if (shapeType === 'rect') {
    ctx.beginPath();
    ctx.roundRect(rx, ry, Math.max(4, rw), Math.max(4, rh), 8);
    if (item.fill) {
      ctx.fillStyle = item.fill;
      ctx.fill();
    }
    ctx.stroke();
  } else if (shapeType === 'circle') {
    ctx.beginPath();
    ctx.ellipse(rx + rw / 2, ry + rh / 2, Math.max(4, rw / 2), Math.max(4, rh / 2), 0, 0, Math.PI * 2);
    if (item.fill) {
      ctx.fillStyle = item.fill;
      ctx.fill();
    }
    ctx.stroke();
  } else if (shapeType === 'triangle') {
    ctx.beginPath();
    ctx.moveTo(rx + rw / 2, ry);
    ctx.lineTo(rx + rw, ry + rh);
    ctx.lineTo(rx, ry + rh);
    ctx.closePath();
    ctx.stroke();
  } else if (shapeType === 'number-line') {
    const midY = ry + rh / 2;
    const x1 = rx;
    const x2 = rx + Math.max(120, rw);
    ctx.beginPath();
    ctx.moveTo(x1, midY);
    ctx.lineTo(x2, midY);
    ctx.stroke();
    drawArrowHead(ctx, x2 - 20, midY, x1, midY, 10);
    drawArrowHead(ctx, x1 + 20, midY, x2, midY, 10);
    const divisions = 10;
    const step = (x2 - x1 - 40) / divisions;
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= divisions; i++) {
      const tx = x1 + 20 + i * step;
      const val = i - 5;
      ctx.beginPath();
      ctx.moveTo(tx, midY - (val === 0 ? 10 : 6));
      ctx.lineTo(tx, midY + (val === 0 ? 10 : 6));
      ctx.stroke();
      ctx.fillText(String(val), tx, midY + 24);
    }
  } else if (shapeType === 'axes-shape') {
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    ctx.beginPath();
    ctx.moveTo(rx, cy);
    ctx.lineTo(rx + rw, cy);
    ctx.moveTo(cx, ry + rh);
    ctx.lineTo(cx, ry);
    ctx.stroke();
    drawArrowHead(ctx, rx, cy, rx + rw, cy, 10);
    drawArrowHead(ctx, cx, ry + rh, cx, ry, 10);
  }

  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const rawLine of text.split('\n')) {
    const words = rawLine.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && current) {
        result.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    result.push(current);
  }
  return result;
}

function drawTextCard(ctx: CanvasRenderingContext2D, item: TextItem): void {
  ctx.save();
  const isCard = item.kind === 'sticky' || item.kind === 'formula' || item.kind === 'stamp';
  const pad = isCard ? 14 : 4;

  if (isCard) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = item.bgColor || '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(item.x, item.y, item.w, item.h, item.kind === 'stamp' ? 999 : 14);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle =
      item.kind === 'formula' ? '#24795e' : 'rgba(0, 0, 0, 0.09)';
    ctx.lineWidth = item.kind === 'formula' ? 1.8 : 1;
    ctx.stroke();
  }

  ctx.fillStyle = item.color;
  const fontFamily =
    item.kind === 'formula'
      ? '"Cambria Math", "Segoe UI", system-ui, sans-serif'
      : 'Cairo, Tajawal, system-ui, sans-serif';
  ctx.font = `${item.kind === 'stamp' || item.kind === 'formula' ? 700 : 600} ${item.fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  const isRtl = /[\u0600-\u06FF]/.test(item.text) && item.kind !== 'formula';
  const lines = wrapLines(ctx, item.text, Math.max(60, item.w - pad * 2));
  const lineHeight = item.fontSize * 1.42;

  if (item.kind === 'stamp') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text, item.x + item.w / 2, item.y + item.h / 2);
  } else {
    ctx.textAlign = isRtl ? 'right' : 'left';
    const startX = isRtl ? item.x + item.w - pad : item.x + pad;
    lines.forEach((ln, idx) => {
      const ly = item.y + pad + idx * lineHeight;
      if (ly + item.fontSize <= item.y + item.h + 8) {
        ctx.fillText(ln, startX, ly);
      }
    });
  }

  ctx.restore();
}

export function getElementBounds(el: BoardElement): { x: number; y: number; w: number; h: number } {
  if (el.kind === 'stroke') {
    if (el.points.length === 0) return { x: 0, y: 0, w: 10, h: 10 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of el.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = el.size + 6;
    return {
      x: minX - pad,
      y: minY - pad,
      w: Math.max(16, maxX - minX + pad * 2),
      h: Math.max(16, maxY - minY + pad * 2),
    };
  }
  const rx = el.w >= 0 ? el.x : el.x + el.w;
  const ry = el.h >= 0 ? el.y : el.y + el.h;
  return {
    x: rx,
    y: ry,
    w: Math.max(18, Math.abs(el.w)),
    h: Math.max(18, Math.abs(el.h)),
  };
}

export function hitTestElement(elements: BoardElement[], px: number, py: number): BoardElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.kind === 'stroke') {
      const thresh = Math.max(12, el.size * 1.8);
      for (const pt of el.points) {
        if (Math.hypot(pt.x - px, pt.y - py) <= thresh) return el;
      }
    } else {
      const b = getElementBounds(el);
      if (px >= b.x - 6 && px <= b.x + b.w + 6 && py >= b.y - 6 && py <= b.y + b.h + 6) {
        return el;
      }
    }
  }
  return null;
}

export function translateElement(el: BoardElement, dx: number, dy: number): BoardElement {
  if (el.kind === 'stroke') {
    return {
      ...el,
      points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    };
  }
  return {
    ...el,
    x: el.x + dx,
    y: el.y + dy,
  };
}

export function renderSlideToContext(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  surface: BoardSurface,
  grid: BoardGrid,
  elements: BoardElement[],
  options?: {
    selectedId?: string | null;
    draftElement?: BoardElement | null;
    laserTrails?: LaserTrail[];
    now?: number;
    onAsyncAssetReady?: () => void;
  }
): void {
  drawBoardBackground(ctx, w, h, surface, grid);

  const all = options?.draftElement ? [...elements, options.draftElement] : elements;
  for (const el of all) {
    if (el.kind === 'stroke') {
      drawStroke(ctx, el);
    } else if (el.kind === 'shape') {
      drawShape(ctx, el);
    } else if (el.kind === 'image') {
      const img = getCachedImage(el.dataUrl, options?.onAsyncAssetReady);
      if (img) {
        ctx.drawImage(img, el.x, el.y, el.w, el.h);
      }
    } else {
      drawTextCard(ctx, el);
    }
  }

  if (options?.selectedId) {
    const sel = elements.find((e) => e.id === options.selectedId);
    if (sel) {
      const b = getElementBounds(sel);
      ctx.save();
      ctx.strokeStyle = '#24795e';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(b.x - 5, b.y - 5, b.w + 10, b.h + 10);
      ctx.setLineDash([]);
      ctx.fillStyle = '#24795e';
      for (const [hx, hy] of [
        [b.x - 5, b.y - 5],
        [b.x + b.w + 5, b.y - 5],
        [b.x - 5, b.y + b.h + 5],
        [b.x + b.w + 5, b.y + b.h + 5],
      ]) {
        ctx.beginPath();
        ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Fading glowing Laser Pointer trails
  if (options?.laserTrails && options.laserTrails.length > 0) {
    const now = options.now ?? performance.now();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const trail of options.laserTrails) {
      for (let i = 1; i < trail.points.length; i++) {
        const p0 = trail.points[i - 1];
        const p1 = trail.points[i];
        const age = now - p1.t;
        if (age > 1400) continue;
        const alpha = Math.max(0, 1 - age / 1400);
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.45})`;
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
