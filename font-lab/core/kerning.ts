/**
 * Kerning assistant.
 *
 * A kerning pair is the horizontal distance the designer removes between two
 * glyphs. Instead of guessing, this module measures the *optical* gap between the
 * right edge of the left glyph's outline and the left edge of the right glyph's
 * outline, then proposes a value that brings that gap to a target.
 */
import type { GlyphShape } from './fontEngine';
import type { ProjectDocument } from './project';
import { bboxOf } from './geometry';

export interface KerningSuggestion {
  left: string;
  right: string;
  current: number;
  suggested: number;
  opticalGap: number;
  targetGap: number;
  confidence: 'high' | 'medium' | 'low';
}

export function rightSideBearing(shape: GlyphShape, advanceWidth?: number) {
  const advance = advanceWidth ?? shape.advanceWidth;
  if (shape.points.length === 0) return 0;
  return advance - shape.bbox.x2;
}

export function leftSideBearing(shape: GlyphShape) {
  if (shape.points.length === 0) return 0;
  return shape.bbox.x1;
}

/** Target optical gap, ~6% of the em — enough air for both scripts. */
export function targetGapFor(upm: number) {
  return Math.round(upm * 0.06);
}

export function suggestKerning(
  left: { shape: GlyphShape; advance: number },
  right: { shape: GlyphShape },
  upm: number,
  current = 0,
): KerningSuggestion {
  const gap = Math.round(rightSideBearing(left.shape, left.advance) + leftSideBearing(right.shape));
  const target = targetGapFor(upm);
  const suggested = Math.round(gap - target);
  const extremes = Math.abs(suggested) > upm * 0.12;
  return {
    left: left.shape.name,
    right: right.shape.name,
    current,
    suggested,
    opticalGap: gap,
    targetGap: target,
    confidence: extremes ? 'low' : Math.abs(suggested) > upm * 0.05 ? 'medium' : 'high',
  };
}

/** Pairs worth kerning: symbols with wide gaps or letters with none. */
export function autoPairs(shapes: GlyphShape[], upm: number, doc: ProjectDocument, limit = 12) {
  const pool = shapes.filter((shape) => shape.points.length > 0).slice(0, 60);
  const scored: Array<{ score: number; suggestion: KerningSuggestion }> = [];
  for (const left of pool) {
    for (const right of pool) {
      if (left.name === right.name) continue;
      const current = doc.kerning[`${left.name}|${right.name}`] ?? 0;
      const suggestion = suggestKerning({ shape: left, advance: doc.overrides[left.name]?.advanceWidth ?? left.advanceWidth }, { shape: right }, upm, current);
      const delta = Math.abs(suggestion.suggested - current);
      if (delta < upm * 0.01) continue;
      scored.push({ score: delta, suggestion });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.suggestion);
}

/** Distance between the outlines of two glyphs at a given kern value. */
export function pairGap(left: { shape: GlyphShape; advance: number }, right: { shape: GlyphShape }, kern: number) {
  return Math.round(rightSideBearing(left.shape, left.advance) + leftSideBearing(right.shape) + kern);
}

/** Bounding box of both glyphs side by side, used by the kerning preview. */
export function pairBox(left: { shape: GlyphShape; advance: number }, right: { shape: GlyphShape }, kern: number) {
  const rightOffset = left.advance + kern;
  const points = [
    ...left.shape.points,
    ...right.shape.points.map((point) => ({ ...point, x: point.x + rightOffset })),
  ];
  return { box: bboxOf(points), rightOffset };
}
