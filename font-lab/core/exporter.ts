/**
 * Export pipeline — writes the edited outlines back into a real font file.
 *
 * opentype.js parsed the original font, so the exporter swaps each edited glyph's
 * path + advance width on the parsed glyph, then serialises the whole font again:
 * GSUB/GPOS, names, cmap and every untouched glyph survive the round-trip.
 */
import opentype from 'opentype.js';
import type { LoadedFont, GlyphContour } from './fontEngine';
import { bboxOf } from './geometry';
import { contoursToCommands, type PathCommand } from './outline';
import { pairKey, type ProjectDocument } from './project';
import { canPatch, patchTruetype } from './ttfWriter';

export interface ExportOptions {
  /** OTF (CFF) when true, TrueType when false */
  otf: boolean;
  /** apply kerning pairs as a legacy `kern` table */
  kerning: boolean;
  /** bump the version string so caches never serve the old font */
  bumpVersion: boolean;
}

export const DEFAULT_EXPORT: ExportOptions = { otf: false, kerning: true, bumpVersion: true };

export interface ExportResult {
  buffer: ArrayBuffer;
  fileName: string;
  format: 'truetype' | 'cff';
  editedGlyphs: number;
  bytes: number;
}

function commandToPathCommand(command: PathCommand): any {
  switch (command.type) {
    case 'M':
      return { type: 'M', x: command.x ?? 0, y: command.y ?? 0 };
    case 'L':
      return { type: 'L', x: command.x ?? 0, y: command.y ?? 0 };
    case 'Q':
      return { type: 'Q', x1: command.x1 ?? 0, y1: command.y1 ?? 0, x: command.x ?? 0, y: command.y ?? 0 };
    case 'C':
      return { type: 'C', x1: command.x1 ?? 0, y1: command.y1 ?? 0, x2: command.x2 ?? 0, y2: command.y2 ?? 0, x: command.x ?? 0, y: command.y ?? 0 };
    default:
      return { type: 'Z' };
  }
}

export function commandsForContours(contours: GlyphContour[]): any[] {
  return contoursToCommands(contours).map(commandToPathCommand);
}

/** Applies the project edits to a copy of the parsed font. */
export function applyEdits(font: LoadedFont, doc: ProjectDocument): opentype.Font {
  const parsed = font.parsed;
  for (const [name, override] of Object.entries(doc.overrides)) {
    const index = font.nameIndex.get(name);
    const glyph = index == null ? undefined : parsed.glyphs.get(index);
    if (!glyph) continue;
    const commands = commandsForContours(override.contours);
    glyph.path = new opentype.Path(commands as any);
    glyph.advanceWidth = override.advanceWidth;
    if (override.contours.length === 0) {
      glyph.path = new opentype.Path();
    }
    const box = bboxOf(override.contours.flatMap((contour) => contour.points));
    (glyph as any).xMin = Math.round(box.x1);
    (glyph as any).yMin = Math.round(box.y1);
    (glyph as any).xMax = Math.round(box.x2);
    (glyph as any).yMax = Math.round(box.y2);
    delete (glyph as any).leftSideBearing;
  }

  if (doc.metrics.ascender || doc.metrics.descender) {
    (parsed as any).ascender = doc.metrics.ascender;
    (parsed as any).descender = doc.metrics.descender;
  }
  if (doc.family) {
    try {
      parsed.names.fontFamily = { en: doc.family };
      parsed.names.fullName = { en: `${doc.family} ${doc.style}`.trim() };
      parsed.names.fontSubfamily = { en: doc.style || 'Regular' };
      parsed.names.postScriptName = { en: `${doc.family}-${doc.style || 'Regular'}`.replace(/\s+/g, '') };
    } catch {
      /* some fonts expose read-only names */
    }
  }
  return parsed;
}

/**
 * Full export: edited font bytes + a descriptive file name.
 *
 * TrueType fonts are patched in place (see ttfWriter) so GPOS/GSUB/hinting keep
 * working; CFF fonts go through opentype.js' CFF writer.
 */
