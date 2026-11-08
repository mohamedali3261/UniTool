import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Grid3X3,
  ImagePlus,
  Layers,
  Magnet,
  Maximize2,
  Minimize2,
  MousePointerClick,
  PenTool,
  Printer,
  RotateCcw,
  Shapes,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCvStudio } from '../../app/context';
import { LAYOUT_MODE_LABELS } from '../../core/i18n';
import { computeOnePageAdjustments, getPaperDimensions, paginateResume } from '../../core/pagination';
import type { CanvasElement, EditorSectionKey, ResumeDocument, WorkspaceViewMode } from '../../core/types';
import { resolveTemplateModuleForDoc } from '../../data/templates';
import { resolveFontFamily } from '../../data/themes';
import { RenderPageFrame, type SheetInteractiveCallbacks } from '../../templates/TemplateBlockHelpers';
import {
  createCanvasImageElement,
  createCanvasShapeElement,
  createCanvasTextElement,
  nextElementZIndex,
} from './canvas/canvasDefaults';
import { CanvasOverlayLayer } from './canvas/CanvasOverlayLayer';
import { SignaturePadModal } from './canvas/SignaturePadModal';

export function ResumeSheetCanvas({
  doc,
  canvas,
  onFocusInspector,
}: {
  doc: ResumeDocument;
  canvas?: SheetInteractiveCallbacks;
  onFocusInspector?: () => void;
}) {
  const dims = getPaperDimensions(doc.design.paperSize);
  const pages = useMemo(() => paginateResume(doc), [doc]);
  const onePageFit = useMemo(
    () => (doc.design.layoutMode === 'one-page' ? computeOnePageAdjustments(doc) : null),
    [doc],
  );

  const tplModule = useMemo(() => resolveTemplateModuleForDoc(doc), [doc]);
  const isAts = doc.design.layoutMode === 'ats';

  const effectiveMargin = onePageFit ? onePageFit.effectiveMarginMm : doc.design.marginMm;
  const effectiveScale = onePageFit ? onePageFit.effectiveFontScale : doc.design.fontScale;
  const effectiveLh = onePageFit ? onePageFit.effectiveLineHeight : doc.design.lineHeight;
  const gapScale = onePageFit ? onePageFit.gapScale : 1;
  const accent = isAts ? doc.design.accentColor || '#111827' : doc.design.accentColor || '#24795e';
  const fontCss = resolveFontFamily(doc.design.fontFamily);

  return (
    <div className="cvp-pages-stack">
      {pages.map((pg, idx) => {
        const sheetStyle: React.CSSProperties = {
          position: 'relative',
          width: `${dims.widthPx}px`,
          minHeight: `${dims.heightPx}px`,
          maxHeight: doc.design.layoutMode === 'one-page' ? `${dims.heightPx}px` : undefined,
          overflow: doc.design.layoutMode === 'one-page' ? 'hidden' : undefined,
          fontFamily: fontCss,
          fontSize: `${(13.2 * effectiveScale).toFixed(2)}px`,
          lineHeight: effectiveLh,
          ['--cvp-gap' as any]: `${Math.round(14 * gapScale)}px`,
          ['--cvp-accent' as any]: accent,
        };

        return tplModule.renderPage({
          doc,
          page: pg,
          totalPages: pages.length,
          sheetStyle,
          effectiveMarginMm: effectiveMargin,
          accent,
          canvas,
          renderCanvasUnderlay: () => (
            <>
              <RenderPageFrame doc={doc} accent={accent} />
              <CanvasOverlayLayer
                doc={doc}
                pageIndex={idx}
                plane="underlay"
                canvas={canvas}
                onFocusInspector={onFocusInspector}
              />
            </>
          ),
          renderCanvasOverlay: () => (
            <CanvasOverlayLayer
              doc={doc}
              pageIndex={idx}
              plane="overlay"
              canvas={canvas}
              onFocusInspector={onFocusInspector}
            />
          ),
        });
      })}
    </div>
  );
}

