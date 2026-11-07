import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Layers,
  Lock,
  Pencil,
  RotateCw,
  Star,
  Trash2,
  Unlock,
} from 'lucide-react';
import type { CanvasElement, ResumeDocument } from '../../../core/types';
import { resolveFontFamily } from '../../../data/themes';
import type { SheetInteractiveCallbacks } from '../../../templates/TemplateBlockHelpers';
import {
  buildImageFilterCss,
  buildImageTransformCss,
  getImageShapeFrameStyle,
  nextElementZIndex,
} from './canvasDefaults';
import {
  CANVAS_ICON_MAP,
  type CanvasIconKey,
  CanvasDividerSvg,
  CanvasShapeSvg,
} from './CanvasShapeSvg';

type ResizeDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLE_DIRS: ResizeDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

function CanvasElementNode({
  el,
  canvas,
  onFocusInspector,
}: {
  el: CanvasElement;
  canvas?: SheetInteractiveCallbacks;
  onFocusInspector?: () => void;
}) {
  const [editingText, setEditingText] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const isSelected =
    Boolean(canvas?.interactive) &&
    canvas?.selection?.kind === 'element' &&
    canvas.selection.id === el.id;

  useEffect(() => {
    if (!isSelected && editingText) {
      setEditingText(false);
    }
  }, [isSelected, editingText]);

  useEffect(() => {
    if (editingText && textRef.current) {
      textRef.current.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(textRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {
        /* ignore */
      }
    }
  }, [editingText]);

  const updateEl = (patch: Partial<CanvasElement>, transient = false) => {
    if (!canvas) return;
    const fn = transient ? canvas.onUpdateDocTransient : canvas.onUpdateDoc;
    fn((prev: ResumeDocument) => ({
      ...prev,
      canvasElements: (prev.canvasElements || []).map((item) =>
        item.id === el.id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const handlePointerDownMove = (e: React.PointerEvent) => {
    if (!canvas?.interactive) return;
    const target = e.target as HTMLElement;
    if (
      editingText ||
      target.closest('[data-canvas-ui-chrome]') ||
      target.closest('[data-resize-handle]')
    ) {
      return;
    }

    e.stopPropagation();
    canvas.onSelect({ kind: 'element', id: el.id });
    onFocusInspector?.();

    if (el.locked || e.button !== 0) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origX = el.x;
    const origY = el.y;
    const scale = canvas.zoomScale || 1;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dxScreen = ev.clientX - startClientX;
      const dyScreen = ev.clientY - startClientY;
      if (!moved && Math.hypot(dxScreen, dyScreen) < 3) return;
      if (!moved) {
        moved = true;
        canvas.onCommitHistory();
      }
      const nextX = Math.round(origX + dxScreen / scale);
      const nextY = Math.round(origY + dyScreen / scale);
      updateEl({ x: nextX, y: nextY }, true);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizeStart = (dir: ResizeDir, e: React.PointerEvent) => {
    if (!canvas?.interactive || el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    canvas.onCommitHistory();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const orig = { x: el.x, y: el.y, w: el.width, h: el.height };
    const scale = canvas.zoomScale || 1;

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / scale;
      const dy = (ev.clientY - startClientY) / scale;

      let nextX = orig.x;
      let nextY = orig.y;
      let nextW = orig.w;
      let nextH = orig.h;

      if (dir.includes('e')) nextW = Math.max(24, Math.round(orig.w + dx));
      if (dir.includes('s')) nextH = Math.max(18, Math.round(orig.h + dy));
      if (dir.includes('w')) {
        const w = Math.max(24, Math.round(orig.w - dx));
        nextX = Math.round(orig.x + (orig.w - w));
        nextW = w;
      }
      if (dir.includes('n')) {
        const h = Math.max(18, Math.round(orig.h - dy));
        nextY = Math.round(orig.y + (orig.h - h));
        nextH = h;
      }

      updateEl({ x: nextX, y: nextY, width: nextW, height: nextH }, true);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleRotateStart = (e: React.PointerEvent) => {
    if (!canvas?.interactive || el.locked || !boxRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    canvas.onCommitHistory();

    const rect = boxRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const onMove = (ev: PointerEvent) => {
      const rad = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      let deg = Math.round((rad * 180) / Math.PI + 90);
      if (deg > 180) deg -= 360;
      for (const snap of [-180, -90, -45, 0, 45, 90, 180]) {
        if (Math.abs(deg - snap) <= 3) {
          deg = snap;
          break;
        }
      }
      updateEl({ rotation: deg }, true);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const commitInlineText = () => {
    setEditingText(false);
    if (!textRef.current) return;
    const next = (textRef.current.innerText ?? '').replace(/\r/g, '');
    if (next !== (el.text || '')) {
      updateEl({ text: next }, false);
    }
  };

  const duplicateEl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    canvas.onUpdateDoc((prev) => {
      const list = prev.canvasElements || [];
      const copy: CanvasElement = {
        ...JSON.parse(JSON.stringify(el)),
        id: newId,
        name: `${el.name} (نسخة)`,
        x: el.x + 18,
        y: el.y + 18,
        locked: false,
        zIndex: nextElementZIndex(list),
      };
      return { ...prev, canvasElements: [...list, copy] };
    });
    canvas.onSelect({ kind: 'element', id: newId });
  };

  const shiftZ = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateEl({ zIndex: Math.max(1, (el.zIndex || 1) + delta) });
  };

  const togglePlane = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateEl({ layerPlane: el.layerPlane === 'underlay' ? 'overlay' : 'underlay' });
  };

  const removeEl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    canvas.onUpdateDoc((prev) => ({
      ...prev,
      canvasElements: (prev.canvasElements || []).filter((item) => item.id !== el.id),
    }));
    canvas.onSelect(null);
  };

  const renderInnerContent = () => {
    if (el.type === 'text' || el.type === 'badge') {
      const isBadge = el.type === 'badge';
      return (
        <div
          ref={textRef}
          dir={el.textDir || 'rtl'}
          contentEditable={editingText ? true : undefined}
          suppressContentEditableWarning={editingText ? true : undefined}
          onDoubleClick={
            canvas?.interactive && !el.locked
              ? (e) => {
                  e.stopPropagation();
                  setEditingText(true);
                }
              : undefined
          }
          onBlur={editingText ? commitInlineText : undefined}
          onKeyDown={
            editingText
              ? (e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') {
                    if (textRef.current) textRef.current.innerText = el.text || '';
                    setEditingText(false);
                  }
                }
              : undefined
          }
          className={`cv-canvas-text-box ${isBadge ? 'is-badge' : ''} ${editingText ? 'is-editing' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            fontFamily: resolveFontFamily(el.fontFamily || 'cairo'),
            fontSize: `${el.fontSize || 14}px`,
            fontWeight: el.fontWeight || 400,
            fontStyle: el.fontStyle || 'normal',
            textDecoration: el.textDecoration || 'none',
            textAlign: el.textAlign || (isBadge ? 'center' : 'start'),
            lineHeight: el.lineHeight || 1.4,
            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
            color: el.textColor || '#111827',
            backgroundColor:
              el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'transparent',
            border:
              el.strokeWidth && el.strokeWidth > 0 && el.strokeColor && el.strokeColor !== 'transparent'
                ? `${el.strokeWidth}px solid ${el.strokeColor}`
                : 'none',
            borderRadius: `${el.borderRadius ?? (isBadge ? 999 : 6)}px`,
            padding: `${el.padding ?? 6}px`,
            boxShadow: el.shadow ? '0 8px 20px rgba(0,0,0,0.12)' : undefined,
            display: isBadge ? 'flex' : 'block',
            alignItems: isBadge ? 'center' : undefined,
            justifyContent: isBadge ? 'center' : undefined,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
          }}
        >
          {el.text || ''}
        </div>
      );
    }

    if (el.type === 'image') {
      const shapeStyle = getImageShapeFrameStyle(el.imageShape || 'rounded', el.borderRadius);
      const filterCss = buildImageFilterCss(el.imageFilters);
      const transformCss = buildImageTransformCss(el.imageFilters);
      return (
        <div
          className="cv-canvas-image-box"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            ...shapeStyle,
            border:
              el.strokeWidth && el.strokeWidth > 0 && el.strokeColor && el.strokeColor !== 'transparent'
                ? `${el.strokeWidth}px solid ${el.strokeColor}`
                : 'none',
            boxShadow: el.shadow ? '0 10px 24px rgba(0,0,0,0.16)' : undefined,
          }}
        >
          {el.src && (
            <img
              src={el.src}
              alt={el.name}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: el.imageFilters?.objectFit || 'cover',
                filter: filterCss,
                transform: transformCss,
                transformOrigin: 'center center',
              }}
            />
          )}
        </div>
      );
    }

    if (el.type === 'qr') {
      return (
        <div
          className="cv-canvas-qr-box"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: el.fillColor || '#ffffff',
            border:
              el.strokeWidth && el.strokeWidth > 0 && el.strokeColor
                ? `${el.strokeWidth}px solid ${el.strokeColor}`
                : 'none',
            borderRadius: `${el.borderRadius ?? 8}px`,
            padding: `${el.padding ?? 4}px`,
            boxShadow: el.shadow ? '0 6px 16px rgba(0,0,0,0.12)' : undefined,
          }}
        >
          {el.src && (
            <img
              src={el.src}
              alt="QR"
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
          )}
        </div>
      );
    }

    if (el.type === 'shape') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            filter: el.shadow ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.14))' : undefined,
          }}
        >
          <CanvasShapeSvg
            shapeKind={el.shapeKind}
            fillColor={el.fillColor}
            strokeColor={el.strokeColor}
            strokeWidth={el.strokeWidth}
            borderRadius={el.borderRadius}
          />
        </div>
      );
    }

    if (el.type === 'divider') {
      return (
        <CanvasDividerSvg
          dividerStyle={el.dividerStyle}
          strokeColor={el.strokeColor}
          strokeWidth={el.strokeWidth}
        />
      );
    }

    if (el.type === 'icon') {
      const IconComp = CANVAS_ICON_MAP[(el.iconName as CanvasIconKey) || 'Sparkles'] || CANVAS_ICON_MAP.Sparkles;
      const iconDim = Math.max(14, Math.round(Math.min(el.width, el.height) * 0.58));
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'transparent',
            border:
              el.strokeWidth && el.strokeWidth > 0 && el.strokeColor && el.strokeColor !== 'transparent'
                ? `${el.strokeWidth}px solid ${el.strokeColor}`
                : 'none',
            borderRadius: `${el.borderRadius ?? 12}px`,
            color: el.textColor || '#24795e',
          }}
        >
          <IconComp size={iconDim} />
        </div>
      );
    }

    if (el.type === 'rating') {
      const max = el.ratingMax || 5;
      const val = el.ratingValue ?? 5;
      const starSize = Math.max(12, Math.min(28, Math.round(el.height * 0.72)));
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3,
            color: el.textColor || '#24795e',
          }}
        >
          {Array.from({ length: max }).map((_, idx) => (
            <Star
              key={idx}
              size={starSize}
              fill={idx < val ? el.textColor || '#24795e' : 'none'}
              stroke={idx < val ? el.textColor || '#24795e' : '#cbd5e1'}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={boxRef}
      data-canvas-element-id={el.id}
      data-canvas-element-type={el.type}
      className={`cv-canvas-el ${canvas?.interactive ? 'is-interactive' : ''} ${isSelected ? 'is-canvas-selected' : ''} ${el.locked ? 'is-locked' : ''}`}
      style={{
        position: 'absolute',
        left: `${el.x}px`,
        top: `${el.y}px`,
        width: `${el.width}px`,
        height: `${el.height}px`,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        opacity: el.opacity ?? 1,
        zIndex: el.zIndex || 10,
      }}
      onPointerDown={handlePointerDownMove}
    >
      {renderInnerContent()}

      {isSelected && canvas?.interactive && (
        <>
          {!el.locked && (
            <>
              <button
                type="button"
                className="cv-canvas-rotate-handle no-print"
                data-canvas-ui-chrome="true"
                data-resize-handle="rotate"
                title="تدوير العنصر / Rotate"
                onPointerDown={handleRotateStart}
              >
                <RotateCw size={11} />
              </button>

              {HANDLE_DIRS.map((dir) => (
                <span
                  key={dir}
                  data-canvas-ui-chrome="true"
                  data-resize-handle={dir}
                  className={`cv-canvas-handle handle-${dir} no-print`}
                  onPointerDown={(e) => handleResizeStart(dir, e)}
                />
              ))}
            </>
          )}

          <div className="cv-canvas-quickbar no-print" data-canvas-ui-chrome="true">
            {(el.type === 'text' || el.type === 'badge') && !el.locked && (
              <button
                type="button"
                title="تعديل النص / Edit text"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingText(true);
                }}
              >
                <Pencil size={12} />
              </button>
            )}
            <button type="button" title="تقديم للأمام / Bring forward" onClick={(e) => shiftZ(2, e)}>
              <ArrowUp size={12} />
            </button>
            <button type="button" title="إرسال للخلف / Send backward" onClick={(e) => shiftZ(-2, e)}>
              <ArrowDown size={12} />
            </button>
            <button
              type="button"
              title={
                el.layerPlane === 'underlay'
                  ? 'نقل فوق نص السيرة / Move above CV text'
                  : 'نقل خلف نص السيرة كخلفية / Send behind CV text'
              }
              onClick={togglePlane}
            >
              <Layers size={12} />
            </button>
            <button type="button" title="تكرار / Duplicate" onClick={duplicateEl}>
              <Copy size={12} />
            </button>
            <button
              type="button"
              title={el.locked ? 'فك القفل / Unlock' : 'قفل العنصر / Lock'}
              onClick={(e) => {
                e.stopPropagation();
                updateEl({ locked: !el.locked });
              }}
            >
              {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            {!el.locked && (
              <button
                type="button"
                className="danger"
                title="حذف / Delete"
                data-testid={`delete-canvas-el-${el.id}`}
                onClick={removeEl}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function CanvasOverlayLayer({
  doc,
  pageIndex,
  plane,
  canvas,
  onFocusInspector,
}: {
  doc: ResumeDocument;
  pageIndex: number;
  plane: 'underlay' | 'overlay';
  canvas?: SheetInteractiveCallbacks;
  onFocusInspector?: () => void;
}) {
  const items = (doc.canvasElements || [])
    .filter((el) => el.visible !== false && (el.pageIndex || 0) === pageIndex && el.layerPlane === plane)
    .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

  if (items.length === 0) return null;

  return (
    <div
      className={`cv-canvas-plane plane-${plane}`}
      data-canvas-plane={plane}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: plane === 'underlay' ? 0 : 12,
      }}
    >
      {items.map((el) => (
        <CanvasElementNode
          key={el.id}
          el={el}
          canvas={canvas}
          onFocusInspector={onFocusInspector}
        />
      ))}
    </div>
  );
}
