import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  ACTIVE_RESUME_KEY,
  deleteResumeRecord,
  loadSavedResumes,
  readSafeLocal,
  saveResumeRecord,
  writeSafeLocal,
} from '../core/storage';
import type { ResumeDocument } from '../core/types';
import { createDefaultStarterResume } from '../data/templates';

const MAX_HISTORY = 45;

export type SaveIndicator = 'saved' | 'saving' | 'memory';

interface StoreState {
  resumes: ResumeDocument[];
  activeId: string;
  past: ResumeDocument[];
  future: ResumeDocument[];
  hydrated: boolean;
  dirtyBeforeHydrate: boolean;
}

type StoreAction =
  | { type: 'HYDRATE'; stored: ResumeDocument[]; savedActiveId: string | null }
  | { type: 'UPDATE'; updater: ResumeDocument | ((prev: ResumeDocument) => ResumeDocument) }
  | { type: 'UPDATE_TRANSIENT'; updater: ResumeDocument | ((prev: ResumeDocument) => ResumeDocument) }
  | { type: 'PUSH_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SELECT'; id: string }
  | { type: 'ADD'; doc: ResumeDocument }
  | { type: 'RENAME'; id: string; title: string; targetCompany?: string }
  | { type: 'REMOVE'; id: string; fallback: ResumeDocument };

