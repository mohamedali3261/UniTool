import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { copy } from '../core/i18n';
import {
  createBlankSlide,
  createStarterLesson,
  loadActiveLessonId,
  loadClassroomState,
  loadLessons,
  parseLessonFile,
  saveActiveLessonId,
  saveClassroomState,
  saveLessons,
  serializeLessonFile,
  uid,
} from '../core/storage';
import { exportLessonPdf, exportSlidePng } from '../core/exporter';
import { SURFACE_PALETTES } from '../data/boardModes';
import type { SubjectTemplate } from '../data/subjectTemplates';
import type {
  BoardElement,
  BoardGrid,
  BoardSlide,
  BoardSurface,
  ClassroomState,
  GeometryToolState,
  Lang,
  LessonDocument,
  OverlayState,
  StudioRoute,
  SubjectCategory,
  ToolId,
} from '../core/types';

export type ActivePopover =
  | null
  | 'pen'
  | 'shapes'
  | 'geometry'
  | 'insert'
  | 'modes';

export type QuickWidgetType = null | 'timer' | 'picker' | 'scores';

interface BoardContextValue {
  lang: Lang;
  isAr: boolean;
  t: (typeof copy)['ar'] | (typeof copy)['en'];
  toggleLang: () => void;
  route: StudioRoute;
  navigate: (next: StudioRoute) => void;

  lessons: LessonDocument[];
  activeLesson: LessonDocument;
  activeSlideIndex: number;
  activeSlide: BoardSlide;
  selectLesson: (id: string) => void;
  createNewLesson: (opts: {
    title: string;
    subject: Exclude<SubjectCategory, 'all'>;
    grade: string;
    surface?: BoardSurface;
    grid?: BoardGrid;
  }) => void;
  renameLesson: (title: string) => void;
  duplicateLesson: (id: string) => void;
  deleteLesson: (id: string) => void;
  applySubjectTemplate: (tpl: SubjectTemplate) => void;
  importLessonJson: (raw: string) => void;
  exportLessonJson: () => void;

  setSlideIndex: (index: number) => void;
  addSlide: () => void;
  duplicateCurrentSlide: () => void;
  deleteCurrentSlide: () => void;
  clearCurrentSlide: () => void;
  setSlideSurface: (surface: BoardSurface) => void;
  setSlideGrid: (grid: BoardGrid) => void;

  commitSlideElements: (elements: BoardElement[], pane?: 'main' | 'split') => void;
  addBoardElement: (el: BoardElement, pane?: 'main' | 'split') => void;
  deleteElementById: (id: string, pane?: 'main' | 'split') => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  tool: ToolId;
  setTool: (tool: ToolId) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  openPopover: ActivePopover;
  setOpenPopover: React.Dispatch<React.SetStateAction<ActivePopover>>;
  quickWidget: QuickWidgetType;
  setQuickWidget: React.Dispatch<React.SetStateAction<QuickWidgetType>>;

  geometry: GeometryToolState;
  setGeometry: React.Dispatch<React.SetStateAction<GeometryToolState>>;
  overlays: OverlayState;
  setOverlays: React.Dispatch<React.SetStateAction<OverlayState>>;

  classroom: ClassroomState;
  updateClassroom: (updater: (prev: ClassroomState) => ClassroomState) => void;

  exportCurrentPng: () => void;
  exportCurrentPdf: () => void;
  isRecording: boolean;
  toggleRecording: (canvasEl: HTMLCanvasElement | null) => Promise<void>;

  toast: string | null;
  notify: (msg: string) => void;
}

const BoardContext = createContext<BoardContextValue | null>(null);

function readInitialLang(): Lang {
  try {
    const saved = localStorage.getItem('unitool-lang');
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    /* ignore */
  }
  return 'ar';
}

function readHashRoute(): StudioRoute {
  const h = window.location.hash.replace('#', '').trim();
  if (h === 'templates' || h === 'classroom' || h === 'lessons' || h === 'board') {
    return h;
  }
  return 'board';
}

