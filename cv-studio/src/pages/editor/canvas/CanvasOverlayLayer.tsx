import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenterHorizontal,
  ArrowDown,
  ArrowUp,
  Copy,
  Layers,
  Lock,
  Pencil,
  RotateCw,
  SlidersHorizontal,
  Star,
  Trash2,
  Unlock,
} from 'lucide-react';
import { getPaperDimensions } from '../../../core/pagination';
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
const SNAP_THRESHOLD_PX = 5;

function resolveExactSheetScale(node: HTMLElement | null, fallback: number): number {
  const sheet = node?.closest('[data-cv-sheet]') as HTMLElement | null;
  if (sheet && sheet.offsetWidth > 0) {
    const rectW = sheet.getBoundingClientRect().width;
    if (rectW > 20) {
      return rectW / sheet.offsetWidth;
    }
  }
  return fallback || 1;
}

interface SnapResult {
  x: number;
  y: number;
  guideX: number | null;
  guideY: number | null;
}

function computeMagneticSnap(
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  sheetW: number,
  sheetH: number,
  marginPx: number,
  siblings: CanvasElement[],
): SnapResult {
  const xTargets: number[] = [marginPx, sheetW / 2, sheetW - marginPx];
  const yTargets: number[] = [marginPx, sheetH / 2, sheetH - marginPx];

  for (const sib of siblings) {
    xTargets.push(sib.x, sib.x + sib.width / 2, sib.x + sib.width);
    yTargets.push(sib.y, sib.y + sib.height / 2, sib.y + sib.height);
  }

  let bestX = rawX;
  let minDiffX = SNAP_THRESHOLD_PX + 0.01;
  let guideX: number | null = null;

  const anchorsX = [
    { offset: 0, val: rawX },
    { offset: width / 2, val: rawX + width / 2 },
    { offset: width, val: rawX + width },
  ];

  for (const anchor of anchorsX) {
    for (const target of xTargets) {
      const diff = Math.abs(anchor.val - target);
      if (diff < minDiffX) {
        minDiffX = diff;
        bestX = target - anchor.offset;
        guideX = target;
      }
    }
  }

  let bestY = rawY;
  let minDiffY = SNAP_THRESHOLD_PX + 0.01;
  let guideY: number | null = null;

  const anchorsY = [
    { offset: 0, val: rawY },
    { offset: height / 2, val: rawY + height / 2 },
    { offset: height, val: rawY + height },
  ];

  for (const anchor of anchorsY) {
    for (const target of yTargets) {
      const diff = Math.abs(anchor.val - target);
      if (diff < minDiffY) {
        minDiffY = diff;
        bestY = target - anchor.offset;
        guideY = target;
      }
    }
  }

  return { x: bestX, y: bestY, guideX, guideY };
}

