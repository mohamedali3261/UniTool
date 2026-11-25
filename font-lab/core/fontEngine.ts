/**
 * Font engine — reading, analysing and rewriting real glyph outlines.
 *
 * Everything here works on actual OpenType data (opentype.js): a font is parsed
 * once, then every glyph is exposed with its outlines, advance width, unicode
 * mapping and GPOS/GSUB script support, so the editor can move points the same
 * way a font designer would.
 */
import opentype from 'opentype.js';

export type OutlineFormat = 'truetype' | 'cff' | 'unknown';

export interface GlyphPoint {
  x: number;
  y: number;
  /** on-curve (true) or bezier control point (false) */
  onCurve: boolean;
  /** which contour of the glyph this point belongs to */
  contour: number;
  /** index inside the glyph's flat point list */
  index: number;
  /** index inside its contour */
  contourIndex: number;
}

export interface GlyphContour {
  points: GlyphPoint[];
  closed: boolean;
}

export interface GlyphShape {
  name: string;
  unicode: number | null;
  /** every glyph point, in em units */
  points: GlyphPoint[];
  contours: GlyphContour[];
  commands: string;
  advanceWidth: number;
  leftSideBearing: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
}

export interface FontSummary {
  family: string;
  subfamily: string;
  fullName: string;
  version: string;
  designer: string;
  license: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  lineGap: number;
  glyphCount: number;
  outlineFormat: OutlineFormat;
  emBox: number;
  upmRatio: number;
  scripts: string[];
  features: string[];
  hinting: boolean;
  variable: boolean;
  colorGlyphs: boolean;
  unicodeRanges: { arabic: number; latin: number; other: number };
}

/** CSS font-family name used for every on-page preview of this font. */
export const PREVIEW_FAMILY = 'unitool-fontlab-preview';

export interface LoadedFont {
  /** original bytes, kept so download/export can ship the untouched font */
  buffer: ArrayBuffer;
  fileName: string;
  summary: FontSummary;
  glyphs: Map<string, GlyphShape>;
  /** glyph names that actually have outline points */
  drawn: string[];
  order: string[];
  /** glyph name for each unicode, used for quick lookups */
  byUnicode: Map<number, string>;
  /** glyph name → glyph index in the parsed font (needed to rewrite outlines) */
  nameIndex: Map<string, number>;
  parsed: opentype.Font;
}

const ARABIC_RANGES: Array<[number, number]> = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];

const LATIN_RANGES: Array<[number, number]> = [
  [0x0020, 0x024f],
  [0x1e00, 0x1eff],
];

/** First four bytes as ASCII, e.g. `\x00\x01\x00\x00` → '.ttf', 'OTTO', 'wOFF'. */
export function readSignature(buffer: ArrayBuffer): string {
  if (!buffer || buffer.byteLength < 4) return '';
  const view = new Uint8Array(buffer, 0, 4);
  const ascii = String.fromCharCode(view[0], view[1], view[2], view[3]);
  if (ascii === 'OTTO') return 'OTTO';
  if (ascii === 'true' || ascii === 'typ1') return 'ttf';
  if (view[0] === 0 && view[1] === 1 && view[2] === 0 && view[3] === 0) return 'ttf';
  return ascii;
}