export function A4Preview({
  viewMode,
  onToggleViewMode,
  onOpenTab,
}: {
  viewMode: WorkspaceViewMode;
  onToggleViewMode: () => void;
  onOpenTab?: (tab: EditorSectionKey) => void;
}) {
  const {
    resume,
    updateResume,
    updateResumeTransient,
    commitHistorySnapshot,
    canvasSelection,
    setCanvasSelection,
    notify,
    t,
  } = useCvStudio();

  const stageRef = useRef<HTMLDivElement>(null);
  const quickImgRef = useRef<HTMLInputElement>(null);
  const clipboardRef = useRef<CanvasElement | null>(null);
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');
  const [fitZoom, setFitZoom] = useState(0.76);
  const [interactive, setInteractive] = useState(true);
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [sigModalOpen, setSigModalOpen] = useState(false);

  const dims = getPaperDimensions(resume.design.paperSize);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const compute = () => {
      const availW = el.clientWidth - 32;
      if (availW <= 0) return;
      const ratio = Math.min(1, Math.max(0.34, availW / dims.widthPx));
      setFitZoom(Number(ratio.toFixed(3)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dims.widthPx, viewMode]);

  const scale = zoomMode === 'fit' ? fitZoom : zoomMode;
  const pagesCount = useMemo(() => paginateResume(resume).length, [resume]);
  const modeLabel = LAYOUT_MODE_LABELS[resume.design.layoutMode];
  const layersCount = (resume.canvasElements || []).length;

  // Keyboard nudge & delete for selected canvas element or template block
  useEffect(() => {
    if (!interactive || !canvasSelection) return;
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      ) {
        return;
      }

      const step = e.shiftKey ? 10 : 2;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        if (canvasSelection.kind === 'element') {
          updateResume((prev) => ({
            ...prev,
            canvasElements: (prev.canvasElements || []).map((item) =>
              item.id === canvasSelection.id && !item.locked
                ? { ...item, x: item.x + dx, y: item.y + dy }
                : item,
            ),
          }));
        } else if (canvasSelection.kind === 'block') {
          const bk = canvasSelection.blockKey;
          updateResume((prev) => {
            const cur = prev.blockStyles?.[bk];
            if (cur?.locked) return prev;
            return {
              ...prev,
              blockStyles: {
                ...(prev.blockStyles || {}),
                [bk]: {
                  ...(cur || {}),
                  dx: (cur?.dx || 0) + dx,
                  dy: (cur?.dy || 0) + dy,
                },
              },
            };
          });
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && canvasSelection.kind === 'element') {
        const target = (resume.canvasElements || []).find((x) => x.id === canvasSelection.id);
        if (target && !target.locked) {
          e.preventDefault();
          updateResume((prev) => ({
            ...prev,
            canvasElements: (prev.canvasElements || []).filter((x) => x.id !== canvasSelection.id),
          }));
          setCanvasSelection(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD' && canvasSelection.kind === 'element') {
        const target = (resume.canvasElements || []).find((x) => x.id === canvasSelection.id);
        if (target) {
          e.preventDefault();
          const newId = `${target.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
          updateResume((prev) => {
            const list = prev.canvasElements || [];
            const clone: CanvasElement = {
              ...JSON.parse(JSON.stringify(target)),
              id: newId,
              name: `${target.name} (نسخة)`,
              x: target.x + 18,
              y: target.y + 18,
              locked: false,
              zIndex: nextElementZIndex(list),
            };
            return { ...prev, canvasElements: [...list, clone] };
          });
          setCanvasSelection({ kind: 'element', id: newId });
          notify(t('تم تكرار العنصر (Ctrl+D)', 'Element duplicated (Ctrl+D)'));
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC' && canvasSelection.kind === 'element') {
        const target = (resume.canvasElements || []).find((x) => x.id === canvasSelection.id);
        if (target) {
          clipboardRef.current = JSON.parse(JSON.stringify(target));
          notify(t('تم نسخ العنصر (Ctrl+V للصق)', 'Copied element (Ctrl+V to paste)'));
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV' && clipboardRef.current) {
        e.preventDefault();
        const src = clipboardRef.current;
        const newId = `${src.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        updateResume((prev) => {
          const list = prev.canvasElements || [];
          const pasted: CanvasElement = {
            ...JSON.parse(JSON.stringify(src)),
            id: newId,
            x: src.x + 22,
            y: src.y + 22,
            locked: false,
            zIndex: nextElementZIndex(list),
          };
          return { ...prev, canvasElements: [...list, pasted] };
        });
        setCanvasSelection({ kind: 'element', id: newId });
      } else if (e.key === 'Escape') {
        setCanvasSelection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interactive, canvasSelection, resume.canvasElements, updateResume, setCanvasSelection, notify, t]);

  const canvasCallbacks: SheetInteractiveCallbacks = useMemo(
    () => ({
      interactive,
      zoomScale: scale,
      snapToGuides,
      showGrid,
      selection: canvasSelection,
      onSelect: (sel) => {
        setCanvasSelection(sel);
      },
      onUpdateDoc: updateResume,
      onUpdateDocTransient: updateResumeTransient,
      onCommitHistory: commitHistorySnapshot,
    }),
    [
      interactive,
      scale,
      snapToGuides,
      showGrid,
      canvasSelection,
      setCanvasSelection,
      updateResume,
      updateResumeTransient,
      commitHistorySnapshot,
    ],
  );

  const quickAddText = () => {
    const el = createCanvasTextElement('heading', {
      paperLang: resume.design.paperLang,
      paperDir: resume.design.paperDir,
      fontFamily: resume.design.fontFamily,
      accentColor: resume.design.accentColor || '#24795e',
      existing: resume.canvasElements,
    });
    updateResume((prev) => ({
      ...prev,
      canvasElements: [...(prev.canvasElements || []), el],
    }));
    setCanvasSelection({ kind: 'element', id: el.id });
    onOpenTab?.('layers');
    notify(t('تمت إضافة نص حر — اسحبه أو انقر مرتين لتعديله', 'Added movable text'));
  };

  const quickAddShape = () => {
    const el = createCanvasShapeElement('rounded', {
      accentColor: resume.design.accentColor || '#24795e',
      existing: resume.canvasElements,
      labelAr: 'بطاقة هندسية',
    });
    updateResume((prev) => ({
      ...prev,
      canvasElements: [...(prev.canvasElements || []), el],
    }));
    setCanvasSelection({ kind: 'element', id: el.id });
    onOpenTab?.('layers');
    notify(t('تمت إضافة شكل هندسي — خصّص لونه وحجمه وطبقاته', 'Added geometric shape'));
  };

  return (
    <section className="cv-preview-pane" aria-label={t('المعاينة الحية للورقة', 'Live sheet preview')}>
      <div className="cv-preview-toolbar no-print">
        <div className="cv-preview-pills">
          <span className="cv-mode-pill" data-testid="active-layout-pill">
            {t(modeLabel.ar, modeLabel.en)}
          </span>
          <span className="cv-meta-pill">
            {resume.design.paperSize.toUpperCase()} · {resume.design.paperDir.toUpperCase()} ·{' '}
            {pagesCount} {t(pagesCount === 1 ? 'صفحة' : 'صفحات', pagesCount === 1 ? 'page' : 'pages')}
          </span>
        </div>

        {/* Quick Direct Canvas Tools */}
        <div className="cv-canvas-stage-tools" data-testid="canvas-quick-toolbar">
          <button
            type="button"
            className={`cv-stage-tool-btn ${interactive ? 'is-on' : ''}`}
            data-testid="toggle-interactive-canvas"
            onClick={() => {
              setInteractive((v) => !v);
              if (interactive) setCanvasSelection(null);
            }}
            title={t(
              'تفعيل/إيقاف التحريك والتعديل المباشر على الورقة',
              'Toggle direct dragging & inline text editing on sheet',
            )}
          >
            <MousePointerClick size={14} />
            <span>{t('تحرير وتحريك مباشر', 'Direct Edit')}</span>
          </button>

          <button
            type="button"
            className="cv-stage-tool-btn"
            data-testid="quick-add-text-btn"
            onClick={quickAddText}
          >
            <Type size={14} />
            <span>{t('+ نص', '+ Text')}</span>
          </button>

          <button
            type="button"
            className="cv-stage-tool-btn"
            data-testid="quick-add-image-btn"
            onClick={() => quickImgRef.current?.click()}
          >
            <ImagePlus size={14} />
            <span>{t('+ صورة', '+ Image')}</span>
          </button>

          <button
            type="button"
            className="cv-stage-tool-btn"
            data-testid="quick-add-shape-btn"
            onClick={quickAddShape}
          >
            <Shapes size={14} />
            <span>{t('+ شكل', '+ Shape')}</span>
          </button>

          <button
            type="button"
            className="cv-stage-tool-btn"
            data-testid="quick-add-signature-btn"
            onClick={() => setSigModalOpen(true)}
            title={t('إدراج توقيع إلكتروني شفاف', 'Add transparent electronic signature')}
          >
            <PenTool size={14} />
            <span>{t('+ توقيع', '+ Signature')}</span>
          </button>

          <button
            type="button"
            className={`cv-stage-tool-btn ${snapToGuides ? 'is-on' : ''}`}
            data-testid="toggle-snap-guides-btn"
            onClick={() => setSnapToGuides((v) => !v)}
            title={t('مغناطيس المحاذاة الذكية (Alt للتجاوز المؤقت)', 'Magnetic smart snap guides')}
          >
            <Magnet size={13} />
            <span>{t('مغناطيس', 'Snap')}</span>
          </button>

          <button
            type="button"
            className={`cv-stage-tool-btn ${showGrid ? 'is-on' : ''}`}
            data-testid="toggle-helper-grid-btn"
            onClick={() => setShowGrid((v) => !v)}
            title={t('إظهار/إخفاء شبكة المحاذاة المساعدة (لا تظهر في الطباعة)', 'Toggle helper alignment grid')}
          >
            <Grid3X3 size={13} />
          </button>

          {onOpenTab && (
            <button
              type="button"
              className="cv-stage-tool-btn"
              data-testid="quick-open-layers-btn"
              onClick={() => onOpenTab('layers')}
            >
              <Layers size={14} />
              <span>
                {t('الطبقات', 'Layers')}
                {layersCount > 0 ? ` (${layersCount})` : ''}
              </span>
            </button>
          )}

          <input
            hidden
            ref={quickImgRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  const el = createCanvasImageElement(reader.result, {
                    name: file.name.replace(/\.[^.]+$/, '').slice(0, 26) || t('صورة', 'Image'),
                    accentColor: resume.design.accentColor || '#24795e',
                    existing: resume.canvasElements,
                  });
                  updateResume((prev) => ({
                    ...prev,
                    canvasElements: [...(prev.canvasElements || []), el],
                  }));
                  setCanvasSelection({ kind: 'element', id: el.id });
                  onOpenTab?.('layers');
                  notify(t('تمت إضافة الصورة للورقة', 'Image placed on sheet'));
                }
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div className="cv-zoom-controls">
          <button
            type="button"
            className="cv-icon-btn"
            aria-label={t('تصغير المعاينة', 'Zoom out')}
            onClick={() =>
              setZoomMode((z) =>
                Math.max(0.35, Number(((z === 'fit' ? fitZoom : z) - 0.1).toFixed(2))),
              )
            }
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            className={`cv-zoom-readout ${zoomMode === 'fit' ? 'is-fit' : ''}`}
            onClick={() => setZoomMode('fit')}
            title={t('ملائمة العرض تلقائياً', 'Fit to width')}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="cv-icon-btn"
            aria-label={t('تكبير المعاينة', 'Zoom in')}
            onClick={() =>
              setZoomMode((z) =>
                Math.min(1.35, Number(((z === 'fit' ? fitZoom : z) + 0.1).toFixed(2))),
              )
            }
          >
            <ZoomIn size={15} />
          </button>
          {zoomMode !== 'fit' && (
            <button
              type="button"
              className="cv-icon-btn"
              aria-label={t('إعادة ضبط التقريب', 'Reset zoom')}
              onClick={() => setZoomMode('fit')}
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            type="button"
            className="cv-icon-btn"
            aria-label={t('طباعة فورية', 'Print sheet')}
            title={t('طباعة فورية', 'Print sheet')}
            onClick={() => window.print()}
          >
            <Printer size={15} />
          </button>
          <button
            type="button"
            className="cv-icon-btn cv-desktop-only"
            aria-label={
              viewMode === 'focus'
                ? t('العودة للوضع المقسوم', 'Exit focus preview')
                : t('وضع التركيز والمعاينة الكاملة', 'Full focus preview')
            }
            title={
              viewMode === 'focus'
                ? t('العودة للوضع المقسوم', 'Exit focus preview')
                : t('وضع التركيز والمعاينة الكاملة', 'Full focus preview')
            }
            onClick={onToggleViewMode}
          >
            {viewMode === 'focus' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {interactive && (
        <div className="cv-canvas-hint-strip no-print">
          <span>
            {t(
              'انقر مرتين على أي نص بالورقة لتعديله مباشرة · اسحب أي عنصر أو قسم بسلاسة مع مغناطيس المحاذاة الذكي · Ctrl+D للتكرار',
              'Double-click any text to edit inline · Smooth 120fps dragging with smart snap guides · Ctrl+D to duplicate',
            )}
          </span>
        </div>
      )}

      <SignaturePadModal
        open={sigModalOpen}
        onClose={() => setSigModalOpen(false)}
        onInserted={() => onOpenTab?.('layers')}
      />

      <div
        className="cv-preview-stage"
        ref={stageRef}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setCanvasSelection(null);
        }}
      >
        <div
          className="cv-scale-frame"
          style={{
            width: `${Math.round(dims.widthPx * scale)}px`,
            minHeight: `${Math.round(dims.heightPx * scale * pagesCount)}px`,
          }}
        >
          <div
            className="cv-scale-origin"
            style={{
              width: `${dims.widthPx}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <ResumeSheetCanvas
              doc={resume}
              canvas={canvasCallbacks}
              onFocusInspector={() => onOpenTab?.('layers')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