function CanvasElementNode({
  el,
  siblings,
  sheetWidth,
  sheetHeight,
  marginPx,
  canvas,
  onFocusInspector,
  onShowGuides,
}: {
  el: CanvasElement;
  siblings: CanvasElement[];
  sheetWidth: number;
  sheetHeight: number;
  marginPx: number;
  canvas?: SheetInteractiveCallbacks;
  onFocusInspector?: () => void;
  onShowGuides: (gx: number | null, gy: number | null) => void;
}) {
  const [editingText, setEditingText] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

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

  const setHudText = (label: string | null) => {
    const hud = hudRef.current;
    if (!hud) return;
    if (!label) {
      hud.style.display = 'none';
      hud.textContent = '';
    } else {
      hud.style.display = 'inline-flex';
      hud.textContent = label;
    }
  };

  const updateEl = (patch: Partial<CanvasElement>) => {
    if (!canvas) return;
    canvas.onUpdateDoc((prev: ResumeDocument) => ({
      ...prev,
      canvasElements: (prev.canvasElements || []).map((item) =>
        item.id === el.id ? { ...item, ...patch } : item,
      ),
    }));
  };

  /**
   * Ultra-smooth 120fps GPU-composited move handler:
   * - Zero React state updates during pointermove (direct translate3d on boxRef)
   * - Pointer capture prevents lost events on fast cursor movement
   * - Magnetic smart snap guides to sheet center, margins & sibling elements
   * - Commits final (x, y) ONCE on pointerup for instant Undo/Redo
   */
  const handlePointerDownMove = (e: React.PointerEvent<HTMLDivElement>) => {
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
    if (e.button !== 0) return;

    // Prevent native browser image ghost-drag & accidental text range selection
    e.preventDefault();

    if (!isSelected) {
      canvas.onSelect({ kind: 'element', id: el.id });
    }

    if (el.locked) return;

    const node = boxRef.current;
    if (!node) return;

    const pointerId = e.pointerId;
    try {
      node.setPointerCapture(pointerId);
    } catch {
      /* ignore synthetic pointer events in headless tests */
    }

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const origX = el.x;
    const origY = el.y;
    const rotSuffix = el.rotation ? ` rotate(${el.rotation}deg)` : '';
    const scale = resolveExactSheetScale(node, canvas.zoomScale);
    const snapActive = canvas.snapToGuides !== false;

    let moved = false;
    let latestX = origX;
    let latestY = origY;

    const onMove = (ev: PointerEvent) => {
      const dxScreen = ev.clientX - startClientX;
      const dyScreen = ev.clientY - startClientY;
      if (!moved && Math.hypot(dxScreen, dyScreen) < 2.5) return;

      if (!moved) {
        moved = true;
        document.body.classList.add('cv-dragging-active');
        node.classList.add('is-dragging-live');
      }

      let candidateX = origX + dxScreen / scale;
      let candidateY = origY + dyScreen / scale;

      if (snapActive && !ev.altKey) {
        const snapped = computeMagneticSnap(
          candidateX,
          candidateY,
          el.width,
          el.height,
          sheetWidth,
          sheetHeight,
          marginPx,
          siblings,
        );
        candidateX = snapped.x;
        candidateY = snapped.y;
        onShowGuides(snapped.guideX, snapped.guideY);
      } else {
        onShowGuides(null, null);
      }

      latestX = Math.round(candidateX * 2) / 2;
      latestY = Math.round(candidateY * 2) / 2;

      const deltaX = latestX - origX;
      const deltaY = latestY - origY;
      node.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)${rotSuffix}`;
      setHudText(`${Math.round(latestX)}, ${Math.round(latestY)}`);
    };

    const finish = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      try {
        if (node.hasPointerCapture?.(pointerId)) node.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      document.body.classList.remove('cv-dragging-active');
      node.classList.remove('is-dragging-live');
      onShowGuides(null, null);
      setHudText(null);

      if (moved) {
        // Apply final position directly to DOM before React commit to avoid any 1-frame jump
        node.style.left = `${latestX}px`;
        node.style.top = `${latestY}px`;
        node.style.transform = el.rotation ? `rotate(${el.rotation}deg)` : '';
        updateEl({ x: Math.round(latestX), y: Math.round(latestY) });
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  /**
   * Smooth 120fps direct-DOM resize handler across all 8 handles
   */
  const handleResizeStart = (dir: ResizeDir, e: React.PointerEvent<HTMLElement>) => {
    if (!canvas?.interactive || el.locked || !boxRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const node = boxRef.current;
    const pointerId = e.pointerId;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }

    document.body.classList.add('cv-dragging-active');
    node.classList.add('is-dragging-live');

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const orig = { x: el.x, y: el.y, w: el.width, h: el.height };
    const scale = resolveExactSheetScale(node, canvas.zoomScale);

    let finalRect = { ...orig };

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / scale;
      const dy = (ev.clientY - startClientY) / scale;

      let nextX = orig.x;
      let nextY = orig.y;
      let nextW = orig.w;
      let nextH = orig.h;

      if (dir.includes('e')) nextW = Math.max(24, orig.w + dx);
      if (dir.includes('s')) nextH = Math.max(16, orig.h + dy);
      if (dir.includes('w')) {
        const w = Math.max(24, orig.w - dx);
        nextX = orig.x + (orig.w - w);
        nextW = w;
      }
      if (dir.includes('n')) {
        const h = Math.max(16, orig.h - dy);
        nextY = orig.y + (orig.h - h);
        nextH = h;
      }

      // Shift key locks aspect ratio on corner handles
      if (ev.shiftKey && dir.length === 2 && orig.h > 0) {
        const ratio = orig.w / orig.h;
        nextH = Math.max(16, nextW / ratio);
        if (dir.includes('n')) {
          nextY = orig.y + (orig.h - nextH);
        }
      }

      finalRect = {
        x: Math.round(nextX),
        y: Math.round(nextY),
        w: Math.round(nextW),
        h: Math.round(nextH),
      };

      node.style.left = `${finalRect.x}px`;
      node.style.top = `${finalRect.y}px`;
      node.style.width = `${finalRect.w}px`;
      node.style.height = `${finalRect.h}px`;
      setHudText(`${finalRect.w} × ${finalRect.h}`);
    };

    const finish = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      document.body.classList.remove('cv-dragging-active');
      node.classList.remove('is-dragging-live');
      setHudText(null);
      updateEl({
        x: finalRect.x,
        y: finalRect.y,
        width: finalRect.w,
        height: finalRect.h,
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  /**
   * Smooth 120fps direct-DOM rotation handler with 45° magnetic angle detents
   */
  const handleRotateStart = (e: React.PointerEvent<HTMLElement>) => {
    if (!canvas?.interactive || el.locked || !boxRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const node = boxRef.current;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    document.body.classList.add('cv-dragging-active');
    node.classList.add('is-dragging-live');

    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let finalDeg = el.rotation || 0;

    const onMove = (ev: PointerEvent) => {
      const rad = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      let deg = Math.round((rad * 180) / Math.PI + 90);
      if (deg > 180) deg -= 360;
      if (!ev.altKey) {
        for (const snap of [-180, -135, -90, -45, 0, 45, 90, 135, 180]) {
          if (Math.abs(deg - snap) <= 4) {
            deg = snap;
            break;
          }
        }
      }
      finalDeg = deg;
      node.style.transform = `rotate(${deg}deg)`;
      setHudText(`${deg}°`);
    };

    const finish = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      document.body.classList.remove('cv-dragging-active');
      node.classList.remove('is-dragging-live');
      setHudText(null);
      updateEl({ rotation: finalDeg });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  const commitInlineText = () => {
    setEditingText(false);
    if (!textRef.current) return;
    const next = (textRef.current.innerText ?? '').replace(/\r/g, '');
    if (next !== (el.text || '')) {
      updateEl({ text: next });
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

  const centerHorizontally = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateEl({ x: Math.round((sheetWidth - el.width) / 2) });
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
                pointerEvents: 'none',
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
              }}
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
            pointerEvents: 'none',
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
        <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
          <CanvasDividerSvg
            dividerStyle={el.dividerStyle}
            strokeColor={el.strokeColor}
            strokeWidth={el.strokeWidth}
          />
        </div>
      );
    }

    if (el.type === 'icon') {
      const IconComp =
        CANVAS_ICON_MAP[(el.iconName as CanvasIconKey) || 'Sparkles'] || CANVAS_ICON_MAP.Sparkles;
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
            pointerEvents: 'none',
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
            pointerEvents: 'none',
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
        zIndex: isSelected ? Math.max(40, el.zIndex || 10) : el.zIndex || 10,
        touchAction: canvas?.interactive && !editingText ? 'none' : undefined,
      }}
      onPointerDown={handlePointerDownMove}
    >
      {renderInnerContent()}

      {/* Live 120fps Coordinate / Dimension / Rotation HUD */}
      <div
        ref={hudRef}
        className="cv-canvas-live-hud no-print"
        data-canvas-ui-chrome="true"
        style={{ display: 'none' }}
      />

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
            {onFocusInspector && (
              <button
                type="button"
                title="فتح خصائص وفلاتر العنصر / Inspector"
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusInspector();
                }}
              >
                <SlidersHorizontal size={12} />
              </button>
            )}
            {!el.locked && (
              <button
                type="button"
                title="توسيط أفقي بالصفحة / Center Horizontally"
                onClick={centerHorizontally}
              >
                <AlignCenterHorizontal size={12} />
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
  const guideVRef = useRef<HTMLDivElement>(null);
  const guideHRef = useRef<HTMLDivElement>(null);

  const dims = getPaperDimensions(doc.design.paperSize);
  const marginPx = Math.round((doc.design.marginMm || 15) * 3.78);

  const pageElements = (doc.canvasElements || []).filter(
    (el) => el.visible !== false && (el.pageIndex || 0) === pageIndex,
  );
  const items = pageElements
    .filter((el) => el.layerPlane === plane)
    .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

  const showGuides = (gx: number | null, gy: number | null) => {
    if (guideVRef.current) {
      if (gx === null) {
        guideVRef.current.style.display = 'none';
      } else {
        guideVRef.current.style.display = 'block';
        guideVRef.current.style.left = `${gx}px`;
      }
    }
    if (guideHRef.current) {
      if (gy === null) {
        guideHRef.current.style.display = 'none';
      } else {
        guideHRef.current.style.display = 'block';
        guideHRef.current.style.top = `${gy}px`;
      }
    }
  };

  const showHelperGrid = Boolean(canvas?.interactive && canvas?.showGrid && plane === 'overlay');

  if (items.length === 0 && !showHelperGrid) return null;

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
      {showHelperGrid && (
        <div
          className="cv-canvas-helper-grid no-print"
          data-canvas-ui-chrome="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(to right, rgba(36,121,94,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(36,121,94,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {items.map((el) => (
        <CanvasElementNode
          key={el.id}
          el={el}
          siblings={pageElements.filter((other) => other.id !== el.id)}
          sheetWidth={dims.widthPx}
          sheetHeight={dims.heightPx}
          marginPx={marginPx}
          canvas={canvas}
          onFocusInspector={onFocusInspector}
          onShowGuides={showGuides}
        />
      ))}

      {/* Live Magnetic Smart Alignment Guide Lines (never exported to PDF/Print) */}
      <div
        ref={guideVRef}
        className="cv-snap-guide-v no-print"
        data-canvas-ui-chrome="true"
        style={{ display: 'none' }}
      />
      <div
        ref={guideHRef}
        className="cv-snap-guide-h no-print"
        data-canvas-ui-chrome="true"
        style={{ display: 'none' }}
      />
    </div>
  );
}
