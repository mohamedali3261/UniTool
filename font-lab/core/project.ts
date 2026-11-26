/**
 * Project document — what the user can save, reload and export.
 *
 * A project keeps only the *edits*: for every changed glyph the contour data and
 * advance width, plus font-wide metrics, kerning pairs and guides. The original
 * font bytes stay untouched, so edits always apply on top of real outlines and a
 * reset restores the designer's work exactly.
 */
import type { GlyphContour, GlyphShape, LoadedFont } from './fontEngine';

export const PROJECT_VERSION = 1;
export const PROJECT_STORAGE_KEY = 'unitool.fontlab.projects.v1';

export interface GlyphOverride {
  contours: GlyphContour[];
  advanceWidth: number;
  leftSideBearing: number;
}

export interface Metrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
  xHeight: number;
  capHeight: number;
}

export interface SampleSettings {
  arabic: string;
  latin: string;
  size: number;
}

export interface ProjectDocument {
  version: number;
  fontKey: string;
  family: string;
  style: string;
  designer: string;
  metrics: Metrics;
  overrides: Record<string, GlyphOverride>;
  kerning: Record<string, number>;
  guides: { vertical: number[]; horizontal: number[] };
  sample: SampleSettings;
  featureFlags: Record<string, boolean>;
  updatedAt: number;
}

export interface GlyphLike {
  name: string;
  contours: GlyphContour[];
  advanceWidth: number;
  leftSideBearing: number;
}

export function createDocument(font: LoadedFont, family?: string): ProjectDocument {
  const summary = font.summary;
  return {
    version: PROJECT_VERSION,
    fontKey: font.fileName,
    family: family || summary.family,
    style: summary.subfamily,
    designer: summary.designer || '',
    metrics: {
      unitsPerEm: summary.unitsPerEm,
      ascender: summary.ascender || Math.round(summary.unitsPerEm * 0.85),
      descender: summary.descender || -Math.round(summary.unitsPerEm * 0.25),
      xHeight: Math.round(summary.unitsPerEm * 0.52),
      capHeight: Math.round(summary.unitsPerEm * 0.7),
    },
    overrides: {},
    kerning: {},
    guides: { vertical: [], horizontal: [] },
    sample: {
      arabic: 'بسم الله الرحمن الرحيم — الخط العربي',
      latin: 'Hamburgefonts 0123',
      size: 148,
    },
    featureFlags: { kern: true, liga: true, calt: true, mark: true },
    updatedAt: Date.now(),
  };
}

export function overrideOf(doc: ProjectDocument, name: string): GlyphOverride | undefined {
  return doc.overrides[name];
}

/** Current geometry of a glyph: the edit if it exists, the font otherwise. */
export function glyphState(doc: ProjectDocument, shape: GlyphShape): GlyphLike {
  const override = doc.overrides[shape.name];
  return {
    name: shape.name,
    contours: override?.contours ?? shape.contours,
    advanceWidth: override?.advanceWidth ?? shape.advanceWidth,
    leftSideBearing: override?.leftSideBearing ?? shape.leftSideBearing,
  };
}

export function isEdited(doc: ProjectDocument, name: string) {
  return Boolean(doc.overrides[name]);
}

export function editedCount(doc: ProjectDocument) {
  return Object.keys(doc.overrides).length;
}

export function withOverride(doc: ProjectDocument, name: string, patch: Partial<GlyphOverride>): ProjectDocument {
  const existing = doc.overrides[name];
  const base: GlyphOverride = existing ?? { contours: [], advanceWidth: 0, leftSideBearing: 0 };
  return {
    ...doc,
    updatedAt: Date.now(),
    overrides: {
      ...doc.overrides,
      [name]: { ...base, ...patch },
    },
  };
}

export function withoutOverride(doc: ProjectDocument, name: string): ProjectDocument {
  const overrides = { ...doc.overrides };
  delete overrides[name];
  return { ...doc, overrides, updatedAt: Date.now() };
}

export function resetGlyph(doc: ProjectDocument, name: string): ProjectDocument {
  return withoutOverride(doc, name);
}

export function setKerning(doc: ProjectDocument, left: string, right: string, value: number): ProjectDocument {
  const key = pairKey(left, right);
  const kerning = { ...doc.kerning };
  if (value === 0) delete kerning[key];
  else kerning[key] = Math.round(value);
  return { ...doc, kerning, updatedAt: Date.now() };
}

export function pairKey(left: string, right: string) {
  return `${left}|${right}`;
}

export function getKerning(doc: ProjectDocument, left: string, right: string) {
  return doc.kerning[pairKey(left, right)] ?? 0;
}

