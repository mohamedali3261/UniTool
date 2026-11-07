import React from 'react';
import {
  Presentation,
  LayoutTemplate,
  Users,
  FolderOpen,
  Maximize2,
  Minimize2,
  Download,
  FileDown,
  CheckCircle2,
} from 'lucide-react';
import { SiteNavbar } from '../../../src/components/SiteNavbar';
import { SiteAppearanceToggle, useSiteAppearance } from '../../../src/hooks/useSiteAppearance';
import { useBoard } from '../app/BoardContext';
import type { StudioRoute } from '../core/types';

export const StudioHeader: React.FC = () => {
  const { theme, toggleTheme } = useSiteAppearance('teacher-board');
  const {
    lang,
    isAr,
    t,
    toggleLang,
    route,
    navigate,
    activeLesson,
    renameLesson,
    overlays,
    setOverlays,
    exportCurrentPng,
    exportCurrentPdf,
  } = useBoard();

  const tabs: { id: StudioRoute; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'board', label: t.navBoard, shortLabel: isAr ? 'السبورة' : 'Board', icon: <Presentation size={14} /> },
    { id: 'templates', label: t.navTemplates, shortLabel: isAr ? 'القوالب' : 'Templates', icon: <LayoutTemplate size={14} /> },
    { id: 'classroom', label: t.navClassroom, shortLabel: isAr ? 'الفصل' : 'Class', icon: <Users size={14} /> },
    { id: 'lessons', label: t.navLessons, shortLabel: isAr ? 'دروسي' : 'Lessons', icon: <FolderOpen size={14} /> },
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <>
      {!overlays.focusMode && (
        <SiteNavbar
          lang={lang}
          onToggleLang={toggleLang}
          actions={<SiteAppearanceToggle theme={theme} onToggle={toggleTheme} lang={lang} />}
        />
      )}

      {!overlays.focusMode ? (
        <header className="tb-subheader" data-testid="tb-studio-header">
          <div className="tb-subheader__brand">
            <span className="tb-brand-badge" aria-hidden="true">
              <Presentation size={16} />
            </span>
            <input
              type="text"
              value={activeLesson.title}
              onChange={(e) => renameLesson(e.target.value)}
              aria-label={isAr ? 'عنوان الدرس' : 'Lesson title'}
              className="tb-lesson-title-input"
            />
            <span className="tb-autosave-pill" title={t.savedToast}>
              <CheckCircle2 size={13} />
              <span className="tb-hide-sm">{isAr ? 'محفوظ' : 'Saved'}</span>
            </span>
          </div>

          <nav className="tb-nav-tabs" aria-label={isAr ? 'صفحات الاستوديو' : 'Studio pages'}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`tb-tab-${tab.id}`}
                onClick={() => navigate(tab.id)}
                className={`tb-nav-tab ${route === tab.id ? 'is-active' : ''}`}
              >
                {tab.icon}
                <span className="tb-tab-full">{tab.label}</span>
                <span className="tb-tab-short">{tab.shortLabel}</span>
              </button>
            ))}
          </nav>

          <div className="tb-subheader__actions">
            <button
              type="button"
              onClick={exportCurrentPng}
              className="tb-btn tb-btn--ghost"
              title={t.exportPng}
              aria-label={t.exportPng}
            >
              <Download size={14} />
              <span className="tb-hide-md">PNG</span>
            </button>

            <button
              type="button"
              onClick={exportCurrentPdf}
              className="tb-btn tb-btn--primary"
              title={t.exportPdf}
            >
              <FileDown size={14} />
              <span className="tb-hide-sm">PDF</span>
            </button>

            {route === 'board' && (
              <button
                type="button"
                data-testid="tb-focus-toggle"
                onClick={() => setOverlays((o) => ({ ...o, focusMode: true }))}
                className="tb-btn tb-btn--ghost"
                title={t.focusMode}
              >
                <Maximize2 size={14} />
                <span className="tb-hide-lg">{t.focusMode}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="tb-btn tb-btn--ghost tb-hide-sm"
              title={t.fullscreen}
              aria-label={t.fullscreen}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </header>
      ) : (
        <button
          type="button"
          data-testid="tb-exit-focus"
          onClick={() => setOverlays((o) => ({ ...o, focusMode: false }))}
          className="tb-exit-focus-pill"
        >
          <Minimize2 size={14} />
          <span>{t.exitFocus}</span>
        </button>
      )}
    </>
  );
};