function createInitialState(): StoreState {
  const initial = createDefaultStarterResume('ar');
  return {
    resumes: [initial],
    activeId: initial.id,
    past: [],
    future: [],
    hydrated: false,
    dirtyBeforeHydrate: false,
  };
}

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'HYDRATE': {
      // If user already started editing before IndexedDB resolved, preserve their edits!
      if (state.dirtyBeforeHydrate) {
        return { ...state, hydrated: true };
      }
      if (action.stored.length > 0) {
        const target = action.stored.find((r) => r.id === action.savedActiveId) || action.stored[0];
        return {
          resumes: action.stored,
          activeId: target.id,
          past: [],
          future: [],
          hydrated: true,
          dirtyBeforeHydrate: false,
        };
      }
      return { ...state, hydrated: true };
    }

    case 'UPDATE': {
      const current = state.resumes.find((r) => r.id === state.activeId) || state.resumes[0];
      if (!current) return state;
      const nextRaw =
        typeof action.updater === 'function' ? action.updater(current) : action.updater;
      const next: ResumeDocument = {
        ...nextRaw,
        id: current.id,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        resumes: state.resumes.map((item) => (item.id === current.id ? next : item)),
        past: [...state.past.slice(-(MAX_HISTORY - 1)), current],
        future: [],
        dirtyBeforeHydrate: true,
      };
    }

    case 'PUSH_HISTORY': {
      const current = state.resumes.find((r) => r.id === state.activeId) || state.resumes[0];
      if (!current) return state;
      return {
        ...state,
        past: [...state.past.slice(-(MAX_HISTORY - 1)), current],
        future: [],
      };
    }

    case 'UPDATE_TRANSIENT': {
      const current = state.resumes.find((r) => r.id === state.activeId) || state.resumes[0];
      if (!current) return state;
      const nextRaw =
        typeof action.updater === 'function' ? action.updater(current) : action.updater;
      const next: ResumeDocument = {
        ...nextRaw,
        id: current.id,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        resumes: state.resumes.map((item) => (item.id === current.id ? next : item)),
        dirtyBeforeHydrate: true,
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const restored = state.past[state.past.length - 1];
      const current = state.resumes.find((r) => r.id === restored.id) || state.resumes[0];
      return {
        ...state,
        resumes: state.resumes.map((item) => (item.id === restored.id ? restored : item)),
        past: state.past.slice(0, -1),
        future: current ? [current, ...state.future.slice(0, MAX_HISTORY - 1)] : state.future,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      const current = state.resumes.find((r) => r.id === next.id) || state.resumes[0];
      return {
        ...state,
        resumes: state.resumes.map((item) => (item.id === next.id ? next : item)),
        past: current ? [...state.past.slice(-(MAX_HISTORY - 1)), current] : state.past,
        future: rest,
      };
    }

    case 'SELECT':
      return {
        ...state,
        activeId: action.id,
        past: [],
        future: [],
      };

    case 'ADD':
      return {
        ...state,
        resumes: [action.doc, ...state.resumes],
        activeId: action.doc.id,
        past: [],
        future: [],
        dirtyBeforeHydrate: true,
      };

    case 'RENAME':
      return {
        ...state,
        resumes: state.resumes.map((item) =>
          item.id === action.id
            ? {
                ...item,
                title: action.title.trim() || item.title,
                targetCompany:
                  action.targetCompany !== undefined ? action.targetCompany.trim() : item.targetCompany,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      };

    case 'REMOVE': {
      const remaining = state.resumes.filter((r) => r.id !== action.id);
      if (remaining.length === 0) {
        return {
          ...state,
          resumes: [action.fallback],
          activeId: action.fallback.id,
          past: [],
          future: [],
        };
      }
      return {
        ...state,
        resumes: remaining,
        activeId: state.activeId === action.id ? remaining[0].id : state.activeId,
        past: [],
        future: [],
      };
    }

    default:
      return state;
  }
}

export function useResumeStore() {
  const [state, dispatch] = useReducer(storeReducer, undefined, createInitialState);
  const [saveState, setSaveState] = useState<SaveIndicator>('saved');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeResume = state.resumes.find((r) => r.id === state.activeId) || state.resumes[0];

  // Initial load from IndexedDB (`unitool-cv-studio`)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSavedResumes();
      if (cancelled) return;
      const savedActive = readSafeLocal(ACTIVE_RESUME_KEY);
      dispatch({ type: 'HYDRATE', stored, savedActiveId: savedActive });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist active resume on changes
  useEffect(() => {
    if (!state.hydrated || !activeResume) return;
    setSaveState('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const ok = await saveResumeRecord(activeResume);
      writeSafeLocal(ACTIVE_RESUME_KEY, activeResume.id);
      setSaveState(ok ? 'saved' : 'memory');
    }, 200);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [activeResume, state.hydrated]);

  const updateResume = useCallback(
    (updater: ResumeDocument | ((prev: ResumeDocument) => ResumeDocument)) => {
      dispatch({ type: 'UPDATE', updater });
    },
    [],
  );

  const updateResumeTransient = useCallback(
    (updater: ResumeDocument | ((prev: ResumeDocument) => ResumeDocument)) => {
      dispatch({ type: 'UPDATE_TRANSIENT', updater });
    },
    [],
  );

  const commitHistorySnapshot = useCallback(() => {
    dispatch({ type: 'PUSH_HISTORY' });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const selectResume = useCallback((id: string) => {
    dispatch({ type: 'SELECT', id });
    writeSafeLocal(ACTIVE_RESUME_KEY, id);
  }, []);

  const addResume = useCallback(async (doc: ResumeDocument) => {
    const now = new Date().toISOString();
    const fresh: ResumeDocument = {
      ...doc,
      id: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    await saveResumeRecord(fresh);
    dispatch({ type: 'ADD', doc: fresh });
    writeSafeLocal(ACTIVE_RESUME_KEY, fresh.id);
    return fresh;
  }, []);

  const duplicateResume = useCallback(
    async (sourceId: string, customTitle?: string, customCompany?: string) => {
      const source = state.resumes.find((r) => r.id === sourceId);
      if (!source) return null;
      const clone: ResumeDocument = JSON.parse(JSON.stringify(source));
      const now = new Date().toISOString();
      clone.id = `cv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      clone.title = customTitle?.trim() || `${source.title} (نسخة / Copy)`;
      if (customCompany !== undefined) clone.targetCompany = customCompany.trim();
      clone.createdAt = now;
      clone.updatedAt = now;
      await saveResumeRecord(clone);
      dispatch({ type: 'ADD', doc: clone });
      writeSafeLocal(ACTIVE_RESUME_KEY, clone.id);
      return clone;
    },
    [state.resumes],
  );

  const renameResume = useCallback(async (id: string, title: string, targetCompany?: string) => {
    dispatch({ type: 'RENAME', id, title, targetCompany });
  }, []);

  const removeResume = useCallback(async (id: string) => {
    await deleteResumeRecord(id);
    const fallback = createDefaultStarterResume('ar');
    dispatch({ type: 'REMOVE', id, fallback });
  }, []);

  return {
    resumes: state.resumes,
    activeResume,
    updateResume,
    updateResumeTransient,
    commitHistorySnapshot,
    selectResume,
    addResume,
    duplicateResume,
    renameResume,
    removeResume,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    saveState,
  };
}
