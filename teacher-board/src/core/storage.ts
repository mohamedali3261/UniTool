import type { BoardSlide, ClassroomState, Lang, LessonDocument } from './types';

const LESSONS_KEY = 'unitool.teacher-board.lessons.v1';
const ACTIVE_KEY = 'unitool.teacher-board.active.v1';
const CLASSROOM_KEY = 'unitool.teacher-board.classroom.v1';

export function uid(prefix = 'tb'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createBlankSlide(index = 1, lang: Lang = 'ar'): BoardSlide {
  return {
    id: uid('slide'),
    title: lang === 'ar' ? `الشريحة ${index}` : `Slide ${index}`,
    surface: 'white',
    grid: 'plain',
    elements: [],
    splitElements: [],
  };
}

export function createStarterLesson(lang: Lang = 'ar'): LessonDocument {
  return {
    id: uid('lesson'),
    title: lang === 'ar' ? 'شرح الدرس الأول' : 'Lesson 1 Board',
    subject: 'math',
    grade: lang === 'ar' ? 'الصف الأول الإعدادي' : 'Grade 7',
    updatedAt: Date.now(),
    slides: [createBlankSlide(1, lang)],
  };
}

export function loadLessons(lang: Lang = 'ar'): LessonDocument[] {
  try {
    const raw = localStorage.getItem(LESSONS_KEY);
    if (!raw) return [createStarterLesson(lang)];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [createStarterLesson(lang)];
    return parsed.filter(
      (doc) =>
        doc &&
        typeof doc.id === 'string' &&
        typeof doc.title === 'string' &&
        Array.isArray(doc.slides) &&
        doc.slides.length > 0
    );
  } catch {
    return [createStarterLesson(lang)];
  }
}

export function saveLessons(lessons: LessonDocument[]): void {
  try {
    localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
  } catch {
    /* quota fallback */
  }
}

export function loadActiveLessonId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveLessonId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function defaultClassroomState(lang: Lang = 'ar'): ClassroomState {
  return {
    students:
      lang === 'ar'
        ? ['أحمد محمد', 'سارة علي', 'عمر خالد', 'مريم حسن', 'يوسف إبراهيم', 'نور محمود', 'سلمى طارق', 'كريم عادل']
        : ['Ahmed', 'Sara', 'Omar', 'Mariam', 'Youssef', 'Nour', 'Salma', 'Karim'],
    pickedHistory: [],
    noRepeatPick: true,
    timerSeconds: 300,
    teams: [
      { id: 'team-1', name: lang === 'ar' ? 'مجموعة النجوم' : 'Team Alpha', score: 0, color: '#24795e' },
      { id: 'team-2', name: lang === 'ar' ? 'مجموعة الإبداع' : 'Team Beta', score: 0, color: '#2563eb' },
      { id: 'team-3', name: lang === 'ar' ? 'مجموعة التميز' : 'Team Gamma', score: 0, color: '#d97706' },
    ],
  };
}

export function loadClassroomState(lang: Lang = 'ar'): ClassroomState {
  try {
    const raw = localStorage.getItem(CLASSROOM_KEY);
    if (!raw) return defaultClassroomState(lang);
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.teams)) {
      return defaultClassroomState(lang);
    }
    return parsed;
  } catch {
    return defaultClassroomState(lang);
  }
}

export function saveClassroomState(state: ClassroomState): void {
  try {
    localStorage.setItem(CLASSROOM_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function serializeLessonFile(lesson: LessonDocument): string {
  return JSON.stringify(
    {
      format: 'unitool-teacher-board',
      version: 1,
      exportedAt: Date.now(),
      lesson,
    },
    null,
    2
  );
}

export function parseLessonFile(raw: string): LessonDocument {
  const data = JSON.parse(raw);
  if (!data || data.format !== 'unitool-teacher-board' || !data.lesson) {
    throw new Error('Invalid teacher board file');
  }
  const src = data.lesson as LessonDocument;
  if (!src.title || !Array.isArray(src.slides) || src.slides.length === 0) {
    throw new Error('Empty lesson slides');
  }
  return {
    ...src,
    id: uid('lesson'),
    updatedAt: Date.now(),
    slides: src.slides.map((s) => ({
      id: uid('slide'),
      title: String(s.title || 'Slide'),
      surface: s.surface || 'white',
      grid: s.grid || 'plain',
      elements: Array.isArray(s.elements) ? s.elements : [],
      splitElements: Array.isArray(s.splitElements) ? s.splitElements : [],
    })),
  };
}
