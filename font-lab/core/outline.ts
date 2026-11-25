/**
 * Outline editing — the geometry layer between the parsed font and the canvas.
 *
 * Contours are the editable truth (on/off curve points). This module converts
 * them back into path commands, applies node operations (add / delete / smooth /
 * simplify / align / distribute) and renders SVG path data for the stage.
 */
import type { GlyphContour, GlyphPoint, GlyphShape } from './fontEngine';
import { bboxOf, nodeKey, reindex } from './geometry';

export interface PathCommand {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

const round = (value: number, precision = 100) => Math.round(value * precision) / precision;

/** Rotates a closed contour so it starts on an on-curve point (TTF requirement). */
export function startOnCurve(contour: GlyphContour): GlyphPoint[] {
  const points = contour.points;
  const firstOn = points.findIndex((point) => point.onCurve);
  if (firstOn <= 0) return points;
  return [...points.slice(firstOn), ...points.slice(0, firstOn)];
}

/**
 * Converts one contour to `M/L/Q` commands.
 * A run of two off-curve points gets the implied on-curve midpoint inserted,
 * which is how TrueType stores rounded shapes.
 */
export function contourCommands(contour: GlyphContour): PathCommand[] {
  const points = contour.closed ? startOnCurve(contour) : contour.points;
  if (points.length === 0) return [];
  const commands: PathCommand[] = [];
  const start = points[0];
  commands.push({ type: 'M', x: round(start.x), y: round(start.y) });

  if (!contour.closed) {
    for (let index = 1; index < points.length; index += 1) {
      const point = points[index];
      if (point.onCurve) commands.push({ type: 'L', x: round(point.x), y: round(point.y) });
      else commands.push({ type: 'Q', x1: round(point.x), y1: round(point.y), x: round(point.x), y: round(point.y) });
    }
    return commands;
  }

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (current.onCurve) {
      if (index === 0) continue; // already moved to the start point
      commands.push({ type: 'L', x: round(current.x), y: round(current.y) });
      continue;
    }
    // current is a control point: draw a quadratic ending on next on-curve point
    // (or on the implied midpoint when the next point is also a control point).
    if (next.onCurve) {
      commands.push({ type: 'Q', x1: round(current.x), y1: round(current.y), x: round(next.x), y: round(next.y) });
    } else {
      commands.push({
        type: 'Q',
        x1: round(current.x),
        y1: round(current.y),
        x: round((current.x + next.x) / 2),
        y: round((current.y + next.y) / 2),
      });
    }
  }

  // Close back to the start point when the loop did not land on it.
  const last = points[points.length - 1];
  if (points.length > 1 && last.onCurve && (Math.abs(last.x - start.x) > 0.01 || Math.abs(last.y - start.y) > 0.01)) {
    const hasStart = commands.some(
      (command, index) => index > 0 && (command.type === 'L' || command.type === 'Q') && command.x === round(start.x) && command.y === round(start.y),
    );
    if (!hasStart) commands.push({ type: 'L', x: round(start.x), y: round(start.y) });
  }

  commands.push({ type: 'Z' });
  return commands;
}

export function contoursToCommands(contours: GlyphContour[]): PathCommand[] {
  return contours.flatMap((contour) => contourCommands(contour));
}

/**
 * Path data in raw font coordinates (y up). The stage wraps this in a
 * `translate(origin) scale(s, -s)` group so nodes and outlines always share one
 * transform; standalone previews use `contoursToPathData` below (y flipped).
 */
export function contoursToRawPathData(contours: GlyphContour[]): string {
  return contours
    .map((contour) => {
      const points = contour.closed ? startOnCurve(contour) : contour.points;
      if (points.length === 0) return '';
      let data = `M${round(points[0].x)} ${round(points[0].y)}`;
      for (const command of contourCommands({ ...contour, points })) {
        if (command.type === 'Q') data += `Q${command.x1} ${command.y1} ${command.x} ${command.y}`;
        else if (command.type === 'L') data += `L${command.x} ${command.y}`;
      }
      return `${data}Z`;
    })
    .filter(Boolean)
    .join('');
}

/** SVG path data (y flipped) for previews that use a `0 0 upm upm` viewBox. */
export function contoursToPathData(contours: GlyphContour[], upm: number): string {
  const flip = (y: number) => round(upm - y);
  return contours
    .map((contour) => {
      const points = contour.closed ? startOnCurve(contour) : contour.points;
      if (points.length === 0) return '';
      let data = `M${round(points[0].x)} ${flip(points[0].y)}`;
      const segments = contourCommands({ ...contour, points });
      for (const command of segments) {
        if (command.type === 'Q') data += `Q${command.x1} ${flip(command.y1!)} ${command.x} ${flip(command.y!)}`;
        else if (command.type === 'L') data += `L${command.x} ${flip(command.y!)}`;
      }
      return `${data}Z`;
    })
    .filter(Boolean)
    .join('');
}

