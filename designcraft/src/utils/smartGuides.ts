export interface GuideBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SmartGuide {
  axis: 'x' | 'y';
  position: number;
  source: 'canvas' | 'object';
}

export interface SnapResult {
  dx: number;
  dy: number;
  guides: SmartGuide[];
}

/** All coordinates and the tolerance are in design pixels, never screen pixels. */
export function calculateSnap(
  bounds: GuideBounds,
  targets: GuideBounds[],
  canvasWidth: number,
  canvasHeight: number,
  tolerance = 6,
): SnapResult {
  const moving = {
    x: [bounds.left, bounds.left + bounds.width / 2, bounds.left + bounds.width],
    y: [bounds.top, bounds.top + bounds.height / 2, bounds.top + bounds.height],
  };
  const fixed = {
    x: [0, canvasWidth / 2, canvasWidth],
    y: [0, canvasHeight / 2, canvasHeight],
  };
  for (const target of targets) {
    fixed.x.push(target.left, target.left + target.width / 2, target.left + target.width);
    fixed.y.push(target.top, target.top + target.height / 2, target.top + target.height);
  }

  const nearest = (axis: 'x' | 'y') => {
    let best: { delta: number; position: number; distance: number } | null = null;
    for (const position of fixed[axis]) {
      for (const anchor of moving[axis]) {
        const distance = Math.abs(position - anchor);
        if (distance <= tolerance && (!best || distance < best.distance)) {
          best = { delta: position - anchor, position, distance };
        }
      }
    }
    return best;
  };
  const x = nearest('x');
  const y = nearest('y');
  const isCanvas = (axis: 'x' | 'y', position: number) =>
    [0, (axis === 'x' ? canvasWidth : canvasHeight) / 2, axis === 'x' ? canvasWidth : canvasHeight].includes(position);

  return {
    dx: x?.delta ?? 0,
    dy: y?.delta ?? 0,
    guides: [
      ...(x ? [{ axis: 'x' as const, position: x.position, source: isCanvas('x', x.position) ? 'canvas' as const : 'object' as const }] : []),
      ...(y ? [{ axis: 'y' as const, position: y.position, source: isCanvas('y', y.position) ? 'canvas' as const : 'object' as const }] : []),
    ],
  };
}

/** Paint on a separate overlay so guides can never leak into PNG/SVG/PDF exports. */
export function paintGuides(
  context: CanvasRenderingContext2D,
  guides: SmartGuide[],
  width: number,
  height: number,
  zoom: number,
  pixelRatio = 1,
) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width * zoom * pixelRatio, height * zoom * pixelRatio);
  context.setTransform(zoom * pixelRatio, 0, 0, zoom * pixelRatio, 0, 0);
  context.lineWidth = 1 / zoom;
  context.setLineDash([4 / zoom, 3 / zoom]);
  for (const guide of guides) {
    context.strokeStyle = guide.source === 'canvas' ? '#e879f9' : '#0891b2';
    context.beginPath();
    if (guide.axis === 'x') {
      context.moveTo(guide.position, 0);
      context.lineTo(guide.position, height);
    } else {
      context.moveTo(0, guide.position);
      context.lineTo(width, guide.position);
    }
    context.stroke();
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
}
