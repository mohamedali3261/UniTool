import {
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutTemplate,
  LoaderCircle,
  MailCheck,
  Redo2,
  Undo2,
} from 'lucide-react';
import { SiteNavbar } from '../../../src/components/SiteNavbar';
import { SiteAppearanceToggle, useSiteAppearance } from '../../../src/hooks/useSiteAppearance';
import { useCvStudio } from '../app/context';
import type { StudioPageId } from '../core/types';

export function StudioHeader() {
  const { theme, toggleTheme } = useSiteAppearance('cv');
  const {
    lang,
    t,
    toggleLang,
    page,
    navigate,
    resume,
    updateResume,
    atsReport,
    undo,
    redo,
    canUndo,
    canRedo,
    saveState,
    exportPdfNow,
    busyLabel,
  } = useCvStudio();

  const navItems: { id: StudioPageId; ar: string; en: string; icon: typeof FileText; badge?: string }[] = [
    { id: 'editor', ar: 'المحرر والمعاينة', en: 'Editor', icon: FileText },
    { id: 'templates', ar: 'القوالب', en: 'Templates', icon: LayoutTemplate },
    {
      id: 'ats-checker',
      ar: 'فاحص ATS',
      en: 'ATS Checker',
      icon: FileCheck2,
      badge: `${atsReport.totalScore}%`,
    },
    { id: 'cover-letter', ar: 'خطاب التقديم', en: 'Cover Letter', icon: MailCheck },
    { id: 'resumes', ar: 'سيرتي والتصدير', en: 'My Resumes', icon: FolderOpen },
  ];

  return (
    <div className="cv-header-stack no-print">
      <SiteNavbar
        lang={lang}
        onToggleLang={toggleLang}
        actions={<SiteAppearanceToggle theme={theme} onToggle={toggleTheme} lang={lang} />}
      />
      <div className="cv-subbar">
        <div className="cv-subbar-inner">
          <div className="cv-doc-identity">
            <span className="cv-doc-badge" aria-hidden="true">
              <FileText size={17} />
            </span>
            <div className="cv-doc-meta">
              <input
                type="text"
                className="cv-doc-title-input"
                aria-label={t('عنوان السيرة الذاتية', 'Resume document title')}
                value={resume.title}
                maxLength={90}
                onChange={(e) => updateResume((prev) => ({ ...prev, title: e.target.value }))}
              />
              <small className="cv-save-pill">
                {saveState === 'saving' ? (
                  <LoaderCircle size={11} className="cv-spin" />
                ) : (
                  <CheckCircle2 size={11} />
                )}
                <span>
                  {saveState === 'saving'
                    ? t('جاري الحفظ…', 'Saving…')
                    : saveState === 'saved'
                      ? t('محفوظ تلقائياً على جهازك', 'Autosaved on this device')
                      : t('وضع الذاكرة المؤقتة', 'In-memory session')}
                </span>
              </small>
            </div>
          </div>

          <nav className="cv-page-tabs" aria-label={t('أقسام ستوديو السيرة الذاتية', 'CV Studio pages')}>
            {navItems.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`cv-page-tab ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => navigate(item.id)}
                >
                  <item.icon size={15} aria-hidden="true" />
                  <span>{t(item.ar, item.en)}</span>
                  {item.badge && <em className="cv-tab-score">{item.badge}</em>}
                </button>
              );
            })}
          </nav>

          <div className="cv-subbar-actions">
            <button
              type="button"
              className="cv-icon-btn"
              onClick={undo}
              disabled={!canUndo}
              aria-label={t('تراجع (Ctrl+Z)', 'Undo (Ctrl+Z)')}
              title={t('تراجع (Ctrl+Z)', 'Undo (Ctrl+Z)')}
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              className="cv-icon-btn"
              onClick={redo}
              disabled={!canRedo}
              aria-label={t('إعادة (Ctrl+Y)', 'Redo (Ctrl+Y)')}
              title={t('إعادة (Ctrl+Y)', 'Redo (Ctrl+Y)')}
            >
              <Redo2 size={16} />
            </button>
            <button
              type="button"
              data-studio-button="primary"
              className="cv-btn primary"
              disabled={Boolean(busyLabel)}
              onClick={() => void exportPdfNow(page === 'cover-letter' ? 'cover-letter' : 'cv')}
            >
              {busyLabel ? <LoaderCircle size={15} className="cv-spin" /> : <Download size={15} />}
              <span>
                {page === 'cover-letter'
                  ? t('تصدير الخطاب PDF', 'Export Letter PDF')
                  : t('تصدير السيرة PDF', 'Export CV PDF')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