export const BoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(readInitialLang);
  const isAr = lang === 'ar';
  const t = copy[lang];

  const [route, setRoute] = useState<StudioRoute>(readHashRoute);
  const [lessons, setLessons] = useState<LessonDocument[]>(() => loadLessons(readInitialLang()));
  const [activeLessonId, setActiveLessonId] = useState<string>(() => {
    const initial = loadLessons(readInitialLang());
    const savedId = loadActiveLessonId();
    return initial.find((l) => l.id === savedId)?.id || initial[0].id;
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Per-lesson undo/redo stacks of slides snapshots
  const [past, setPast] = useState<BoardSlide[][]>([]);
  const [future, setFuture] = useState<BoardSlide[][]>([]);

  const [tool, setToolState] = useState<ToolId>('pen');
  const [penColor, setPenColor] = useState<string>('#182620');
  const [penSize, setPenSize] = useState<number>(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<ActivePopover>(null);
  const [quickWidget, setQuickWidget] = useState<QuickWidgetType>(null);

  const [geometry, setGeometry] = useState<GeometryToolState>({
    ruler: { visible: false, x: 320, y: 420, angle: 0, lengthPx: 420 },
    protractor: { visible: false, x: 460, y: 260, angle: 0, measureDeg: 45 },
    setSquare: { visible: false, x: 260, y: 240, angle: 0 },
  });

  const [overlays, setOverlays] = useState<OverlayState>({
    spotlight: false,
    curtain: false,
    curtainRatio: 0.55,
    splitBoard: false,
    focusMode: false,
  });

  const [classroom, setClassroom] = useState<ClassroomState>(() => loadClassroomState(readInitialLang()));
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('unitool-lang', lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  useEffect(() => {
    const onHash = () => setRoute(readHashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: StudioRoute) => {
    setRoute(next);
    setOpenPopover(null);
    window.history.replaceState(null, '', `#${next}`);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId) || lessons[0],
    [lessons, activeLessonId]
  );

  const safeSlideIdx = Math.min(activeSlideIndex, Math.max(0, activeLesson.slides.length - 1));
  const activeSlide = activeLesson.slides[safeSlideIdx] || activeLesson.slides[0];

  useEffect(() => {
    saveLessons(lessons);
  }, [lessons]);

  useEffect(() => {
    saveActiveLessonId(activeLesson.id);
  }, [activeLesson.id]);

  const updateClassroom = useCallback((updater: (prev: ClassroomState) => ClassroomState) => {
    setClassroom((prev) => {
      const next = updater(prev);
      saveClassroomState(next);
      return next;
    });
  }, []);

  const updateActiveLessonSlides = useCallback(
    (nextSlides: BoardSlide[], recordHistory = true) => {
      setLessons((prev) =>
        prev.map((doc) => {
          if (doc.id !== activeLesson.id) return doc;
          if (recordHistory) {
            setPast((p) => [...p.slice(-34), doc.slides]);
            setFuture([]);
          }
          return {
            ...doc,
            updatedAt: Date.now(),
            slides: nextSlides,
          };
        })
      );
    },
    [activeLesson.id]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [activeLesson.slides, ...f.slice(0, 34)]);
    updateActiveLessonSlides(previous, false);
    setSelectedId(null);
  }, [past, activeLesson.slides, updateActiveLessonSlides]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p.slice(-34), activeLesson.slides]);
    updateActiveLessonSlides(next, false);
    setSelectedId(null);
  }, [future, activeLesson.slides, updateActiveLessonSlides]);

  const commitSlideElements = useCallback(
    (elements: BoardElement[], pane: 'main' | 'split' = 'main') => {
      const nextSlides = activeLesson.slides.map((s, idx) => {
        if (idx !== safeSlideIdx) return s;
        return pane === 'split'
          ? { ...s, splitElements: elements }
          : { ...s, elements };
      });
      updateActiveLessonSlides(nextSlides, true);
    },
    [activeLesson.slides, safeSlideIdx, updateActiveLessonSlides]
  );

  const addBoardElement = useCallback(
    (el: BoardElement, pane: 'main' | 'split' = 'main') => {
      const list = pane === 'split' ? activeSlide.splitElements : activeSlide.elements;
      commitSlideElements([...list, el], pane);
      setSelectedId(el.id);
    },
    [activeSlide, commitSlideElements]
  );

  const deleteElementById = useCallback(
    (id: string, pane: 'main' | 'split' = 'main') => {
      const list = pane === 'split' ? activeSlide.splitElements : activeSlide.elements;
      commitSlideElements(list.filter((e) => e.id !== id), pane);
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [activeSlide, commitSlideElements]
  );

  const setSlideSurface = useCallback(
    (surface: BoardSurface) => {
      const oldDefault = SURFACE_PALETTES[activeSlide.surface].defaultInk;
      const newDefault = SURFACE_PALETTES[surface].defaultInk;
      if (penColor.toLowerCase() === oldDefault.toLowerCase()) {
        setPenColor(newDefault);
      }
      const nextSlides = activeLesson.slides.map((s, idx) =>
        idx === safeSlideIdx ? { ...s, surface } : s
      );
      updateActiveLessonSlides(nextSlides, true);
    },
    [activeLesson.slides, activeSlide.surface, penColor, safeSlideIdx, updateActiveLessonSlides]
  );

  const setSlideGrid = useCallback(
    (grid: BoardGrid) => {
      const nextSlides = activeLesson.slides.map((s, idx) =>
        idx === safeSlideIdx ? { ...s, grid } : s
      );
      updateActiveLessonSlides(nextSlides, true);
    },
    [activeLesson.slides, safeSlideIdx, updateActiveLessonSlides]
  );

  const addSlide = useCallback(() => {
    const newSlide: BoardSlide = {
      ...createBlankSlide(activeLesson.slides.length + 1, lang),
      surface: activeSlide.surface,
      grid: activeSlide.grid,
    };
    const nextSlides = [...activeLesson.slides, newSlide];
    updateActiveLessonSlides(nextSlides, true);
    setActiveSlideIndex(nextSlides.length - 1);
    setSelectedId(null);
  }, [activeLesson.slides, activeSlide.grid, activeSlide.surface, lang, updateActiveLessonSlides]);

  const duplicateCurrentSlide = useCallback(() => {
    const copySlide: BoardSlide = {
      ...activeSlide,
      id: uid('slide'),
      title: `${activeSlide.title} (2)`,
      elements: activeSlide.elements.map((e) => ({ ...e, id: uid('el') })),
      splitElements: activeSlide.splitElements.map((e) => ({ ...e, id: uid('el') })),
    };
    const nextSlides = [
      ...activeLesson.slides.slice(0, safeSlideIdx + 1),
      copySlide,
      ...activeLesson.slides.slice(safeSlideIdx + 1),
    ];
    updateActiveLessonSlides(nextSlides, true);
    setActiveSlideIndex(safeSlideIdx + 1);
  }, [activeLesson.slides, activeSlide, safeSlideIdx, updateActiveLessonSlides]);

  const deleteCurrentSlide = useCallback(() => {
    if (activeLesson.slides.length <= 1) {
      commitSlideElements([], 'main');
      return;
    }
    const nextSlides = activeLesson.slides.filter((_, idx) => idx !== safeSlideIdx);
    updateActiveLessonSlides(nextSlides, true);
    setActiveSlideIndex(Math.max(0, safeSlideIdx - 1));
    setSelectedId(null);
  }, [activeLesson.slides, commitSlideElements, safeSlideIdx, updateActiveLessonSlides]);

  const clearCurrentSlide = useCallback(() => {
    const nextSlides = activeLesson.slides.map((s, idx) =>
      idx === safeSlideIdx ? { ...s, elements: [], splitElements: [] } : s
    );
    updateActiveLessonSlides(nextSlides, true);
    setSelectedId(null);
  }, [activeLesson.slides, safeSlideIdx, updateActiveLessonSlides]);

  const selectLesson = useCallback((id: string) => {
    setActiveLessonId(id);
    setActiveSlideIndex(0);
    setPast([]);
    setFuture([]);
    setSelectedId(null);
    setRoute('board');
    window.history.replaceState(null, '', '#board');
  }, []);

  const createNewLesson = useCallback(
    (opts: {
      title: string;
      subject: Exclude<SubjectCategory, 'all'>;
      grade: string;
      surface?: BoardSurface;
      grid?: BoardGrid;
    }) => {
      const surface = opts.surface || 'white';
      const firstSlide: BoardSlide = {
        ...createBlankSlide(1, lang),
        surface,
        grid: opts.grid || 'plain',
      };
      const doc: LessonDocument = {
        id: uid('lesson'),
        title: opts.title.trim() || (isAr ? 'درس جديد' : 'New Lesson'),
        subject: opts.subject,
        grade: opts.grade.trim() || (isAr ? 'عام' : 'General'),
        updatedAt: Date.now(),
        slides: [firstSlide],
      };
      setLessons((prev) => [doc, ...prev]);
      setActiveLessonId(doc.id);
      setActiveSlideIndex(0);
      setPenColor(SURFACE_PALETTES[surface].defaultInk);
      setPast([]);
      setFuture([]);
      navigate('board');
      notify(isAr ? 'تم إنشاء سبورة الدرس بنجاح' : 'New lesson board created');
    },
    [isAr, lang, navigate, notify]
  );

  const renameLesson = useCallback(
    (title: string) => {
      setLessons((prev) =>
        prev.map((l) => (l.id === activeLesson.id ? { ...l, title, updatedAt: Date.now() } : l))
      );
    },
    [activeLesson.id]
  );

  const duplicateLesson = useCallback(
    (id: string) => {
      const target = lessons.find((l) => l.id === id);
      if (!target) return;
      const copyDoc: LessonDocument = {
        ...target,
        id: uid('lesson'),
        title: `${target.title} (${isAr ? 'نسخة' : 'Copy'})`,
        updatedAt: Date.now(),
        slides: target.slides.map((s) => ({ ...s, id: uid('slide') })),
      };
      setLessons((prev) => [copyDoc, ...prev]);
      notify(isAr ? 'تم تكرار الدرس' : 'Lesson duplicated');
    },
    [isAr, lessons, notify]
  );

  const deleteLesson = useCallback(
    (id: string) => {
      setLessons((prev) => {
        const filtered = prev.filter((l) => l.id !== id);
        if (filtered.length === 0) {
          const fresh = createStarterLesson(lang);
          setActiveLessonId(fresh.id);
          return [fresh];
        }
        if (id === activeLesson.id) {
          setActiveLessonId(filtered[0].id);
        }
        return filtered;
      });
      notify(isAr ? 'تم حذف الدرس' : 'Lesson deleted');
    },
    [activeLesson.id, isAr, lang, notify]
  );

  const applySubjectTemplate = useCallback(
    (tpl: SubjectTemplate) => {
      const targetW = typeof window !== 'undefined' ? Math.max(330, Math.min(1180, window.innerWidth - 36)) : 1100;
      const scale = Math.min(1, targetW / 1160);
      const rawEls = tpl.buildElements(isAr);
      const elements: BoardElement[] =
        targetW < 700
          ? (() => {
              // Clean vertical mobile flow with natural crisp font size — zero horizontal squishing!
              let curY = 22;
              const cardW = targetW - 36;
              return rawEls.map((el) => {
                if (el.kind === 'stroke') return { ...el, id: uid('tpl') };
                const h = el.kind === 'text' ? 46 : el.kind === 'shape' ? Math.min(130, el.h) : 96;
                const mapped: BoardElement =
                  el.kind === 'shape'
                    ? { ...el, id: uid('tpl'), x: 18, y: curY, w: cardW, h }
                    : el.kind === 'image'
                      ? { ...el, id: uid('tpl'), x: 18, y: curY, w: cardW, h: 160 }
                      : {
                          ...el,
                          id: uid('tpl'),
                          x: 18,
                          y: curY,
                          w: cardW,
                          h,
                          fontSize: el.kind === 'text' ? 19 : 15,
                        };
                curY += h + 12;
                return mapped;
              });
            })()
          : rawEls.map((el) =>
              el.kind === 'stroke'
                ? { ...el, id: uid('tpl') }
                : {
                    ...el,
                    id: uid('tpl'),
                    x: Math.round(el.x * scale),
                    w: Math.round(el.w * scale),
                  }
            );
      const slide: BoardSlide = {
        id: uid('slide'),
        title: isAr ? tpl.titleAr : tpl.titleEn,
        surface: tpl.surface,
        grid: tpl.grid,
        elements,
        splitElements: [],
      };
      const doc: LessonDocument = {
        id: uid('lesson'),
        title: isAr ? tpl.titleAr : tpl.titleEn,
        subject: tpl.subject,
        grade: isAr ? tpl.gradeAr : tpl.gradeEn,
        updatedAt: Date.now(),
        slides: [slide],
      };
      setLessons((prev) => [doc, ...prev]);
      setActiveLessonId(doc.id);
      setActiveSlideIndex(0);
      setPenColor(SURFACE_PALETTES[tpl.surface].defaultInk);
      setPast([]);
      setFuture([]);
      navigate('board');
      notify(isAr ? 'تم تجهيز القالب على السبورة' : 'Template loaded onto Smartboard');
    },
    [isAr, navigate, notify]
  );

  const importLessonJson = useCallback(
    (raw: string) => {
      try {
        const doc = parseLessonFile(raw);
        setLessons((prev) => [doc, ...prev]);
        setActiveLessonId(doc.id);
        setActiveSlideIndex(0);
        setPast([]);
        setFuture([]);
        navigate('board');
        notify(isAr ? 'تم استيراد ملف الدرس بنجاح' : 'Lesson file imported');
      } catch {
        notify(isAr ? 'ملف غير صالح لسبورة المعلم' : 'Invalid teacher board file');
      }
    },
    [isAr, navigate, notify]
  );

  const exportLessonJson = useCallback(() => {
    const json = serializeLessonFile(activeLesson);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeLesson.title || 'lesson').replace(/[^\w\u0600-\u06FF-]+/g, '-')}.utboard.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(isAr ? 'تم تصدير ملف الدرس' : 'Lesson file exported');
  }, [activeLesson, isAr, notify]);

  const exportCurrentPng = useCallback(() => {
    exportSlidePng(activeSlide, activeLesson.title, safeSlideIdx);
    notify(isAr ? 'تم حفظ صورة السبورة PNG' : 'Board PNG saved');
  }, [activeLesson.title, activeSlide, isAr, notify, safeSlideIdx]);

  const exportCurrentPdf = useCallback(() => {
    exportLessonPdf(activeLesson);
    notify(isAr ? 'تم تصدير جميع شرائح الدرس PDF' : 'Lesson slides exported as PDF');
  }, [activeLesson, isAr, notify]);

  const toggleRecording = useCallback(
    async (canvasEl: HTMLCanvasElement | null) => {
      if (isRecording && recorderRef.current) {
        recorderRef.current.stop();
        setIsRecording(false);
        return;
      }
      if (!canvasEl || typeof canvasEl.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
        notify(isAr ? 'التسجيل غير مدعوم في هذا المتصفح' : 'Recording not supported in this browser');
        return;
      }
      try {
        const canvasStream = canvasEl.captureStream(30);
        try {
          if (navigator.mediaDevices?.getUserMedia) {
            const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
            mic.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
          }
        } catch {
          /* record board video even without mic permission */
        }
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(canvasStream);
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${(activeLesson.title || 'lesson').replace(/[^\w\u0600-\u06FF-]+/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          canvasStream.getTracks().forEach((tr) => tr.stop());
          notify(isAr ? 'تم حفظ فيديو الشرح بنجاح' : 'Lesson recording saved');
        };
        recorderRef.current = recorder;
        recorder.start(500);
        setIsRecording(true);
        notify(isAr ? 'بدأ تسجيل شرح السبورة…' : 'Recording Smartboard lesson…');
      } catch {
        notify(isAr ? 'تعذر بدء التسجيل' : 'Could not start recording');
      }
    },
    [activeLesson.title, isAr, isRecording, notify]
  );

  const setTool = useCallback((next: ToolId) => {
    setToolState(next);
    if (next !== 'select') setSelectedId(null);
  }, []);

  const value: BoardContextValue = {
    lang,
    isAr,
    t,
    toggleLang,
    route,
    navigate,
    lessons,
    activeLesson,
    activeSlideIndex: safeSlideIdx,
    activeSlide,
    selectLesson,
    createNewLesson,
    renameLesson,
    duplicateLesson,
    deleteLesson,
    applySubjectTemplate,
    importLessonJson,
    exportLessonJson,
    setSlideIndex: setActiveSlideIndex,
    addSlide,
    duplicateCurrentSlide,
    deleteCurrentSlide,
    clearCurrentSlide,
    setSlideSurface,
    setSlideGrid,
    commitSlideElements,
    addBoardElement,
    deleteElementById,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    tool,
    setTool,
    penColor,
    setPenColor,
    penSize,
    setPenSize,
    selectedId,
    setSelectedId,
    openPopover,
    setOpenPopover,
    quickWidget,
    setQuickWidget,
    geometry,
    setGeometry,
    overlays,
    setOverlays,
    classroom,
    updateClassroom,
    exportCurrentPng,
    exportCurrentPdf,
    isRecording,
    toggleRecording,
    toast,
    notify,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export function useBoard(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoard must be used inside BoardProvider');
  return ctx;
}
