/**
 * Font Lab UI state — one reducer for the whole studio.
 *
 * Every panel (glyph grid, stage, metrics, kerning, export) reads this state, so
 * a single action shape describes each edit and the undo history is projected
 * from the same document that gets saved and exported.
 */
import { commit, createHistory, current, redo, undo, type HistoryState } from '../core/history';
import type { GlyphContour } from '../core/fontEngine';
import {
  createDocument,
  setKerning,
  updateMetrics,
  withOverride,
  withoutOverride,
  type Metrics,
  type ProjectDocument,
} from '../core/project';
import type { ArabicPosition } from '../core/glyphIndex';

export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';
export type StageTool = 'select' | 'pen' | 'pan' | 'lasso' | 'zoom';
export type CompareMode = 'none' | 'ghost' | 'overlay' | 'difference';

export interface Selection {
  glyph: string | null;
  nodes: string[];
  contour: number | null;
}

export interface LabState {
  lang: Language;
  theme: Theme;
  doc: ProjectDocument;
  history: HistoryState<ProjectDocument>;
  selection: Selection;
  tool: StageTool;
  form: ArabicPosition | 'auto';
  compare: CompareMode;
  showMetrics: boolean;
  showGrid: boolean;
  zoom: number;
  pan: { x: number; y: number };
  edited: string[];
  dirty: boolean;
  savedProjects: number;
  exporting: boolean;
  /** how many edited glyphs the last export carried (shown in the verification board) */
  exported: number;
}

export type LabAction =
  | { type: 'lang'; value: Language }
  | { type: 'theme'; value: Theme }
  | { type: 'document'; doc: ProjectDocument; labelAr: string; labelEn: string; edited?: string[] }
  | { type: 'select'; glyph: string | null }
  | { type: 'selectNodes'; nodes: string[]; contour?: number | null }
  | { type: 'tool'; value: StageTool }
  | { type: 'form'; value: ArabicPosition | 'auto' }
  | { type: 'compare'; value: CompareMode }
  | { type: 'toggleMetrics' }
  | { type: 'toggleGrid' }
  | { type: 'zoom'; value: number }
  | { type: 'pan'; value: { x: number; y: number } }
  | { type: 'contours'; name: string; contours: GlyphContour[]; labelAr: string; labelEn: string; advance?: number }
  /** closes a drag: writes the final geometry as one undo step */
  | { type: 'commitContours'; name: string; contours: GlyphContour[]; labelAr: string; labelEn: string }
  | { type: 'metrics'; metrics: Partial<Metrics>; labelAr: string; labelEn: string }
  | { type: 'kerning'; left: string; right: string; value: number }
  | { type: 'resetGlyph'; name: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'saved'; count: number }
  | { type: 'exporting'; value: boolean }
  | { type: 'exported'; value: number };

export function initialState(doc: ProjectDocument): LabState {
  return {
    lang: 'ar',
    theme: 'light',
    doc,
    history: createHistory(doc, { labelAr: 'بداية المشروع', labelEn: 'Project opened' }),
    selection: { glyph: null, nodes: [], contour: null },
    tool: 'select',
    form: 'auto',
    compare: 'ghost',
    showMetrics: true,
    showGrid: true,
    zoom: 1,
    pan: { x: 0, y: 0 },
    edited: [],
    dirty: false,
    savedProjects: 0,
    exporting: false,
    exported: 0,
  };
}

export function reduce(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case 'lang':
      return { ...state, lang: action.value };
    case 'theme':
      return { ...state, theme: action.value };
    case 'document': {
      const history = commit(state.history, action.doc, action.labelAr, action.labelEn);
      return {
        ...state,
        doc: action.doc,
        history,
        edited: action.edited ?? Object.keys(action.doc.overrides),
        dirty: true,
      };
    }
    case 'select':
      return { ...state, selection: { glyph: action.glyph, nodes: [], contour: null } };
    case 'selectNodes':
      return { ...state, selection: { ...state.selection, nodes: action.nodes, contour: action.contour ?? null } };
    case 'tool':
      return { ...state, tool: action.value };
    case 'form':
      return { ...state, form: action.value };
    case 'compare':
      return { ...state, compare: action.value };
    case 'toggleMetrics':
      return { ...state, showMetrics: !state.showMetrics };
    case 'toggleGrid':
      return { ...state, showGrid: !state.showGrid };
    case 'zoom':
      return { ...state, zoom: Math.min(8, Math.max(0.2, action.value)) };
    case 'pan':
      return { ...state, pan: action.value };
    case 'contours': {
      const currentOverride = state.doc.overrides[action.name];
      const doc = withOverride(state.doc, action.name, {
        contours: action.contours,
        advanceWidth: action.advance ?? currentOverride?.advanceWidth ?? 0,
      });
      const history = commit(state.history, doc, action.labelAr, action.labelEn);
      const edited = Object.keys(doc.overrides);
      return { ...state, doc, history, edited, dirty: true };
    }
    case 'commitContours': {
      const existing = state.doc.overrides[action.name];
      const doc = withOverride(state.doc, action.name, {
        contours: action.contours,
        advanceWidth: existing?.advanceWidth ?? 0,
      });
      return { ...state, doc, history: commit(state.history, doc, action.labelAr, action.labelEn), edited: Object.keys(doc.overrides), dirty: true };
    }
    case 'metrics': {
      const doc = updateMetrics(state.doc, action.metrics);
      return { ...state, doc, history: commit(state.history, doc, action.labelAr, action.labelEn), dirty: true };
    }
    case 'kerning': {
      const doc = setKerning(state.doc, action.left, action.right, action.value);
      return { ...state, doc, history: commit(state.history, doc, 'تعديل كرننغ', 'Kerning changed'), dirty: true };
    }
    case 'resetGlyph': {
      const doc = withoutOverride(state.doc, action.name);
      return {
        ...state,
        doc,
        history: commit(state.history, doc, 'إرجاع الحرف', 'Glyph reset'),
        edited: Object.keys(doc.overrides),
        dirty: true,
      };
    }
    case 'undo': {
      const history = undo(state.history);
      const doc = current(history);
      return { ...state, history, doc, edited: Object.keys(doc.overrides) };
    }
    case 'redo': {
      const history = redo(state.history);
      const doc = current(history);
      return { ...state, history, doc, edited: Object.keys(doc.overrides) };
    }
    case 'saved':
      return { ...state, savedProjects: action.count, dirty: false };
    case 'exporting':
      return { ...state, exporting: action.value };
    case 'exported':
      return { ...state, exported: action.value };
    default:
      return state;
  }
}

/** Boots the editor document for a freshly loaded font. */
export function documentForFont(font: { summary: { family: string } }): ProjectDocument {
  return createDocument(font as any);
}