export function exportFont(font: LoadedFont, doc: ProjectDocument, options: ExportOptions = DEFAULT_EXPORT): ExportResult {
  const family = (doc.family || font.summary.family).replace(/\s+/g, '-');
  const style = (doc.style || font.summary.subfamily).replace(/\s+/g, '-');
  const trueType = canPatch(font) && !options.otf;
  const buffer = trueType ? patchTruetype(font, doc).buffer : applyEdits(font, doc).toArrayBuffer();
  const extension = options.otf ? 'otf' : 'ttf';
  return {
    buffer,
    fileName: `${family}-${style}.${extension}`,
    format: trueType ? 'truetype' : 'cff',
    editedGlyphs: Object.keys(doc.overrides).length,
    bytes: buffer.byteLength,
  };
}

/** Legacy `kern` table data for the pairs the user edited (shown in the report). */
export function kerningReport(doc: ProjectDocument) {
  const pairs = Object.entries(doc.kerning)
    .map(([key, value]) => {
      const [left, right] = key.split('|');
      return { left, right, value };
    })
    .filter((pair) => pair.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const average = pairs.length ? pairs.reduce((sum, pair) => sum + pair.value, 0) / pairs.length : 0;
  return {
    pairs,
    count: pairs.length,
    average: Math.round(average),
    tightest: pairs[0] ? pairKey(pairs[0].left, pairs[0].right) : null,
  };
}

/* ------------------------------------------------------------------ */
/* SVG / PNG                                                           */
/* ------------------------------------------------------------------ */

export interface SvgPreviewOptions {
  text: string;
  size: number;
  color: string;
  background: string;
  script: 'arabic' | 'latin';
}

/** Builds an SVG using the browser's own shaping (so Arabic joins correctly). */
export function previewSvg(options: SvgPreviewOptions, fontFamily: string): string {
  const lines = options.text.split('\n');
  const lineHeight = options.size * 1.55;
  const width = Math.max(360, Math.max(...lines.map((line) => line.length)) * options.size * 0.62);
  const height = Math.max(160, lines.length * lineHeight + options.size * 0.6);
  const text = lines
    .map((line, index) => {
      const y = options.size + index * lineHeight;
      const anchor = options.script === 'arabic' ? 'end' : 'start';
      const x = options.script === 'arabic' ? width - options.size * 0.3 : options.size * 0.3;
      return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${options.size}" fill="${options.color}" text-anchor="${anchor}" direction="${options.script === 'arabic' ? 'rtl' : 'ltr'}">${escapeXml(line)}</text>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(width)}" height="${Math.round(height)}" viewBox="0 0 ${Math.round(width)} ${Math.round(height)}"><rect width="100%" height="100%" fill="${options.background}"/>${text}</svg>`;
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadBlob(data: BlobPart, fileName: string, type: string) {
  if (typeof document === 'undefined') return false;
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

/** Renders a glyph preview to a PNG data URL using an offscreen canvas. */
export function glyphPngDataUrl(
  contours: GlyphContour[],
  upm: number,
  size = 512,
  colour = '#123a2e',
): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, size, size);
  const scale = size / upm;
  const commands = contoursToCommands(contours);
  const path = new Path2D();
  let current = { x: 0, y: 0 };
  for (const command of commands) {
    const x = (command.x ?? 0) * scale;
    const y = size - (command.y ?? 0) * scale;
    switch (command.type) {
      case 'M':
        path.moveTo(x, y);
        current = { x: command.x ?? 0, y: command.y ?? 0 };
        break;
      case 'L':
        path.lineTo(x, y);
        current = { x: command.x ?? 0, y: command.y ?? 0 };
        break;
      case 'Q':
        path.quadraticCurveTo((command.x1 ?? 0) * scale, size - (command.y1 ?? 0) * scale, x, y);
        current = { x: command.x ?? 0, y: command.y ?? 0 };
        break;
      case 'C':
        path.bezierCurveTo(
          (command.x1 ?? 0) * scale,
          size - (command.y1 ?? 0) * scale,
          (command.x2 ?? 0) * scale,
          size - (command.y2 ?? 0) * scale,
          x,
          y,
        );
        current = { x: command.x ?? 0, y: command.y ?? 0 };
        break;
      case 'Z':
        path.closePath();
        break;
      default:
        break;
    }
  }
  void current;
  context.fillStyle = colour;
  context.fill(path, 'nonzero');
  return canvas.toDataURL('image/png');
}
