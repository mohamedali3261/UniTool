import type { ResumeDocument, UtcvProjectFile } from './types';

export const CV_DB_NAME = 'unitool-cv-studio';
export const CV_DB_VERSION = 1;
export const CV_STORE_NAME = 'resumes';
export const ACTIVE_RESUME_KEY = 'cv-studio.active-id';
export const UI_LANG_KEY = 'cv-studio.lang';

function openCvDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(CV_DB_NAME, CV_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CV_STORE_NAME)) {
        db.createObjectStore(CV_STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open CV database'));
  });
}

export async function loadSavedResumes(): Promise<ResumeDocument[]> {
  try {
    const db = await openCvDb();
    try {
      const list = await new Promise<ResumeDocument[]>((resolve, reject) => {
        const tx = db.transaction(CV_STORE_NAME, 'readonly');
        const req = tx.objectStore(CV_STORE_NAME).getAll();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => reject(req.error);
      });
      return list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    } finally {
      db.close();
    }
  } catch {
    return [];
  }
}

export async function saveResumeRecord(doc: ResumeDocument): Promise<boolean> {
  try {
    const db = await openCvDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(CV_STORE_NAME, 'readwrite');
        tx.objectStore(CV_STORE_NAME).put(doc);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      return true;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}

export async function deleteResumeRecord(id: string): Promise<boolean> {
  try {
    const db = await openCvDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(CV_STORE_NAME, 'readwrite');
        tx.objectStore(CV_STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}

export function readSafeLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSafeLocal(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function serializeUtcvProject(resume: ResumeDocument): string {
  const payload: UtcvProjectFile = {
    format: 'unitool-cv-studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    resume,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseUtcvProject(raw: string): ResumeDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('ملف غير صالح: ليس ملف JSON سليماً / Invalid JSON file');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('بنية الملف غير مدعومة / Unsupported project structure');
  }
  const obj = parsed as Record<string, any>;
  if (obj.format !== 'unitool-cv-studio' || obj.version !== 1 || !obj.resume || typeof obj.resume !== 'object') {
    throw new Error('هذا الملف ليس مشروع سيرة ذاتية (.utcv.json) من UniTool / Not a valid .utcv.json project');
  }
  const r = obj.resume as ResumeDocument;
  if (!r.personal || typeof r.personal.fullName !== 'string' || !r.design || !Array.isArray(r.sections)) {
    throw new Error('بيانات السيرة الذاتية داخل الملف غير مكتملة / Incomplete resume data in project file');
  }
  const now = new Date().toISOString();
  return {
    ...r,
    id: typeof r.id === 'string' && r.id.trim() ? r.id : `cv-${Date.now()}`,
    title: typeof r.title === 'string' && r.title.trim() ? r.title : r.personal.fullName || 'Imported CV',
    targetCompany: typeof r.targetCompany === 'string' ? r.targetCompany : '',
    createdAt: r.createdAt || now,
    updatedAt: now,
    experience: Array.isArray(r.experience) ? r.experience : [],
    education: Array.isArray(r.education) ? r.education : [],
    certifications: Array.isArray(r.certifications) ? r.certifications : [],
    skills: Array.isArray(r.skills) ? r.skills : [],
    languages: Array.isArray(r.languages) ? r.languages : [],
    projects: Array.isArray(r.projects) ? r.projects : [],
    customSections: Array.isArray(r.customSections) ? r.customSections : [],
    jobDescription: typeof r.jobDescription === 'string' ? r.jobDescription : '',
    canvasElements: Array.isArray(r.canvasElements) ? r.canvasElements : [],
    blockStyles: r.blockStyles && typeof r.blockStyles === 'object' ? r.blockStyles : {},
  };
}
