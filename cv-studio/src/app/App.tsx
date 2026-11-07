import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalmToast } from '../components/CalmToast';
import { StudioHeader } from '../components/StudioHeader';
import { evaluateAts } from '../core/atsEngine';
import { exportProjectUtcv, exportSheetsToPdf, exportSheetsToPng } from '../core/exportEngine';
import { tr } from '../core/i18n';
import { parseUtcvProject, readSafeLocal, UI_LANG_KEY, writeSafeLocal } from '../core/storage';
import type { StudioPageId, TemplatePreset, UiLang } from '../core/types';
import { applyTemplatePreservingData, createResumeFromTemplate } from '../data/templates';
import { AtsCheckerPage } from '../pages/ats-checker/AtsCheckerPage';
import { CoverLetterPage } from '../pages/cover-letter/CoverLetterPage';
import { EditorPage } from '../pages/editor/EditorPage';
import { ResumesPage } from '../pages/resumes/ResumesPage';
import { TemplatesPage } from '../pages/templates/TemplatesPage';
import { CvStudioContext, type CvStudioContextValue } from './context';
import './styles.css';
import { useResumeStore } from './useResumeStore';
import { useStudioShortcuts } from './useShortcuts';

function readInitialPage(): StudioPageId {
  const hash = location.hash.replace(/^#/, '');
  if (
    hash === 'templates' ||
    hash === 'ats-checker' ||
    hash === 'cover-letter' ||
    hash === 'resumes'
  ) {
    return hash;
  }
  return 'editor';
}

export default function App() {
  const store = useResumeStore();
  const [lang, setLang] = useState<UiLang>(() => {
    const saved = readSafeLocal(UI_LANG_KEY) || readSafeLocal('unitool-lang');
    return saved === 'en' ? 'en' : 'ar';
  });
  const [page, setPage] = useState<StudioPageId>(readInitialPage);
  const [toast, setToast] = useState('');
  const [busyLabel, setBusyLabel] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const t = useCallback((ar: string, en: string) => tr(lang, ar, en), [lang]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4200);
  }, []);

  const navigate = useCallback((next: StudioPageId) => {
    try {
      location.hash = next;
    } catch {
      /* ignore */
    }
    setPage(next);
  }, []);

  useEffect(() => {
    const onHash = () => setPage(readInitialPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title =
      lang === 'ar'
        ? 'ستوديو السيرة الذاتية الاحترافية | UniTool'
        : 'CV & Cover Letter Studio | UniTool';
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: UiLang = prev === 'ar' ? 'en' : 'ar';
      writeSafeLocal(UI_LANG_KEY, next);
      writeSafeLocal('unitool-lang', next);
      return next;
    });
  }, []);

  const exportUtcvNow = useCallback(() => {
    exportProjectUtcv(store.activeResume);
    notify(t('تم تنزيل ملف المشروع (.utcv.json)', 'Project file (.utcv.json) downloaded'));
  }, [store.activeResume, notify, t]);

  useStudioShortcuts({
    onUndo: () => {
      if (store.canUndo) {
        store.undo();
        notify(t('تم التراجع عن آخر تعديل', 'Undid last change'));
      }
    },
    onRedo: () => {
      if (store.canRedo) {
        store.redo();
        notify(t('تمت إعادة التعديل', 'Redid change'));
      }
    },
    onSaveProject: exportUtcvNow,
  });

  const exportPdfNow = useCallback(
    async (kind: 'cv' | 'cover-letter' = 'cv') => {
      setBusyLabel(t('جاري تجهيز ملف PDF…', 'Generating crisp PDF…'));
      try {
        const selector = kind === 'cover-letter' ? '[data-cl-sheet]' : '[data-cv-sheet]';
        // If user triggers CV PDF from another tab (e.g., Resumes), ensure sheet exists or navigate
        if (!document.querySelector(selector)) {
          navigate(kind === 'cover-letter' ? 'cover-letter' : 'editor');
          await new Promise((r) => setTimeout(r, 120));
        }
        const suffix = kind === 'cover-letter' ? '-Cover-Letter' : '';
        await exportSheetsToPdf({
          selector,
          filename: `${store.activeResume.title || store.activeResume.personal.fullName}${suffix}`,
          paperSize: store.activeResume.design.paperSize,
          title: store.activeResume.title,
        });
        notify(t('تم تصدير ملف PDF بنجاح', 'PDF exported successfully'));
      } catch (err: any) {
        notify(err?.message || t('تعذر تصدير PDF', 'PDF export failed'));
      } finally {
        setBusyLabel('');
      }
    },
    [store.activeResume, navigate, notify, t],
  );

  const exportPngNow = useCallback(
    async (kind: 'cv' | 'cover-letter' = 'cv') => {
      setBusyLabel(t('جاري تجهيز صورة PNG…', 'Rendering high-res PNG…'));
      try {
        const selector = kind === 'cover-letter' ? '[data-cl-sheet]' : '[data-cv-sheet]';
        if (!document.querySelector(selector)) {
          navigate(kind === 'cover-letter' ? 'cover-letter' : 'editor');
          await new Promise((r) => setTimeout(r, 120));
        }
        const suffix = kind === 'cover-letter' ? '-Cover-Letter' : '';
        await exportSheetsToPng({
          selector,
          filename: `${store.activeResume.title || store.activeResume.personal.fullName}${suffix}`,
          paperSize: store.activeResume.design.paperSize,
        });
        notify(t('تم تصدير الصورة PNG بنجاح', 'High-res PNG exported'));
      } catch (err: any) {
        notify(err?.message || t('تعذر تصدير الصورة', 'PNG export failed'));
      } finally {
        setBusyLabel('');
      }
    },
    [store.activeResume, navigate, notify, t],
  );

  const applyTemplateKeepData = useCallback(
    (template: TemplatePreset) => {
      store.updateResume((prev) => applyTemplatePreservingData(prev, template));
      notify(
        t(
          `تم تطبيق قالب «${template.nameAr}» مع الحفاظ الكامل على بياناتك`,
          `Applied "${template.nameEn}" without losing your written data`,
        ),
      );
      navigate('editor');
    },
    [store, notify, t, navigate],
  );

  const applyTemplateWithSample = useCallback(
    async (template: TemplatePreset) => {
      const created = createResumeFromTemplate(template, store.activeResume.design.paperLang);
      await store.addResume(created);
      notify(
        t(
          `تم إنشاء نسخة جديدة ببيانات قالب «${template.nameAr}»`,
          `Created a new resume using "${template.nameEn}" sample`,
        ),
      );
      navigate('editor');
    },
    [store, notify, t, navigate],
  );

  const atsReport = useMemo(() => evaluateAts(store.activeResume), [store.activeResume]);

  const ctxValue: CvStudioContextValue = {
    lang,
    t,
    toggleLang,
    page,
    navigate,
    resume: store.activeResume,
    resumes: store.resumes,
    updateResume: store.updateResume,
    selectResume: store.selectResume,
    addResume: store.addResume,
    duplicateResume: store.duplicateResume,
    renameResume: store.renameResume,
    removeResume: store.removeResume,
    applyTemplateKeepData,
    applyTemplateWithSample,
    atsReport,
    undo: store.undo,
    redo: store.redo,
    canUndo: store.canUndo,
    canRedo: store.canRedo,
    saveState: store.saveState,
    notify,
    triggerImportFile: () => importInputRef.current?.click(),
    exportPdfNow,
    exportPngNow,
    exportUtcvNow,
    busyLabel,
  };

  return (
    <CvStudioContext.Provider value={ctxValue}>
      <div className="cv-studio-app" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <StudioHeader />
        <main className="cv-studio-main">
          {page === 'editor' && <EditorPage />}
          {page === 'templates' && <TemplatesPage />}
          {page === 'ats-checker' && <AtsCheckerPage />}
          {page === 'cover-letter' && <CoverLetterPage />}
          {page === 'resumes' && <ResumesPage />}
        </main>

        <input
          hidden
          ref={importInputRef}
          type="file"
          accept=".json,.utcv.json,application/json"
          aria-label={t('استيراد ملف مشروع سيرة ذاتية', 'Import resume project file')}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              const raw = await file.text();
              const parsed = parseUtcvProject(raw);
              await store.addResume(parsed);
              navigate('editor');
              notify(t('تم استيراد السيرة الذاتية وفتحها بنجاح', 'Resume project imported successfully'));
            } catch (err: any) {
              notify(err?.message || t('تعذر قراءة ملف المشروع', 'Could not import project file'));
            }
          }}
        />

        <CalmToast
          message={busyLabel || toast}
          onDismiss={() => setToast('')}
          dismissLabel={t('إغلاق التنبيه', 'Dismiss notification')}
        />
      </div>
    </CvStudioContext.Provider>
  );
}
