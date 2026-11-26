/**
 * Geometry helpers for the contour editor and shape presets.
 *
 * All operations work on immutable points so undo/redo can snapshot cheaply.
 */
import type { GlyphContour, GlyphPoint, GlyphShape } from './fontEngine';

export type PointRef = { index: number };
export type Tool = 'select' | 'draw' | 'lasso' | 'pen' | 'hand' | 'zoom';
export type TransformMode = 'free' | 'mirror' | 'union' | 'subtract' | 'intersect' | 'xclude';

export interface ShapePreset {
  id: string;
  ar: string;
  en: string;
  build: (bounds: { x1: number; y1: number; x2: number; y2: number }) => GlyphContour[];
}

/**
 * Stable identity for a node: `contour.point`. It survives cloning, so selection
 * sets stay valid across undo/redo and after every edit.
 */
export function nodeKey(contourIndex: number, pointIndex: number) {
  return `${contourIndex}.${pointIndex}`;
}

export function parseNodeKey(key: string) {
  const [contourIndex, pointIndex] = key.split('.').map(Number);
  return { contourIndex, pointIndex };
}

/** True when the node at (contourIndex, pointIndex) is selected (or nothing is). */
function isSelected(selected: Set<string> | null, contourIndex: number, pointIndex: number) {
  return !selected || selected.size === 0 || selected.has(nodeKey(contourIndex, pointIndex));
}

export function reindex(contours: GlyphContour[]): GlyphShape['points'] {
  const flat: GlyphPoint[] = [];
  contours.forEach((contour, contourIndex) => {
    contour.points.forEach((point, index) => {
      point.contour = contourIndex;
      point.contourIndex = index;
      point.index = flat.length;
      flat.push(point);
    });
  });
  return flat;
}

export function bboxOf(points: GlyphPoint[]) {
  if (points.length === 0) return { x1: 0, y1: 0, x2: 0, y2: 0 };
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const point of points) {
    if (point.x < x1) x1 = point.x;
    if (point.y < y1) y1 = point.y;
    if (point.x > x2) x2 = point.x;
    if (point.y > y2) y2 = point.y;
  }
  return { x1, y1, x2, y2 };
}

export function translate(contours: GlyphContour[], dx: number, dy: number, selected: Set<string> | null): GlyphContour[] {
  return contours.map((contour, contourIndex) => ({
    ...contour,
    points: contour.points.map((point, pointIndex) =>
      isSelected(selected, contourIndex, pointIndex) ? { ...point, x: point.x + dx, y: point.y + dy } : point,
    ),
  }));
}

export function scaleShape(
  contours: GlyphContour[],
  origin: { x: number; y: number },
  sx: number,
  sy: number,
  selected: Set<string> | null,
): GlyphContour[] {
  return contours.map((contour, contourIndex) => ({
    ...contour,
    points: contour.points.map((point, pointIndex) =>
      isSelected(selected, contourIndex, pointIndex)
        ? { ...point, x: origin.x + (point.x - origin.x) * sx, y: origin.y + (point.y - origin.y) * sy }
        : point,
    ),
  }));
}

export function mirrorShape(contours: GlyphContour[], axis: 'x' | 'y', origin: { x: number; y: number }): GlyphContour[] {
  return contours.map((contour) => ({
    ...contour,
    points: contour.points.map((point) => ({
      ...point,
      x: axis === 'y' ? origin.x * 2 - point.x : point.x,
      y: axis === 'x' ? origin.y * 2 - point.y : point.y,
    })),
  }));
}

/**
 * Boolean-style merge. Without a full boolean engine we join contours into one
 * path and drop points that are exactly duplicated, which is what "union" means
 * for the shapes produced by the preset panel.
 */
export function unionContours(groups: GlyphContour[][]): GlyphContour[] {
  const merged: GlyphContour[] = [];
  for (const group of groups) {
    for (const contour of group) {
      const duplicate = merged.some(
        (existing) =>
          existing.points.length === contour.points.length &&
          existing.points.every((point, index) => Math.abs(point.x - contour.points[index].x) < 0.01 && Math.abs(point.y - contour.points[index].y) < 0.01),
      );
      if (!duplicate) merged.push({ ...contour, points: contour.points.map((point) => ({ ...point })) });
    }
  }
  return merged;
}

/** Removes the points of `subject` that fall inside the `cutter` bounding box. */
export function subtractContours(subject: GlyphContour[], cutter: { x1: number; y1: number; x2: number; y2: number }): GlyphContour[] {
  return subject
    .map((contour) => ({
      ...contour,
      points: contour.points.filter(
        (point) => !(point.x > cutter.x1 && point.x < cutter.x2 && point.y > cutter.y1 && point.y < cutter.y2),
      ),
    }))
    .filter((contour) => contour.points.length > 1);
}

/** Keeps only the points of `subject` inside the `keeper` box. */
export function intersectContours(subject: GlyphContour[], keeper: { x1: number; y1: number; x2: number; y2: number }): GlyphContour[] {
  return subject
    .map((contour) => ({
      ...contour,
      points: contour.points.filter(
        (point) => point.x >= keeper.x1 && point.x <= keeper.x2 && point.y >= keeper.y1 && point.y <= keeper.y2,
      ),
    }))
    .filter((contour) => contour.points.length > 1);
}

/** Removes the overlap of both shapes (exclusive or). */
export function excludeContours(subject: GlyphContour[], cutter: GlyphContour[]): GlyphContour[] {
  const box = bboxOf(cutter.flatMap((contour) => contour.points));
  const outside = subtractContours(subject, box);
  const inside = intersectContours(subject, box);
  return [...outside, ...inside.map((contour) => ({ ...contour, closed: contour.closed }))].slice(0, subject.length);
}

