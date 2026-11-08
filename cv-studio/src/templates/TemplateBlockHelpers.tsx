import React, { useEffect, useRef, useState } from 'react';
import { Lock, Move, RotateCcw } from 'lucide-react';
import {
  formatPaperPresent,
  getPaperSectionTitle,
  PROFICIENCY_LABELS,
} from '../core/i18n';
import type { LogicalPage, PaginatedBlock } from '../core/pagination';
import type {
  BlockOverrideStyle,
  CanvasSelection,
  ResumeDocument,
  SkillDisplayMode,
  TemplatePreset,
} from '../core/types';
import { resolveFontFamily } from '../data/themes';
import {
  buildImageFilterCss,
  buildImageTransformCss,
  getImageShapeFrameStyle,
} from '../pages/editor/canvas/canvasDefaults';

export interface SheetInteractiveCallbacks {
  interactive: boolean;
  zoomScale: number;
  snapToGuides?: boolean;
  showGrid?: boolean;
  selection: CanvasSelection;
  onSelect: (sel: CanvasSelection) => void;
  onUpdateDoc: (updater: (prev: ResumeDocument) => ResumeDocument) => void;
  onUpdateDocTransient: (updater: (prev: ResumeDocument) => ResumeDocument) => void;
  onCommitHistory: () => void;
}

/**
 * Optional print-crisp decorative paper frame inside [data-cv-sheet]
 */
export function RenderPageFrame({ doc, accent }: { doc: ResumeDocument; accent: string }) {
  const frame = doc.design.pageFrame || 'none';
  if (frame === 'none') return null;

  if (frame === 'classic-border') {
    return (
      <div
        className="cvp-page-frame frame-classic"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '6mm',
          border: `1px solid ${accent}45`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    );
  }

  if (frame === 'double-frame') {
    return (
      <div
        className="cvp-page-frame frame-double"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '5.5mm',
          border: `3px double ${accent}66`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    );
  }

  if (frame === 'top-ribbon') {
    return (
      <div
        className="cvp-page-frame frame-ribbon"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          insetInline: 0,
          height: '6px',
          background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
    );
  }

  if (frame === 'corner-accents') {
    const cornerBase: React.CSSProperties = {
      position: 'absolute',
      width: '22px',
      height: '22px',
      borderColor: accent,
      borderStyle: 'solid',
      pointerEvents: 'none',
      zIndex: 2,
    };
    return (
      <>
        <span aria-hidden="true" style={{ ...cornerBase, top: '6mm', left: '6mm', borderWidth: '2px 0 0 2px' }} />
        <span aria-hidden="true" style={{ ...cornerBase, top: '6mm', right: '6mm', borderWidth: '2px 2px 0 0' }} />
        <span aria-hidden="true" style={{ ...cornerBase, bottom: '6mm', left: '6mm', borderWidth: '0 0 2px 2px' }} />
        <span aria-hidden="true" style={{ ...cornerBase, bottom: '6mm', right: '6mm', borderWidth: '0 2px 2px 0' }} />
      </>
    );
  }

  return null;
}

export interface TemplateRenderPageProps {
  doc: ResumeDocument;
  page: LogicalPage;
  totalPages: number;
  sheetStyle: React.CSSProperties;
  effectiveMarginMm: number;
  accent: string;
  canvas?: SheetInteractiveCallbacks;
  renderCanvasUnderlay?: () => React.ReactNode;
  renderCanvasOverlay?: () => React.ReactNode;
}

export interface TemplateModule {
  preset: TemplatePreset;
  renderPage: (props: TemplateRenderPageProps) => React.ReactNode;
  renderMiniPreview: (props: {
    sample: Omit<ResumeDocument, 'id' | 'createdAt' | 'updatedAt' | 'design'>;
    accent: string;
    paperDir: 'rtl' | 'ltr';
  }) => React.ReactNode;
}

/**
 * Direct inline text editor right on the A4/Letter sheet!
 * Double-click (or click when parent block is selected) to edit text directly on the CV page.
 */
