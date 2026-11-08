import { createContext, useContext } from 'react';
import type {
  CanvasSelection,
  ResumeDocument,
  StudioPageId,
  TemplatePreset,
  UiLang,
} from '../core/types';
import type { SaveIndicator } from './useResumeStore';

export interface CvStudioContextValue {
  lang: UiLang;
  t: (ar: string, en: string) => string;
  toggleLang: () => void;
  page: StudioPageId;
  navigate: (next: StudioPageId) => void;
  resume: ResumeDocument;
  resumes: ResumeDocument[];
  updateResume: (updater: ResumeDocument | ((prev: ResumeDocument) => ResumeDocument)) => void;
  updateResumeTransient: (updater: ResumeDocument | ((prev: ResumeDocument) => ResumeDocument)) => void;
  commitHistorySnapshot: () => void;
  canvasSelection: CanvasSelection;
  setCanvasSelection: (sel: CanvasSelection) => void;
  selectResume: (id: string) => void;
  addResume: (doc: ResumeDocument) => Promise<ResumeDocument>;
  duplicateResume: (sourceId: string, customTitle?: string, customCompany?: string) => Promise<ResumeDocument | null>;
  renameResume: (id: string, title: string, targetCompany?: string) => Promise<void>;
  removeResume: (id: string) => Promise<void>;
  applyTemplateKeepData: (template: TemplatePreset) => void;
  applyTemplateWithSample: (template: TemplatePreset) => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveState: SaveIndicator;
  notify: (message: string) => void;
  triggerImportFile: () => void;
  exportPdfNow: (kind?: 'cv' | 'cover-letter') => Promise<void>;
  exportPngNow: (kind?: 'cv' | 'cover-letter') => Promise<void>;
  exportUtcvNow: () => void;
  busyLabel: string;
}

export const CvStudioContext = createContext<CvStudioContextValue | null>(null);

export function useCvStudio(): CvStudioContextValue {
  const ctx = useContext(CvStudioContext);
  if (!ctx) throw new Error('useCvStudio must be used inside CvStudioContext.Provider');
  return ctx;
}