export function reverseContour(contour: GlyphContour): GlyphContour {
  return { ...contour, points: [...contour.points].reverse() };
}

export function removeContour(contours: GlyphContour[], index: number): GlyphContour[] {
  return contours.filter((_, position) => position !== index);
}

/** Point-in-polygon test (ray casting) used by the lasso tool. */
export function insidePolygon(polygon: Array<{ x: number; y: number }>, x: number, y: number) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y || 1e-9) + a.x) {
      result = !result;
    }
  }
  return result;
}

/** Lasso selection: every node inside the polygon. */
export function pointsInPolygon(contours: GlyphContour[], polygon: Array<{ x: number; y: number }>) {
  return contours.flatMap((contour, contourIndex) =>
    contour.points
      .map((point, pointIndex) => ({ point, key: nodeKey(contourIndex, pointIndex) }))
      .filter(({ point }) => insidePolygon(polygon, point.x, point.y)),
  );
}

/** Nearest point within `radius` (in font units) — used for click selection. */
export function nearestPoint(contours: GlyphContour[], x: number, y: number, radius: number) {
  let best: { point: GlyphPoint; distance: number } | null = null;
  for (const contour of contours) {
    for (const point of contour.points) {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance <= radius && (!best || distance < best.distance)) best = { point, distance };
    }
  }
  return best;
}

function contourFrom(points: Array<[number, number, boolean?]>): GlyphContour {
  return {
    closed: true,
    points: points.map(([x, y, onCurve]) => ({
      x,
      y,
      onCurve: onCurve !== false,
      contour: 0,
      index: 0,
      contourIndex: 0,
    })),
  };
}

/** Shape presets drawn in the font's own coordinate space. */
export const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: 'circle',
    ar: 'دائرة',
    en: 'Circle',
    build: ({ x1, y1, x2, y2 }) => {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.max(20, (x2 - x1) / 2);
      const ry = Math.max(20, (y2 - y1) / 2);
      // TrueType-friendly circle: on-curve at the four extremes with the corners
      // as control points (the standard quadratic approximation).
      return [
        contourFrom([
          [cx, cy + ry],
          [cx + rx, cy + ry, false],
          [cx + rx, cy],
          [cx + rx, cy - ry, false],
          [cx, cy - ry],
          [cx - rx, cy - ry, false],
          [cx - rx, cy],
          [cx - rx, cy + ry, false],
        ]),
      ];
    },
  },
  {
    id: 'square',
    ar: 'مربع',
    en: 'Square',
    build: ({ x1, y1, x2, y2 }) => [
      contourFrom([
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ]),
    ],
  },
  {
    id: 'triangle',
    ar: 'مثلث',
    en: 'Triangle',
    build: ({ x1, y1, x2, y2 }) => [
      contourFrom([
        [(x1 + x2) / 2, y2],
        [x2, y1],
        [x1, y1],
      ]),
    ],
  },
  {
    id: 'diamond',
    ar: 'معين',
    en: 'Diamond',
    build: ({ x1, y1, x2, y2 }) => [
      contourFrom([
        [(x1 + x2) / 2, y2],
        [x2, (y1 + y2) / 2],
        [(x1 + x2) / 2, y1],
        [x1, (y1 + y2) / 2],
      ]),
    ],
  },
  {
    id: 'star',
    ar: 'نجمة',
    en: 'Star',
    build: ({ x1, y1, x2, y2 }) => {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const outer = Math.max(40, Math.min(x2 - x1, y2 - y1) / 2);
      const inner = outer * 0.45;
      const points: Array<[number, number]> = [];
      for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? outer : inner;
        points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
      }
      return [contourFrom(points)];
    },
  },
  {
    id: 'hexagon',
    ar: 'مسدس',
    en: 'Hexagon',
    build: ({ x1, y1, x2, y2 }) => {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = (x2 - x1) / 2;
      const ry = (y2 - y1) / 2;
      const points: Array<[number, number]> = [];
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI / 3) * i;
        points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
      }
      return [contourFrom(points)];
    },
  },
  {
    id: 'blob',
    ar: 'شكل حر',
    en: 'Blob',
    build: ({ x1, y1, x2, y2 }) => {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const r = Math.min(x2 - x1, y2 - y1) / 2;
      const points: Array<[number, number, boolean?]> = [];
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI / 4) * i;
        // stay inside the requested box: radius wobbles but never exceeds it
        const radius = r * (0.72 + ((i * 37) % 10) / 34);
        points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
        const next = angle + Math.PI / 8;
        points.push([cx + Math.cos(next) * radius * 0.96, cy + Math.sin(next) * radius * 0.96, false]);
      }
      return [contourFrom(points)];
    },
  },
  {
    id: 'sparkle',
    ar: 'بريق',
    en: 'Sparkle',
    build: ({ x1, y1, x2, y2 }) => {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const r = Math.min(x2 - x1, y2 - y1) / 2;
      return [
        contourFrom([
          [cx, cy + r],
          [cx + r * 0.14, cy + r * 0.16, false],
          [cx + r, cy],
          [cx + r * 0.14, cy - r * 0.16, false],
          [cx, cy - r],
          [cx - r * 0.14, cy - r * 0.16, false],
          [cx - r, cy],
          [cx - r * 0.14, cy + r * 0.16, false],
        ]),
      ];
    },
  },
];