export function InlineEditableText({
  value,
  tag = 'span',
  className,
  style,
  dir,
  multiline = false,
  canvas,
  onCommit,
  placeholder,
}: {
  value: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'strong' | 'li' | 'small';
  className?: string;
  style?: React.CSSProperties;
  dir?: 'rtl' | 'ltr';
  multiline?: boolean;
  canvas?: SheetInteractiveCallbacks;
  onCommit?: (next: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {
        /* ignore */
      }
    }
  }, [editing]);

  const finishEdit = () => {
    if (!editing) return;
    setEditing(false);
    if (!ref.current || !onCommit) return;
    const raw = (ref.current.innerText ?? '').replace(/\r/g, '');
    const cleaned = multiline ? raw.trim() : raw.replace(/\n+/g, ' ').trim();
    if (cleaned !== value) {
      onCommit(cleaned);
    }
  };

  const isInteractive = Boolean(canvas?.interactive && onCommit);
  const Tag = tag as any;

  return (
    <Tag
      ref={ref}
      dir={dir}
      className={`${className || ''} ${isInteractive ? 'cvp-inline-editable' : ''} ${editing ? 'is-inline-editing' : ''}`.trim()}
      style={style}
      contentEditable={editing ? true : undefined}
      suppressContentEditableWarning={editing ? true : undefined}
      onDoubleClick={
        isInteractive
          ? (e: React.MouseEvent) => {
              e.stopPropagation();
              setEditing(true);
            }
          : undefined
      }
      onBlur={editing ? finishEdit : undefined}
      onKeyDown={
        editing
          ? (e: React.KeyboardEvent) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                if (ref.current) ref.current.innerText = value;
                setEditing(false);
              } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
                e.preventDefault();
                finishEdit();
              }
            }
          : undefined
      }
      title={isInteractive && !editing ? 'انقر مرتين لتعديل النص مباشرة / Double-click to edit text' : undefined}
    >
      {value || placeholder || ''}
    </Tag>
  );
}

/**
 * Interactive block wrapper that makes ANY template block (header, photo, summary, experience, etc.)
 * selectable, draggable (dx, dy), lockable, and stylable directly on the CV page!
 */