export function kerningPairs(doc: ProjectDocument) {
  return Object.entries(doc.kerning).map(([key, value]) => {
    const [left, right] = key.split('|');
    return { key, left, right, value };
  });
}

export function updateMetrics(doc: ProjectDocument, patch: Partial<Metrics>): ProjectDocument {
  return { ...doc, metrics: { ...doc.metrics, ...patch }, updatedAt: Date.now() };
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export function serializeProject(doc: ProjectDocument): string {
  return JSON.stringify(doc);
}

/** Parses and validates a project file. Throws a bilingual error when invalid. */
export function parseProject(raw: string): ProjectDocument {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('الملف ليس مشروع خط صالح. / This is not a valid font project file.');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('الملف ليس مشروع خط صالح. / This is not a valid font project file.');
  }
  const candidate = data as Partial<ProjectDocument>;
  if (typeof candidate.fontKey !== 'string' || typeof candidate.metrics !== 'object' || candidate.metrics === null) {
    throw new Error('المشروع ناقص: بيانات الخط أو المقاييس غير موجودة. / Project is missing the font key or metrics.');
  }
  const metrics = candidate.metrics as Metrics;
  if (!Number.isFinite(metrics.unitsPerEm) || metrics.unitsPerEm <= 0) {
    throw new Error('قيمة upm في المشروع غير صحيحة. / The project units-per-em value is invalid.');
  }
  const overrides: Record<string, GlyphOverride> = {};
  for (const [name, value] of Object.entries(candidate.overrides || {})) {
    const glyph = value as GlyphOverride;
    if (!glyph || !Array.isArray(glyph.contours)) continue;
    overrides[name] = {
      contours: glyph.contours.map((contour) => ({
        closed: contour.closed !== false,
        points: (contour.points || []).map((point, index) => ({
          x: Number(point.x) || 0,
          y: Number(point.y) || 0,
          onCurve: point.onCurve !== false,
          contour: 0,
          index,
          contourIndex: index,
        })),
      })),
      advanceWidth: Number(glyph.advanceWidth) || 0,
      leftSideBearing: Number(glyph.leftSideBearing) || 0,
    };
  }

  return {
    version: Number(candidate.version) || PROJECT_VERSION,
    fontKey: candidate.fontKey,
    family: String(candidate.family || 'Untitled family'),
    style: String(candidate.style || 'Regular'),
    designer: String(candidate.designer || ''),
    metrics: {
      unitsPerEm: metrics.unitsPerEm,
      ascender: Number(metrics.ascender) || 0,
      descender: Number(metrics.descender) || 0,
      xHeight: Number(metrics.xHeight) || 0,
      capHeight: Number(metrics.capHeight) || 0,
    },
    overrides,
    kerning: Object.fromEntries(
      Object.entries(candidate.kerning || {}).map(([key, value]) => [key, Number(value) || 0]),
    ),
    guides: {
      vertical: (candidate.guides?.vertical || []).map(Number).filter(Number.isFinite),
      horizontal: (candidate.guides?.horizontal || []).map(Number).filter(Number.isFinite),
    },
    sample: {
      arabic: String(candidate.sample?.arabic ?? ''),
      latin: String(candidate.sample?.latin ?? ''),
      size: Number(candidate.sample?.size) || 148,
    },
    featureFlags: { ...(candidate.featureFlags || {}) },
    updatedAt: Number(candidate.updatedAt) || Date.now(),
  };
}

export interface StoredProject {
  id: string;
  name: string;
  fontKey: string;
  edited: number;
  updatedAt: number;
  document: ProjectDocument;
}

export function readStoredProjects(storage: Storage | undefined = safeStorage()): StoredProject[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter((entry) => entry && typeof entry.id === 'string' && entry.document);
  } catch {
    return [];
  }
}

export function writeStoredProjects(list: StoredProject[], storage: Storage | undefined = safeStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(list.slice(0, 24)));
    return true;
  } catch {
    return false;
  }
}

export function saveProjectToList(
  list: StoredProject[],
  name: string,
  document: ProjectDocument,
  id = `p${Date.now().toString(36)}`,
): StoredProject[] {
  const entry: StoredProject = {
    id,
    name: name || document.family,
    fontKey: document.fontKey,
    edited: editedCount(document),
    updatedAt: Date.now(),
    document,
  };
  return [entry, ...list.filter((item) => item.id !== id)];
}

function safeStorage(): Storage | undefined {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    return localStorage;
  } catch {
    return undefined;
  }
}

/** One-line human summary used in the project chip. */
export function describeDocument(doc: ProjectDocument) {
  return `${doc.family} ${doc.style} · ${editedCount(doc)} ✎ · ${doc.metrics.unitsPerEm} upm`;
}