/** Rebuilds the flat point list + bbox after an edit. */
export function normalizeShape(shape: GlyphShape): GlyphShape {
  const contours = shape.contours.filter((contour) => contour.points.length > 1);
  const points = reindex(contours);
  return {
    ...shape,
    contours,
    points,
    bbox: bboxOf(points),
    commands: contourCommandsList(contours),
  };
}

function contourCommandsList(contours: GlyphContour[]): string {
  return contoursToCommands(contours).map(commandToString).join('');
}

function commandToString(command: PathCommand): string {
  switch (command.type) {
    case 'M':
    case 'L':
      return `${command.type}${round(command.x ?? 0)} ${round(command.y ?? 0)}`;
    case 'Q':
      return `Q${round(command.x1 ?? 0)} ${round(command.y1 ?? 0)} ${round(command.x ?? 0)} ${round(command.y ?? 0)}`;
    case 'C':
      return `C${round(command.x1 ?? 0)} ${round(command.y1 ?? 0)} ${round(command.x2 ?? 0)} ${round(command.y2 ?? 0)} ${round(command.x ?? 0)} ${round(command.y ?? 0)}`;
    default:
      return 'Z';
  }
}

export function deletePoint(contours: GlyphContour[], contourIndex: number, pointIndex: number): GlyphContour[] {
  return contours
    .map((contour, index) =>
      index === contourIndex
        ? { ...contour, points: contour.points.filter((_, position) => position !== pointIndex) }
        : contour,
    )
    .filter((contour) => contour.points.length > 1);
}

/** Deletes every selected node; its contour is dropped when fewer than 2 remain. */
export function deletePoints(contours: GlyphContour[], selected: Set<string>): GlyphContour[] {
  return contours
    .map((contour, contourIndex) => ({
      ...contour,
      points: contour.points.filter((_, pointIndex) => !selected.has(nodeKey(contourIndex, pointIndex))),
    }))
    .filter((contour) => contour.points.length > 1);
}

/** TrueType curve type that matches a node (for the inspector). */
export function nodeType(point: GlyphPoint): 'corner' | 'curve' | 'control' {
  return point.onCurve ? 'corner' : 'control';
}

let synthetic = 0;
function newPoint(x: number, y: number, onCurve: boolean): GlyphPoint {
  synthetic += 1;
  return { x, y, onCurve, contour: 0, index: synthetic, contourIndex: 0 };
}

/**
 * Adds a node in the middle of a segment. When the segment is a quadratic the
 * split uses the de Casteljau midpoint so the curve keeps its shape.
 */
export function insertPoint(contours: GlyphContour[], contourIndex: number, segmentIndex: number): GlyphContour[] {
  return contours.map((contour, index) => {
    if (index !== contourIndex) return contour;
    const points = contour.closed ? startOnCurve(contour) : contour.points;
    const a = points[segmentIndex];
    const b = points[(segmentIndex + 1) % points.length];
    const c = points[(segmentIndex + 2) % points.length];
    if (!a || !b) return contour;

    let added: GlyphPoint[];
    if (!b.onCurve && a.onCurve && c?.onCurve) {
      const mid1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const mid2 = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
      added = [newPoint(mid1.x, mid1.y, true), newPoint((b.x + mid1.x + mid2.x) / 3, (b.y + mid1.y + mid2.y) / 3, false), newPoint(mid2.x, mid2.y, true)];
    } else {
      added = [newPoint((a.x + b.x) / 2, (a.y + b.y) / 2, true)];
    }
    return { ...contour, points: [...points.slice(0, segmentIndex + 1), ...added, ...points.slice(segmentIndex + 1)] };
  });
}

/** Average of a straight line's direction — used by align/distribute. */
export function alignPoints(contours: GlyphContour[], selected: Set<string>, axis: 'x' | 'y', mode: 'min' | 'max' | 'center'): GlyphContour[] {
  const chosen = contours.flatMap((contour, contourIndex) =>
    contour.points.filter((_, pointIndex) => selected.has(nodeKey(contourIndex, pointIndex))),
  );
  if (chosen.length < 2) return contours;
  const values = chosen.map((point) => (axis === 'x' ? point.x : point.y));
  const target =
    mode === 'min' ? Math.min(...values) : mode === 'max' ? Math.max(...values) : values.reduce((sum, value) => sum + value, 0) / values.length;
  return contours.map((contour, contourIndex) => ({
    ...contour,
    points: contour.points.map((point, pointIndex) =>
      selected.has(nodeKey(contourIndex, pointIndex)) ? ({ ...point, [axis]: target } as GlyphPoint) : point,
    ),
  }));
}