export function InteractiveBlock({
  blockKey,
  label,
  doc,
  canvas,
  className,
  style,
  children,
}: {
  blockKey: string;
  label: string;
  doc: ResumeDocument;
  canvas?: SheetInteractiveCallbacks;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const blockRef = useRef<HTMLDivElement>(null);
  const deltaBadgeRef = useRef<HTMLSpanElement>(null);
  const override: BlockOverrideStyle | undefined = doc.blockStyles?.[blockKey];
  if (override?.hidden) return null;

  const dx = override?.dx || 0;
  const dy = override?.dy || 0;
  const isSelected =
    Boolean(canvas?.interactive) &&
    canvas?.selection?.kind === 'block' &&
    canvas.selection.blockKey === blockKey;
  const isLocked = Boolean(override?.locked);

  const customStyle: React.CSSProperties = {
    ...style,
    position: 'relative',
    transform: dx !== 0 || dy !== 0 ? `translate3d(${dx}px, ${dy}px, 0)` : style?.transform,
    width: override?.widthDelta ? `calc(100% + ${override.widthDelta}px)` : style?.width,
    fontFamily: override?.fontFamily ? resolveFontFamily(override.fontFamily) : style?.fontFamily,
    fontSize: override?.fontSizeScale ? `${Math.round(override.fontSizeScale * 100)}%` : style?.fontSize,
    color: override?.textColor || style?.color,
    backgroundColor:
      override?.bgColor && override.bgColor !== 'transparent' ? override.bgColor : style?.backgroundColor,
    borderColor: override?.borderColor || style?.borderColor,
    borderWidth: override?.borderWidth !== undefined ? `${override.borderWidth}px` : style?.borderWidth,
    borderStyle:
      override?.borderWidth && override.borderWidth > 0 ? 'solid' : style?.borderStyle,
    borderRadius: override?.borderRadius !== undefined ? `${override.borderRadius}px` : style?.borderRadius,
    padding: override?.padding !== undefined ? `${override.padding}px` : style?.padding,
    textAlign: override?.textAlign || style?.textAlign,
    opacity: override?.opacity !== undefined ? override.opacity : style?.opacity,
    zIndex: isSelected ? 8 : dx !== 0 || dy !== 0 ? 4 : undefined,
    touchAction: canvas?.interactive ? 'none' : undefined,
  };

  const startDrag = (e: React.PointerEvent, forceDrag = false) => {
    if (!canvas?.interactive) return;
    const target = e.target as HTMLElement;
    if (target.closest('[contenteditable="true"]') || target.closest('[data-no-block-drag]')) {
      return;
    }
    e.stopPropagation();
    if (forceDrag) {
      e.preventDefault();
    }

    if (!isSelected) {
      canvas.onSelect({ kind: 'block', blockKey });
    }

    if (isLocked || e.button !== 0) return;

    const node = blockRef.current;
    if (!node) return;

    const sheetEl = node.closest('[data-cv-sheet]') as HTMLElement | null;
    const scale =
      sheetEl && sheetEl.offsetWidth > 0
        ? sheetEl.getBoundingClientRect().width / sheetEl.offsetWidth
        : canvas.zoomScale || 1;

    const pointerId = e.pointerId;
    if (forceDrag) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origDx = dx;
    const origDy = dy;
    let moved = false;
    let latestDx = origDx;
    let latestDy = origDy;

    const onMove = (ev: PointerEvent) => {
      const rawX = ev.clientX - startClientX;
      const rawY = ev.clientY - startClientY;
      if (!moved && !forceDrag && Math.hypot(rawX, rawY) < 3.5) {
        return;
      }
      if (!moved) {
        moved = true;
        try {
          window.getSelection()?.removeAllRanges();
        } catch {
          /* ignore */
        }
        document.body.classList.add('cv-dragging-active');
        node.classList.add('is-dragging-live');
      }

      latestDx = Math.round(origDx + rawX / scale);
      latestDy = Math.round(origDy + rawY / scale);
      node.style.transform = `translate3d(${latestDx}px, ${latestDy}px, 0)`;
      if (deltaBadgeRef.current) {
        deltaBadgeRef.current.textContent = `${latestDx > 0 ? `+${latestDx}` : latestDx}, ${latestDy > 0 ? `+${latestDy}` : latestDy}`;
      }
    };

    const finish = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      document.body.classList.remove('cv-dragging-active');
      node.classList.remove('is-dragging-live');

      if (moved && (latestDx !== origDx || latestDy !== origDy)) {
        canvas.onUpdateDoc((prev) => ({
          ...prev,
          blockStyles: {
            ...(prev.blockStyles || {}),
            [blockKey]: {
              ...(prev.blockStyles?.[blockKey] || {}),
              dx: latestDx,
              dy: latestDy,
            },
          },
        }));
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  const resetOffset = (e: React.MouseEvent) => {
    e.stopPropagation();
    canvas?.onUpdateDoc((prev) => ({
      ...prev,
      blockStyles: {
        ...(prev.blockStyles || {}),
        [blockKey]: {
          ...(prev.blockStyles?.[blockKey] || {}),
          dx: 0,
          dy: 0,
        },
      },
    }));
  };

  return (
    <div
      ref={blockRef}
      data-cv-block={blockKey}
      className={`cvp-interactive-block ${className || ''} ${canvas?.interactive ? 'is-interactive' : ''} ${isSelected ? 'is-canvas-selected' : ''}`.trim()}
      style={customStyle}
      onPointerDown={(e) => startDrag(e, false)}
    >
      {canvas?.interactive && !isLocked && !isSelected && (
        <span
          className="cv-block-hover-grip no-print"
          data-canvas-ui-chrome="true"
          title={doc.design.paperLang === 'ar' ? 'اسحب لتحريك القسم بحرية' : 'Drag freely to move block'}
          onPointerDown={(e) => startDrag(e, true)}
        >
          <Move size={10} />
        </span>
      )}
      {canvas?.interactive && isSelected && (
        <div
          className="cv-block-floating-pill no-print"
          data-canvas-ui-chrome="true"
          onPointerDown={(e) => startDrag(e, true)}
        >
          <Move size={11} />
          <span>{label}</span>
          <span ref={deltaBadgeRef} className="cv-block-delta-readout">
            {dx !== 0 || dy !== 0 ? `${dx}, ${dy}` : ''}
          </span>
          {isLocked && <Lock size={11} />}
          {(dx !== 0 || dy !== 0) && (
            <button
              type="button"
              data-no-block-drag="true"
              className="cv-block-reset-btn"
              title="إعادة للموضع الأصلي / Reset position"
              onClick={resetOffset}
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Interactive profile photo with full shape clipping, zoom/pan, flip, filters, border, and drag support.
 */
export function InteractiveProfilePhoto({
  doc,
  accent,
  sizePx,
  canvas,
}: {
  doc: ResumeDocument;
  accent: string;
  sizePx?: number;
  canvas?: SheetInteractiveCallbacks;
}) {
  if (!doc.personal.showPhoto || !doc.personal.photoDataUrl) return null;
  const dim = doc.personal.photoSizePx || sizePx || 82;
  const shapeStyle = getImageShapeFrameStyle(doc.personal.photoShape || 'circle');
  const filterCss = buildImageFilterCss(doc.personal.photoFilters);
  const transformCss = buildImageTransformCss(doc.personal.photoFilters);
  const borderWidth = doc.personal.photoBorderWidth ?? 2;
  const borderColor = doc.personal.photoBorderColor || `${accent}66`;

  return (
    <InteractiveBlock
      blockKey="photo"
      label={doc.design.paperLang === 'ar' ? 'الصورة الشخصية' : 'Profile Photo'}
      doc={doc}
      canvas={canvas}
      className="cvp-photo-wrapper"
    >
      <div
        className="cvp-photo-frame"
        style={{
          width: `${dim}px`,
          height: `${dim}px`,
          ...shapeStyle,
          border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none',
          boxShadow: doc.personal.photoShadow ? '0 8px 20px rgba(0,0,0,0.14)' : undefined,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src={doc.personal.photoDataUrl}
          alt={doc.personal.fullName}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: doc.personal.photoFilters?.objectFit || 'cover',
            filter: filterCss,
            transform: transformCss,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </InteractiveBlock>
  );
}

export function renderSkillsByMode(
  doc: ResumeDocument,
  mode: SkillDisplayMode,
  accent: string,
  canvas?: SheetInteractiveCallbacks,
  chipVariant?: 'default' | 'mono' | 'outline',
) {
  if (!doc.skills.length) return null;

  const commitSkillName = (skillId: string, nextName: string) => {
    canvas?.onUpdateDoc((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === skillId ? { ...s, name: nextName } : s)),
    }));
  };

  if (mode === 'comma') {
    return (
      <p className="cvp-skills-comma">
        {doc.skills.map((s, idx) => (
          <React.Fragment key={s.id}>
            {idx > 0 && <span>{doc.design.paperLang === 'ar' ? ' ، ' : ' • '}</span>}
            <InlineEditableText
              value={s.name}
              canvas={canvas}
              onCommit={(val) => commitSkillName(s.id, val)}
            />
          </React.Fragment>
        ))}
      </p>
    );
  }

  if (mode === 'bullets') {
    return (
      <ul className="cvp-skills-bullets">
        {doc.skills.map((s) => (
          <li key={s.id}>
            <InlineEditableText
              value={s.name}
              canvas={canvas}
              onCommit={(val) => commitSkillName(s.id, val)}
            />
          </li>
        ))}
      </ul>
    );
  }

  if (mode === 'dots') {
    return (
      <div className="cvp-skills-dots">
        {doc.skills.map((s) => (
          <div key={s.id} className="cvp-skill-dot-row">
            <InlineEditableText
              value={s.name}
              className="cvp-skill-dot-name"
              canvas={canvas}
              onCommit={(val) => commitSkillName(s.id, val)}
            />
            <span className="cvp-skill-dot-track" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <i
                  key={n}
                  style={{
                    backgroundColor: n <= s.level ? accent : '#e2e8f0',
                  }}
                />
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'bars') {
    return (
      <div className="cvp-skills-bars">
        {doc.skills.map((s) => (
          <div key={s.id} className="cvp-skill-bar-row">
            <div className="cvp-skill-bar-top">
              <InlineEditableText
                value={s.name}
                canvas={canvas}
                onCommit={(val) => commitSkillName(s.id, val)}
              />
              <small>{Math.round((s.level / 5) * 100)}%</small>
            </div>
            <div className="cvp-skill-bar-track">
              <div
                className="cvp-skill-bar-fill"
                style={{ width: `${(s.level / 5) * 100}%`, backgroundColor: accent }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`cvp-skills-badges ${chipVariant === 'mono' ? 'is-mono-tags' : ''}`}>
      {doc.skills.map((s) => (
        <span
          key={s.id}
          className="cvp-skill-badge"
          style={
            chipVariant === 'mono'
              ? { borderColor: `${accent}55`, backgroundColor: `${accent}0f`, color: accent }
              : chipVariant === 'outline'
                ? { borderColor: `${accent}66`, backgroundColor: '#ffffff' }
                : { borderColor: `${accent}44` }
          }
        >
          <InlineEditableText
            value={s.name}
            canvas={canvas}
            onCommit={(val) => commitSkillName(s.id, val)}
          />
        </span>
      ))}
    </div>
  );
}

export type HeadingVisualVariant =
  | 'ats-line'
  | 'accent-bar'
  | 'soft-pill'
  | 'corporate-centered'
  | 'tech-bracket'
  | 'academic-caps'
  | 'nordic-minimal'
  | 'royal-gold'
  | 'clinical-badge'
  | 'bento-header'
  | 'dark-sidebar';

export function TemplateSectionHeading({
  title,
  continued,
  paperLang,
  variant,
  accent,
  headingColorOverride,
  canvas,
  onCommitTitle,
}: {
  title: string;
  continued?: boolean;
  paperLang: 'ar' | 'en';
  variant: HeadingVisualVariant;
  accent: string;
  headingColorOverride?: string;
  canvas?: SheetInteractiveCallbacks;
  onCommitTitle?: (next: string) => void;
}) {
  const color = headingColorOverride || accent;
  const suffix = continued ? (paperLang === 'ar' ? ' (تابع)' : ' (Cont.)') : '';

  if (variant === 'corporate-centered') {
    return (
      <div className="cvp-sec-corporate">
        <span className="cvp-sec-corp-line" style={{ backgroundColor: `${color}55` }} />
        <h2 style={{ color }}>
          <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
          {suffix}
        </h2>
        <span className="cvp-sec-corp-line" style={{ backgroundColor: `${color}55` }} />
      </div>
    );
  }

  if (variant === 'tech-bracket') {
    return (
      <h2 className="cvp-sec-heading cvp-sec-tech" style={{ color, borderBottomColor: `${color}30` }}>
        <code style={{ color }} aria-hidden="true">
          {'//'}
        </code>
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  if (variant === 'soft-pill') {
    return (
      <h2
        className="cvp-sec-heading cvp-sec-soft"
        style={{ color, backgroundColor: `${color}14`, borderInlineStart: `3px solid ${color}` }}
      >
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  if (variant === 'accent-bar') {
    return (
      <h2 className="cvp-sec-heading cvp-sec-bar" style={{ color }}>
        <i style={{ backgroundColor: color }} aria-hidden="true" />
        <span>
          <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
          {suffix}
        </span>
      </h2>
    );
  }

  if (variant === 'academic-caps') {
    return (
      <h2
        className="cvp-sec-heading cvp-sec-academic"
        style={{ color, borderBottomColor: color }}
      >
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  if (variant === 'nordic-minimal') {
    return (
      <h2 className="cvp-sec-heading cvp-sec-nordic" style={{ color }}>
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  if (variant === 'royal-gold') {
    return (
      <h2 className="cvp-sec-heading cvp-sec-royal" style={{ color: '#0f172a', borderBottomColor: `${color}55` }}>
        <span className="cvp-royal-diamond" style={{ backgroundColor: color }} aria-hidden="true" />
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  if (variant === 'clinical-badge') {
    return (
      <h2
        className="cvp-sec-heading cvp-sec-clinical"
        style={{ backgroundColor: color, color: '#ffffff' }}
      >
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  if (variant === 'bento-header') {
    return (
      <h2 className="cvp-sec-heading cvp-sec-bento" style={{ color }}>
        <span className="cvp-bento-dot" style={{ backgroundColor: color }} aria-hidden="true" />
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  if (variant === 'dark-sidebar') {
    return (
      <h2 className="cvp-sec-heading cvp-sec-dark-aside" style={{ color: '#f8fafc', borderBottomColor: 'rgba(255,255,255,0.22)' }}>
        <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
        {suffix}
      </h2>
    );
  }

  return (
    <h2 className="cvp-sec-heading cvp-sec-line" style={{ color, borderBottomColor: `${color}45` }}>
      <InlineEditableText value={title} canvas={canvas} onCommit={onCommitTitle} />
      {suffix}
    </h2>
  );
}

/**
 * Shared rich section renderer supporting multiple entry layouts:
 * - 'standard': classic stacked header + bullets
 * - 'timeline': vertical timeline spine with accent nodes
 * - 'hanging-date': side-by-side 115px date gutter | content column (Academic / Corporate)
 * - 'cards': bordered showcase cards (Fresh-Grad / Portfolio)
 */
export function RenderTemplateSection({
  doc,
  block,
  accent,
  headingVariant = 'ats-line',
  entryLayout = 'standard',
  isAts = false,
  skillChipVariant = 'default',
  canvas,
}: {
  doc: ResumeDocument;
  block: PaginatedBlock;
  accent: string;
  headingVariant?: HeadingVisualVariant;
  entryLayout?: 'standard' | 'timeline' | 'hanging-date' | 'cards';
  isAts?: boolean;
  skillChipVariant?: 'default' | 'mono' | 'outline';
  canvas?: SheetInteractiveCallbacks;
}) {
  const pLang = doc.design.paperLang;
  const meta = doc.sections.find((s) => s.id === block.kind);
  const title = getPaperSectionTitle(block.kind, pLang, meta?.customTitleAr, meta?.customTitleEn);
  const blockKey = block.kind === 'custom' && block.customGroupId ? `custom:${block.customGroupId}` : block.kind;
  const headingColorOverride = doc.blockStyles?.[blockKey]?.headingColor;

  const commitSectionTitle = (nextTitle: string) => {
    canvas?.onUpdateDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === block.kind
          ? pLang === 'ar'
            ? { ...s, customTitleAr: nextTitle }
            : { ...s, customTitleEn: nextTitle }
          : s,
      ),
    }));
  };

  if (block.kind === 'summary') {
    if (!doc.summary.trim()) return null;
    return (
      <InteractiveBlock blockKey={blockKey} label={title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={title}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={commitSectionTitle}
        />
        <InlineEditableText
          tag="p"
          multiline
          className="cvp-summary-text"
          value={doc.summary}
          canvas={canvas}
          onCommit={(val) => canvas?.onUpdateDoc((prev) => ({ ...prev, summary: val }))}
        />
      </InteractiveBlock>
    );
  }

  if (block.kind === 'experience') {
    const items = block.itemIds
      ? doc.experience.filter((e) => block.itemIds!.includes(e.id))
      : doc.experience;
    if (!items.length) return null;

    return (
      <InteractiveBlock blockKey={blockKey} label={title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={title}
          continued={block.continued}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={commitSectionTitle}
        />
        <div className={`cvp-entries layout-${entryLayout}`}>
          {items.map((exp) => {
            const dateText = `${exp.startDate}${exp.current || exp.endDate ? ' – ' : ''}${exp.current ? formatPaperPresent(pLang) : exp.endDate}`;
            const bodyNode = (
              <div className="cvp-entry-main">
                <div className="cvp-entry-head">
                  <div>
                    <InlineEditableText
                      tag="strong"
                      className="cvp-entry-role"
                      value={exp.role}
                      canvas={canvas}
                      onCommit={(val) =>
                        canvas?.onUpdateDoc((prev) => ({
                          ...prev,
                          experience: prev.experience.map((x) => (x.id === exp.id ? { ...x, role: val } : x)),
                        }))
                      }
                    />
                    <div className="cvp-entry-sub">
                      <InlineEditableText
                        style={{ color: accent }}
                        value={exp.company}
                        canvas={canvas}
                        onCommit={(val) =>
                          canvas?.onUpdateDoc((prev) => ({
                            ...prev,
                            experience: prev.experience.map((x) => (x.id === exp.id ? { ...x, company: val } : x)),
                          }))
                        }
                      />
                      {exp.location ? (
                        <>
                          <span> • </span>
                          <InlineEditableText
                            value={exp.location}
                            canvas={canvas}
                            onCommit={(val) =>
                              canvas?.onUpdateDoc((prev) => ({
                                ...prev,
                                experience: prev.experience.map((x) =>
                                  x.id === exp.id ? { ...x, location: val } : x,
                                ),
                              }))
                            }
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                  {entryLayout !== 'hanging-date' && <span className="cvp-entry-date">{dateText}</span>}
                </div>
                {exp.highlights.filter(Boolean).length > 0 && (
                  <ul className="cvp-bullets">
                    {exp.highlights.map((h, idx) =>
                      h ? (
                        <InlineEditableText
                          key={idx}
                          tag="li"
                          multiline
                          value={h}
                          canvas={canvas}
                          onCommit={(val) =>
                            canvas?.onUpdateDoc((prev) => ({
                              ...prev,
                              experience: prev.experience.map((x) =>
                                x.id === exp.id
                                  ? { ...x, highlights: x.highlights.map((old, i) => (i === idx ? val : old)) }
                                  : x,
                              ),
                            }))
                          }
                        />
                      ) : null,
                    )}
                  </ul>
                )}
              </div>
            );

            if (entryLayout === 'hanging-date') {
              return (
                <div key={exp.id} className="cvp-entry is-hanging">
                  <div className="cvp-hanging-date">{dateText}</div>
                  {bodyNode}
                </div>
              );
            }

            if (entryLayout === 'timeline') {
              return (
                <div
                  key={exp.id}
                  className="cvp-entry is-timeline"
                  style={{ borderInlineStartColor: `${accent}38` }}
                >
                  <span className="cvp-timeline-dot" style={{ backgroundColor: accent }} aria-hidden="true" />
                  {bodyNode}
                </div>
              );
            }

            return (
              <div
                key={exp.id}
                className={`cvp-entry ${entryLayout === 'cards' ? 'is-card' : ''}`}
                style={entryLayout === 'cards' ? { borderColor: `${accent}28` } : undefined}
              >
                {bodyNode}
              </div>
            );
          })}
        </div>
      </InteractiveBlock>
    );
  }

  if (block.kind === 'education') {
    if (!doc.education.length) return null;
    return (
      <InteractiveBlock blockKey={blockKey} label={title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={title}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={commitSectionTitle}
        />
        <div className={`cvp-entries layout-${entryLayout}`}>
          {doc.education.map((edu) => {
            const dateText = `${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : ''}`;
            const main = (
              <div className="cvp-entry-main">
                <div className="cvp-entry-head">
                  <div>
                    <InlineEditableText
                      tag="strong"
                      className="cvp-entry-role"
                      value={edu.degree}
                      canvas={canvas}
                      onCommit={(val) =>
                        canvas?.onUpdateDoc((prev) => ({
                          ...prev,
                          education: prev.education.map((x) => (x.id === edu.id ? { ...x, degree: val } : x)),
                        }))
                      }
                    />
                    <div className="cvp-entry-sub">
                      <InlineEditableText
                        style={{ color: accent }}
                        value={edu.school}
                        canvas={canvas}
                        onCommit={(val) =>
                          canvas?.onUpdateDoc((prev) => ({
                            ...prev,
                            education: prev.education.map((x) => (x.id === edu.id ? { ...x, school: val } : x)),
                          }))
                        }
                      />
                      {edu.location ? <span> • {edu.location}</span> : null}
                    </div>
                  </div>
                  {entryLayout !== 'hanging-date' && <span className="cvp-entry-date">{dateText}</span>}
                </div>
                {edu.grade && (
                  <InlineEditableText
                    tag="p"
                    className="cvp-entry-note"
                    value={edu.grade}
                    canvas={canvas}
                    onCommit={(val) =>
                      canvas?.onUpdateDoc((prev) => ({
                        ...prev,
                        education: prev.education.map((x) => (x.id === edu.id ? { ...x, grade: val } : x)),
                      }))
                    }
                  />
                )}
                {edu.notes && (
                  <InlineEditableText
                    tag="p"
                    className="cvp-entry-note"
                    value={edu.notes}
                    canvas={canvas}
                    onCommit={(val) =>
                      canvas?.onUpdateDoc((prev) => ({
                        ...prev,
                        education: prev.education.map((x) => (x.id === edu.id ? { ...x, notes: val } : x)),
                      }))
                    }
                  />
                )}
              </div>
            );

            if (entryLayout === 'hanging-date') {
              return (
                <div key={edu.id} className="cvp-entry is-hanging">
                  <div className="cvp-hanging-date">{dateText}</div>
                  {main}
                </div>
              );
            }
            if (entryLayout === 'timeline') {
              return (
                <div key={edu.id} className="cvp-entry is-timeline" style={{ borderInlineStartColor: `${accent}38` }}>
                  <span className="cvp-timeline-dot" style={{ backgroundColor: accent }} aria-hidden="true" />
                  {main}
                </div>
              );
            }
            return (
              <div
                key={edu.id}
                className={`cvp-entry ${entryLayout === 'cards' ? 'is-card' : ''}`}
                style={entryLayout === 'cards' ? { borderColor: `${accent}28` } : undefined}
              >
                {main}
              </div>
            );
          })}
        </div>
      </InteractiveBlock>
    );
  }

  if (block.kind === 'certifications') {
    if (!doc.certifications.length) return null;
    return (
      <InteractiveBlock blockKey={blockKey} label={title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={title}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={commitSectionTitle}
        />
        <div className="cvp-cert-list">
          {doc.certifications.map((cert) => (
            <div key={cert.id} className="cvp-cert-row">
              <div>
                <InlineEditableText
                  tag="strong"
                  value={cert.name}
                  canvas={canvas}
                  onCommit={(val) =>
                    canvas?.onUpdateDoc((prev) => ({
                      ...prev,
                      certifications: prev.certifications.map((c) => (c.id === cert.id ? { ...c, name: val } : c)),
                    }))
                  }
                />
                {cert.issuer && <span> — {cert.issuer}</span>}
                {cert.credentialId && <small> ({cert.credentialId})</small>}
              </div>
              {cert.date && <span className="cvp-entry-date">{cert.date}</span>}
            </div>
          ))}
        </div>
      </InteractiveBlock>
    );
  }

  if (block.kind === 'skills') {
    if (!doc.skills.length) return null;
    const effectiveMode: SkillDisplayMode =
      isAts && (doc.design.skillDisplay === 'bars' || doc.design.skillDisplay === 'dots')
        ? 'comma'
        : doc.design.skillDisplay;
    return (
      <InteractiveBlock blockKey={blockKey} label={title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={title}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={commitSectionTitle}
        />
        {renderSkillsByMode(doc, effectiveMode, headingColorOverride || accent, canvas, skillChipVariant)}
      </InteractiveBlock>
    );
  }

  if (block.kind === 'languages') {
    if (!doc.languages.length) return null;
    return (
      <InteractiveBlock blockKey={blockKey} label={title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={title}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={commitSectionTitle}
        />
        <div className="cvp-lang-grid">
          {doc.languages.map((l) => (
            <div key={l.id} className="cvp-lang-item">
              <InlineEditableText
                tag="strong"
                value={l.name}
                canvas={canvas}
                onCommit={(val) =>
                  canvas?.onUpdateDoc((prev) => ({
                    ...prev,
                    languages: prev.languages.map((x) => (x.id === l.id ? { ...x, name: val } : x)),
                  }))
                }
              />
              <span>{PROFICIENCY_LABELS[l.proficiency][pLang]}</span>
            </div>
          ))}
        </div>
      </InteractiveBlock>
    );
  }

  if (block.kind === 'projects') {
    const items = block.itemIds ? doc.projects.filter((p) => block.itemIds!.includes(p.id)) : doc.projects;
    if (!items.length) return null;
    return (
      <InteractiveBlock blockKey={blockKey} label={title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={title}
          continued={block.continued}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={commitSectionTitle}
        />
        <div className={`cvp-entries ${entryLayout === 'cards' ? 'cvp-cards-grid-2' : ''}`}>
          {items.map((proj) => (
            <div
              key={proj.id}
              className={`cvp-entry ${entryLayout === 'cards' ? 'is-card' : ''}`}
              style={entryLayout === 'cards' ? { borderColor: `${accent}30`, backgroundColor: `${accent}06` } : undefined}
            >
              <div className="cvp-entry-head">
                <div>
                  <InlineEditableText
                    tag="strong"
                    className="cvp-entry-role"
                    value={proj.name}
                    canvas={canvas}
                    onCommit={(val) =>
                      canvas?.onUpdateDoc((prev) => ({
                        ...prev,
                        projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, name: val } : p)),
                      }))
                    }
                  />
                  {(proj.role || proj.link) && (
                    <div className="cvp-entry-sub">
                      {proj.role && <span style={{ color: accent }}>{proj.role}</span>}
                      {proj.role && proj.link && <span> • </span>}
                      {proj.link && <span dir="ltr">{proj.link}</span>}
                    </div>
                  )}
                </div>
                {proj.date && <span className="cvp-entry-date">{proj.date}</span>}
              </div>
              {proj.summary && (
                <InlineEditableText
                  tag="p"
                  multiline
                  className="cvp-entry-note"
                  value={proj.summary}
                  canvas={canvas}
                  onCommit={(val) =>
                    canvas?.onUpdateDoc((prev) => ({
                      ...prev,
                      projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, summary: val } : p)),
                    }))
                  }
                />
              )}
              {proj.highlights.filter(Boolean).length > 0 && (
                <ul className="cvp-bullets">
                  {proj.highlights.filter(Boolean).map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </InteractiveBlock>
    );
  }

  if (block.kind === 'custom' && block.customGroupId) {
    const group = doc.customSections.find((g) => g.id === block.customGroupId);
    if (!group || !group.visible || !group.items.length) return null;
    return (
      <InteractiveBlock blockKey={blockKey} label={group.title} doc={doc} canvas={canvas} className="cvp-section">
        <TemplateSectionHeading
          title={group.title}
          paperLang={pLang}
          variant={headingVariant}
          accent={accent}
          headingColorOverride={headingColorOverride}
          canvas={canvas}
          onCommitTitle={(nextTitle) =>
            canvas?.onUpdateDoc((prev) => ({
              ...prev,
              customSections: prev.customSections.map((g) =>
                g.id === group.id ? { ...g, title: nextTitle } : g,
              ),
            }))
          }
        />
        <div className="cvp-entries">
          {group.items.map((item, idx) => (
            <div key={item.id} className="cvp-entry">
              <div className="cvp-entry-head">
                <div>
                  <strong className="cvp-entry-role">
                    {headingVariant === 'academic-caps' ? `[${idx + 1}] ` : ''}
                    <InlineEditableText
                      value={item.heading}
                      canvas={canvas}
                      onCommit={(val) =>
                        canvas?.onUpdateDoc((prev) => ({
                          ...prev,
                          customSections: prev.customSections.map((g) =>
                            g.id === group.id
                              ? {
                                  ...g,
                                  items: g.items.map((it) => (it.id === item.id ? { ...it, heading: val } : it)),
                                }
                              : g,
                          ),
                        }))
                      }
                    />
                  </strong>
                  {item.subheading && (
                    <div className="cvp-entry-sub">
                      <span style={{ color: accent }}>{item.subheading}</span>
                    </div>
                  )}
                </div>
                {item.date && <span className="cvp-entry-date">{item.date}</span>}
              </div>
              {item.description && (
                <InlineEditableText
                  tag="p"
                  multiline
                  className="cvp-entry-note"
                  value={item.description}
                  canvas={canvas}
                  onCommit={(val) =>
                    canvas?.onUpdateDoc((prev) => ({
                      ...prev,
                      customSections: prev.customSections.map((g) =>
                        g.id === group.id
                          ? {
                              ...g,
                              items: g.items.map((it) => (it.id === item.id ? { ...it, description: val } : it)),
                            }
                          : g,
                      ),
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
      </InteractiveBlock>
    );
  }

  return null;
}

export function collectContacts(doc: ResumeDocument): string[] {
  return [
    doc.personal.email,
    doc.personal.phone,
    doc.personal.location,
    doc.personal.linkedin,
    doc.personal.website,
    doc.personal.github,
  ].filter((v) => v && v.trim());
}
