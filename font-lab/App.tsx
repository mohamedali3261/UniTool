/**
 * Font Lab — الصفحة الرئيسية للاستوديو.
 *
 * هذا الملف يربط الأقسام فقط (Shell + Layout). كل قسم مسؤول عن ملفه الخاص في
 * مجلده: topbar / glyphrail / inspector / library / stage / preview / metrics /
 * shapes / kerning / export / history / projects / checks / docs.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Keyboard, X } from 'lucide-react';
import { FontLabProvider, useFontLab } from './state/FontLabContext';
import { SiteNavbar } from '../src/components/SiteNavbar';
import { SiteAppearanceToggle, useDocumentAppearance } from '../src/hooks/useSiteAppearance';
import { canRedo, canUndo } from './core/history';
import { glyphState, saveProjectToList, readStoredProjects, writeStoredProjects } from './core/project';
import { OutlineStage } from './canvas/stage/OutlineStage';
import { TopBar } from './sections/topbar/TopBar';
import { GlyphRail } from './sections/glyphrail/GlyphRail';
import { Inspector } from './sections/inspector/Inspector';
import { FontLibrary } from './sections/library/FontLibrary';
import { PreviewDesk } from './sections/preview/PreviewDesk';
import { MetricsPanel } from './sections/metrics/MetricsPanel';
import { ShapeLibrary } from './sections/shapes/ShapeLibrary';
import { NodeOps } from './sections/nodeops/NodeOps';
import { KerningStudio } from './sections/kerning/KerningStudio';
import { ExportPanel } from './sections/export/ExportPanel';
import { HistoryPanel } from './sections/history/HistoryPanel';
import { ProjectsPanel } from './sections/projects/ProjectsPanel';
import { FidelityPanel } from './sections/checks/FidelityPanel';
import { DocsPanel } from './sections/docs/DocsPanel';
import { ShortcutBar } from './sections/shortcuts/ShortcutBar';
import { deletePoints } from './core/outline';

type TabId = 'edit' | 'fonts' | 'preview' | 'kerning' | 'export' | 'history' | 'projects' | 'docs';

const TABS: Array<{ id: TabId; ar: string; en: string }> = [
  { id: 'edit', ar: 'المحرر', en: 'Editor' },
  { id: 'fonts', ar: 'الخطوط', en: 'Fonts' },
  { id: 'preview', ar: 'المعاينة', en: 'Preview' },
  { id: 'kerning', ar: 'المسافات', en: 'Kerning' },
  { id: 'export', ar: 'التصدير', en: 'Export' },
  { id: 'history', ar: 'السجل', en: 'History' },
  { id: 'projects', ar: 'المشاريع', en: 'Projects' },
  { id: 'docs', ar: 'الدليل', en: 'Guide' },
];

function LabShell() {
  const { state, dispatch, font, ar, loading, error, t } = useFontLab();
  const [tab, setTab] = useState<TabId>('edit');
  const [notice, setNotice] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(true);

  // the shared site chrome follows the studio theme, like every other workspace
  useDocumentAppearance(state.theme, 'font-lab');
  const toggleLang = () => dispatch({ type: 'lang', value: ar ? 'en' : 'ar' });
  const toggleTheme = () => dispatch({ type: 'theme', value: state.theme === 'dark' ? 'light' : 'dark' });

  const selected = font && state.selection.glyph ? font.glyphs.get(state.selection.glyph) : null;
  const current = selected ? glyphState(state.doc, selected) : null;
  const original = selected?.contours ?? [];

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((value) => (value === message ? null : value)), 3200);
  }, []);

  const save = useCallback(() => {
    const projects = readStoredProjects();
    const list = saveProjectToList(projects, `${state.doc.family} ${new Date().toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}`, state.doc);
    writeStoredProjects(list);
    dispatch({ type: 'saved', count: list.length });
    notify(t('تم حفظ المشروع في هذا المتصفح.', 'Project saved in this browser.'));
  }, [state.doc, dispatch, notify, ar, t]);

  const handleContours = useCallback(
    (contours: import('./core/fontEngine').GlyphContour[], labelAr: string, labelEn: string) => {
      if (!state.selection.glyph) return;
      dispatch({ type: 'contours', name: state.selection.glyph, contours, labelAr, labelEn });
    },
    [dispatch, state.selection.glyph],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
        return;
      }
      if (meta && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
        return;
      }
      if (meta && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        setTab('export');
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!current || state.selection.nodes.length === 0) return;
        event.preventDefault();
        dispatch({
          type: 'contours',
          name: state.selection.glyph!,
          contours: deletePoints(current.contours, new Set(state.selection.nodes)),
          labelAr: 'حذف نقاط',
          labelEn: 'Deleted nodes',
        });
        dispatch({ type: 'selectNodes', nodes: [] });
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'v') dispatch({ type: 'tool', value: 'select' });
      if (key === 'p') dispatch({ type: 'tool', value: 'pen' });
      if (key === 'l') dispatch({ type: 'tool', value: 'lasso' });
      if (key === 'h') dispatch({ type: 'tool', value: 'pan' });
      if (key === 'z') dispatch({ type: 'tool', value: 'zoom' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, save, current, state.selection.nodes, state.selection.glyph]);

  const stage = useMemo(
    () =>
      selected && current && font ? (
        <OutlineStage
          shape={{ ...selected, contours: current.contours, advanceWidth: current.advanceWidth }}
          original={original}
          advance={current.advanceWidth}
          upm={state.doc.metrics.unitsPerEm}
          metrics={state.doc.metrics}
          userGuides={state.doc.guides.vertical}
          tool={state.tool}
          zoom={state.zoom}
          pan={state.pan}
          selection={state.selection.nodes}
          showMetrics={state.showMetrics}
          showGrid={state.showGrid}
          compare={state.compare !== 'none'}
          lang={state.lang}
          canUndo={canUndo(state.history)}
          canRedo={canRedo(state.history)}
          onTool={(tool) => dispatch({ type: 'tool', value: tool })}
          onZoom={(zoom, pan) => {
            dispatch({ type: 'zoom', value: zoom });
            if (pan) dispatch({ type: 'pan', value: pan });
          }}
          onPan={(pan) => dispatch({ type: 'pan', value: pan })}
          onSelection={(nodes, contour) => dispatch({ type: 'selectNodes', nodes, contour })}
          onContours={handleContours}
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
          onToggleMetrics={() => dispatch({ type: 'toggleMetrics' })}
          onToggleGrid={() => dispatch({ type: 'toggleGrid' })}
          onToggleCompare={() => dispatch({ type: 'compare', value: state.compare === 'none' ? 'ghost' : 'none' })}
          onAddGuide={() => undefined}
        />
      ) : null,
    [selected, current, font, original, state, dispatch, handleContours],
  );

  return (
    <div className={`fl-app is-${state.theme}`} dir={ar ? 'rtl' : 'ltr'} lang={state.lang}>
      <SiteNavbar
        lang={state.lang}
        onToggleLang={toggleLang}
        actions={<SiteAppearanceToggle theme={state.theme} onToggle={toggleTheme} lang={state.lang} />}
      />
      <TopBar
        canUndo={canUndo(state.history)}
        canRedo={canRedo(state.history)}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onSave={save}
        onOpenProjects={() => setTab('projects')}
        onImportFont={() => setTab('fonts')}
        onExport={() => setTab('export')}
        onOpenDocs={() => setTab('docs')}
      />

      <nav className="fl-tabs" aria-label={ar ? 'أقسام الاستوديو' : 'Studio sections'}>
        {TABS.map((entry) => (
          <button key={entry.id} type="button" aria-current={tab === entry.id ? 'page' : undefined} className={tab === entry.id ? 'is-active' : ''} onClick={() => setTab(entry.id)}>
            {ar ? entry.ar : entry.en}
          </button>
        ))}
        <button type="button" className="fl-tabs-shortcuts" onClick={() => setShowShortcuts((value) => !value)} aria-pressed={showShortcuts} title={ar ? 'اختصارات' : 'Shortcuts'}>
          <Keyboard size={14} />
        </button>
      </nav>

      {error ? (
        <div className="fl-error" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button type="button" onClick={() => setTab('fonts')} aria-label={ar ? 'فتح مكتبة الخطوط' : 'Open font library'}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      <main className="fl-main">
        {tab === 'edit' ? (
          <div className="fl-workspace">
            <GlyphRail />
            <div className="fl-workspace-stage">
              <div className="fl-stage-header">
                <span className="fl-stage-title">
                  {selected ? `${selected.name} · ${state.doc.metrics.unitsPerEm} upm` : loading ? t('جارٍ تحميل الخط…', 'Loading font…') : t('اختر حرفاً', 'Pick a glyph')}
                </span>
                <span className="fl-stage-status">
                  {state.tool === 'select' ? (ar ? 'تحديد' : 'Select') : state.tool === 'pen' ? (ar ? 'قلم' : 'Pen') : state.tool === 'lasso' ? (ar ? 'لاسو' : 'Lasso') : state.tool === 'pan' ? (ar ? 'تحريك' : 'Pan') : ar ? 'تكبير' : 'Zoom'}
                  {' · '}
                  {state.selection.nodes.length} {ar ? 'نقطة' : 'nodes'}
                </span>
              </div>
              <div className="fl-stage-body">{stage}</div>
            </div>
            <div className="fl-workspace-panels">
              <Inspector />
              <NodeOps />
              <ShapeLibrary onNotice={notify} />
              <MetricsPanel />
              <FidelityPanel />
            </div>
          </div>
        ) : null}

        {tab === 'fonts' ? <FontLibrary /> : null}
        {tab === 'preview' ? <PreviewDesk /> : null}
        {tab === 'kerning' ? <KerningStudio /> : null}
        {tab === 'export' ? <ExportPanel /> : null}
        {tab === 'history' ? <HistoryPanel /> : null}
        {tab === 'projects' ? <ProjectsPanel onNotice={notify} /> : null}
        {tab === 'docs' ? <DocsPanel /> : null}
      </main>

      <footer className="fl-footer">
        <ShortcutBar show={showShortcuts} onHide={() => setShowShortcuts(false)} />
      </footer>

      {notice ? (
        <div className="fl-toast" role="status">
          {notice}
        </div>
      ) : null}
    </div>
  );
}

export default function FontLabApp() {
  return (
    <FontLabProvider>
      <LabShell />
    </FontLabProvider>
  );
}