export function distributePoints(contours: GlyphContour[], selected: Set<string>, axis: 'x' | 'y'): GlyphContour[] {
  const chosen = contours
    .flatMap((contour, contourIndex) => contour.points.filter((_, pointIndex) => selected.has(nodeKey(contourIndex, pointIndex))))
    .sort((a, b) => (axis === 'x' ? a.x - b.x : a.y - b.y));
  if (chosen.length < 3) return contours;
  const first = axis === 'x' ? chosen[0].x : chosen[0].y;
  const last = axis === 'x' ? chosen[chosen.length - 1].x : chosen[chosen.length - 1].y;
  const step = (last - first) / (chosen.length - 1);
  const targets = new Map<GlyphPoint, number>();
  chosen.forEach((point, index) => targets.set(point, first + step * index));
  return contours.map((contour) => ({
    ...contour,
    points: contour.points.map((point) => (targets.has(point) ? ({ ...point, [axis]: targets.get(point)! } as GlyphPoint) : point)),
  }));
}

/** Snaps selected nodes to a grid (used by "snap to metrics"). */
export function snapPoints(contours: GlyphContour[], selected: Set<string>, grid: number): GlyphContour[] {
  const step = Math.max(1, grid);
  return contours.map((contour, contourIndex) => ({
    ...contour,
    points: contour.points.map((point, pointIndex) =>
      selected.size === 0 || selected.has(nodeKey(contourIndex, pointIndex))
        ? { ...point, x: Math.round(point.x / step) * step, y: Math.round(point.y / step) * step }
        : point,
    ),
  }));
}

/**
 * Smooth pass: pulls control points so the curve through a node becomes round.
 * A node is smoothed against its neighbours (Catmull-Rom style tangents).
 */
export function smoothContours(contours: GlyphContour[], selected: Set<string>, strength = 0.6): GlyphContour[] {
  return contours.map((contour, contourIndex) => {
    const source = contour.points;
    if (source.length < 3) return contour;
    const points = source.map((point, index) => {
      if (!point.onCurve) return point;
      if (selected.size > 0 && !selected.has(nodeKey(contourIndex, index))) return point;
      const prev = source[(index - 1 + source.length) % source.length];
      const next = source[(index + 1) % source.length];
      const mx = (prev.x + next.x) / 2;
      const my = (prev.y + next.y) / 2;
      return { ...point, x: point.x + (mx - point.x) * (1 - strength) * 0.5, y: point.y + (my - point.y) * (1 - strength) * 0.5 };
    });
    return { ...contour, points };
  });
}

/** Distance from a point to a segment, used by the simplifier. */
function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Removes nodes whose removal keeps the outline inside `tolerance` font units.
 * The endpoints of each contour always survive, so closed shapes stay closed.
 */
export function simplifyContours(contours: GlyphContour[], tolerance: number): { contours: GlyphContour[]; removed: number } {
  let removed = 0;
  const next = contours.map((contour) => {
    let points = contour.points.map((point) => ({ ...point }));
    let changed = true;
    while (changed && points.length > 3) {
      changed = false;
      for (let index = 1; index < points.length - 1; index += 1) {
        const prev = points[index - 1];
        const point = points[index];
        const after = points[index + 1];
        if (distanceToSegment(point.x, point.y, prev.x, prev.y, after.x, after.y) <= tolerance) {
          points = [...points.slice(0, index), ...points.slice(index + 1)];
          removed += 1;
          changed = true;
          break;
        }
      }
    }
    return { ...contour, points };
  });
  return { contours: next.filter((contour) => contour.points.length > 1), removed };
}

/** Removes duplicate nodes that sit on top of each other. */
export function dedupeContours(contours: GlyphContour[], tolerance = 0.5): { contours: GlyphContour[]; removed: number } {
  let removed = 0;
  const next = contours.map((contour) => {
    const points: GlyphPoint[] = [];
    for (const point of contour.points) {
      const duplicate = points.some((existing) => Math.hypot(existing.x - point.x, existing.y - point.y) < tolerance && existing.onCurve === point.onCurve);
      if (duplicate) removed += 1;
      else points.push({ ...point });
    }
    return { ...contour, points };
  });
  return { contours: next.filter((contour) => contour.points.length > 1), removed };
}

/** Splits / recombines contours: closes open contours or opens closed ones. */
export function toggleClosed(contours: GlyphContour[], index: number): GlyphContour[] {
  return contours.map((contour, position) => (position === index ? { ...contour, closed: !contour.closed } : contour));
}

export function emptyShape(name: string, advanceWidth: number): GlyphShape {
  return {
    name,
    unicode: null,
    points: [],
    contours: [],
    commands: '',
    advanceWidth,
    leftSideBearing: 0,
    bbox: { x1: 0, y1: 0, x2: 0, y2: 0 },
  };
}

/** Total node count and on/off curve split, shown in the stage status bar. */
export function nodeStats(contours: GlyphContour[]) {
  let on = 0;
  let off = 0;
  for (const contour of contours) {
    for (const point of contour.points) {
      if (point.onCurve) on += 1;
      else off += 1;
    }
  }
  return { on, off, total: on + off, contours: contours.length };
}