function inRanges(code: number, ranges: Array<[number, number]>) {
  return ranges.some(([a, b]) => code >= a && code <= b);
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readNames(names: any, key: string): string {
  try {
    const entry = names?.[key];
    if (!entry) return '';
    return entry.en || Object.values(entry)[0] || '';
  } catch {
    return '';
  }
}

function outlineFormatOf(parsed: opentype.Font): OutlineFormat {
  try {
    const fmt = parsed.outlinesFormat;
    return fmt === 'truetype' || fmt === 'cff' ? fmt : 'unknown';
  } catch {
    return 'unknown';
  }
}

function collectScriptsAndFeatures(parsed: opentype.Font) {
  const scripts = new Set<string>();
  const features = new Set<string>();
  for (const table of [parsed.tables.gsub, parsed.tables.gpos]) {
    if (!table) continue;
    const list = (table as any).scripts;
    if (!list) continue;
    for (const entry of list as any[]) {
      if (entry?.tag) scripts.add(String(entry.tag));
      for (const lang of entry?.script?.langSysRecords || []) {
        for (const feature of lang?.langSys?.featureIndexes ? [] : []) void feature;
      }
      const featureRecords = (table as any).features || [];
      for (const feature of featureRecords) {
        if (feature?.tag) features.add(String(feature.tag));
      }
    }
  }
  return { scripts: [...scripts], features: [...features] };
}

/**
 * Turns a font path into editable points + contours.
 *
 * opentype.js exposes a path per glyph; every `moveTo` starts a new contour and
 * `quadraticCurveTo`/`curveTo` add control points, exactly the data needed for a
 * point editor that survives a round-trip back into a real TTF.
 */
export function glyphShape(parsed: opentype.Font, glyph: opentype.Glyph, name: string): GlyphShape {
  const points: GlyphPoint[] = [];
  const contours: GlyphContour[] = [];
  let current: GlyphContour | null = null;

  const push = (x: number, y: number, onCurve: boolean) => {
    if (!current) {
      current = { points: [], closed: false };
      contours.push(current);
    }
    const point: GlyphPoint = {
      x: num(x),
      y: num(y),
      onCurve,
      contour: contours.length - 1,
      index: points.length,
      contourIndex: current.points.length,
    };
    current.points.push(point);
    points.push(point);
  };

  for (const command of glyph.path.commands as any[]) {
    switch (command.type) {
      case 'M':
        current = { points: [], closed: false };
        contours.push(current);
        push(command.x, command.y, true);
        break;
      case 'L':
        push(command.x, command.y, true);
        break;
      case 'Q':
        push(command.x1, command.y1, false);
        push(command.x, command.y, true);
        break;
      case 'C':
        push(command.x1, command.y1, false);
        push(command.x2, command.y2, false);
        push(command.x, command.y, true);
        break;
      case 'Z':
        if (current) current.closed = true;
        current = null;
        break;
      default:
        break;
    }
  }

  const bbox = glyph.getBoundingBox();
  const unicode = glyph.unicodes?.[0] ?? null;
  return {
    name,
    unicode,
    points,
    contours,
    commands: glyph.path.toPathData(2),
    advanceWidth: num(glyph.advanceWidth),
    leftSideBearing: num((glyph as any).leftSideBearing),
    bbox: {
      x1: num(bbox.x1),
      y1: num(bbox.y1),
      x2: num(bbox.x2),
      y2: num(bbox.y2),
    },
  };
}

/** Parses a font file. Throws a readable message when the file is not usable. */
export function loadFont(buffer: ArrayBuffer, fileName: string): LoadedFont {
  // Check the SFNT signature ourselves: opentype.js' own message is ambiguous
  // for short/unknown files, and users need a precise reason.
  const signature = readSignature(buffer);
  if (signature === 'wOF2' || signature === 'wOFF') {
    throw new Error('هذا الملف مضغوط بصيغة WOFF/WOFF2 — استخدم ملف TTF أو OTF. / This file is WOFF/WOFF2-compressed; use a TTF or OTF file.');
  }

  let parsed: opentype.Font;
  try {
    parsed = opentype.parse(buffer, { lowMemory: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`تعذر قراءة الخط: ${message} / Could not read the font: ${message}`);
  }

  const glyphs = new Map<string, GlyphShape>();
  const byUnicode = new Map<number, string>();
  const nameIndex = new Map<string, number>();
  const drawn: string[] = [];
  const order: string[] = [];
  let arabic = 0;
  let latin = 0;
  let other = 0;

  for (let index = 0; index < parsed.glyphs.length; index += 1) {
    const glyph = parsed.glyphs.get(index);
    if (!glyph) continue;
    const name = glyph.name || `glyph${index}`;
    const shape = glyphShape(parsed, glyph, name);
    glyphs.set(name, shape);
    order.push(name);
    if (shape.points.length > 0) drawn.push(name);
    if (!nameIndex.has(name)) nameIndex.set(name, index);
    for (const code of glyph.unicodes || []) {
      if (!byUnicode.has(code)) byUnicode.set(code, name);
    }
    const code = shape.unicode ?? -1;
    if (inRanges(code, ARABIC_RANGES)) arabic += 1;
    else if (inRanges(code, LATIN_RANGES)) latin += 1;
    else other += 1;
  }

  const { scripts, features } = collectScriptsAndFeatures(parsed);
  const unitsPerEm = num((parsed as any).unitsPerEm, 1000);
  const names = (parsed as any).names || {};

  const summary: FontSummary = {
    family: readNames(names, 'fontFamily') || 'Unnamed font',
    subfamily: readNames(names, 'fontSubfamily') || 'Regular',
    fullName: readNames(names, 'fullName') || fileName.replace(/\.(ttf|otf)$/i, ''),
    version: readNames(names, 'version'),
    designer: readNames(names, 'designer') || readNames(names, 'manufacturer'),
    license: readNames(names, 'license') || readNames(names, 'licenseURL'),
    unitsPerEm,
    ascender: num((parsed.ascender as number) ?? 0),
    descender: num((parsed.descender as number) ?? 0),
    lineGap: num((parsed as any).tables?.hhea?.lineGap ?? 0),
    glyphCount: parsed.glyphs.length,
    outlineFormat: outlineFormatOf(parsed),
    emBox: unitsPerEm,
    upmRatio: unitsPerEm / 1000,
    scripts,
    features,
    hinting:
      Boolean((parsed.tables as any)?.fpgm) ||
      Boolean((parsed.tables as any)?.prep) ||
      Boolean((parsed.tables as any)?.cvt),
    variable: Boolean((parsed.tables as any)?.fvar),
    colorGlyphs: Boolean((parsed.tables as any)?.COLR) || Boolean((parsed.tables as any)?.sbix),
    unicodeRanges: { arabic, latin, other },
  };

  return { buffer, fileName, summary, glyphs, drawn, order, byUnicode, nameIndex, parsed };
}

/** Glyph names in a stable, script-aware order (Arabic letters first). */
export function sortGlyphs(font: LoadedFont, by: 'unicode' | 'name' | 'points', source: 'drawn' | 'all' = 'drawn'): string[] {
  const list = source === 'drawn' ? [...font.drawn] : [...font.order];
  if (by === 'name') return list.sort((a, b) => a.localeCompare(b));
  if (by === 'points') {
    return list.sort((a, b) => (font.glyphs.get(b)?.points.length ?? 0) - (font.glyphs.get(a)?.points.length ?? 0));
  }
  return list.sort((a, b) => (font.glyphs.get(a)?.unicode ?? 0x10ffff) - (font.glyphs.get(b)?.unicode ?? 0x10ffff));
}

export function glyphLabel(shape: GlyphShape): string {
  if (shape.unicode == null) return shape.name;
  try {
    return String.fromCodePoint(shape.unicode);
  } catch {
    return shape.name;
  }
}

/** Deep clone so edits never mutate the parsed font before the user saves. */
export function cloneShape(shape: GlyphShape): GlyphShape {
  return {
    ...shape,
    points: shape.points.map((point) => ({ ...point })),
    contours: shape.contours.map((contour) => ({
      closed: contour.closed,
      points: contour.points.map((point) => ({ ...point })),
    })),
    bbox: { ...shape.bbox },
  };
}
