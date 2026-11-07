import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  hitTestElement,
  renderSlideToContext,
  translateElement,
} from '../../core/boardRenderer';
import { uid } from '../../core/storage';
import { STICKY_COLORS } from '../../data/boardModes';
import { useBoard } from '../../app/BoardContext';
import type { BoardElement, LaserTrail, Point, ShapeItem, StrokeItem, TextItem } from '../../core/types';

interface SingleBoardPaneProps {
  pane: 'main' | 'split';
  paneLabel?: string;
  canvasRefOut?: React.MutableRefObject<HTMLCanvasElement | null>;
}

const SingleBoardPane: React.FC<SingleBoardPaneProps> = ({ pane, paneLabel, canvasRefOut }) => {
  const {
    isAr,
    activeSlide,
    tool,
    penColor,
    penSize,
    selectedId,
    setSelectedId,
    commitSlideElements,
    addBoardElement,
    setOpenPopover,
  } = useBoard();

  const elements = pane === 'split' ? activeSlide.splitElements : activeSlide.elements;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 960, h: 560 });
  const draftRef = useRef<BoardElement | null>(null);
  const dragStateRef = useRef<{
    mode: 'none' | 'draw' | 'shape' | 'move' | 'erase' | 'laser';
    startPt: Point;
    lastPt: Point;
    movingId?: string;
    workingElements?: BoardElement[];
  }>({
    mode: 'none',
    startPt: { x: 0, y: 0 },
    lastPt: { x: 0, y: 0 },
  });

  const laserTrailsRef = useRef<LaserTrail[]>([]);
  const laserRafRef = useRef<number | null>(null);
  const [editingText, setEditingText] = useState<{
    id: string | null;
    kind: 'text' | 'sticky';
    x: number;
    y: number;
    value: string;
    bgColor?: string;
  } | null>(null);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cssW = Math.max(260, Math.round(host.clientWidth || 960));
    const cssH = Math.max(260, Math.round(host.clientHeight || 560));
    sizeRef.current = { w: cssW, h: cssH };

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const activeList = dragStateRef.current.workingElements ?? elements;
    renderSlideToContext(ctx, cssW, cssH, activeSlide.surface, activeSlide.grid, activeList, {
      selectedId: pane === 'main' ? selectedId : null,
      draftElement: draftRef.current,
      laserTrails: laserTrailsRef.current,
      now: performance.now(),
      onAsyncAssetReady: () => paint(),
    });
    ctx.restore();
  }, [activeSlide.grid, activeSlide.surface, elements, pane, selectedId]);

  useEffect(() => {
    if (canvasRefOut && pane === 'main') {
      canvasRefOut.current = canvasRef.current;
    }
    paint();
  }, [paint, canvasRefOut, pane]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(host);
    return () => ro.disconnect();
  }, [paint]);

  const startLaserLoop = useCallback(() => {
    if (laserRafRef.current !== null) return;
    const step = () => {
      const now = performance.now();
      laserTrailsRef.current = laserTrailsRef.current
        .map((tr) => ({ ...tr, points: tr.points.filter((p) => now - p.t < 1400) }))
        .filter((tr) => tr.points.length > 1);
      paint();
      if (laserTrailsRef.current.length > 0) {
        laserRafRef.current = requestAnimationFrame(step);
      } else {
        laserRafRef.current = null;
      }
    };
    laserRafRef.current = requestAnimationFrame(step);
  }, [paint]);

  useEffect(() => {
    return () => {
      if (laserRafRef.current !== null) cancelAnimationFrame(laserRafRef.current);
    };
  }, []);

  const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setOpenPopover(null);
    const pt = toPoint(e);
    const { w: stageW, h: stageH } = sizeRef.current;

    if (tool === 'text' || tool === 'sticky') {
      setEditingText({
        id: null,
        kind: tool,
        x: Math.min(stageW - 250, Math.max(16, pt.x)),
        y: Math.min(stageH - 130, Math.max(16, pt.y)),
        value: '',
        bgColor: tool === 'sticky' ? STICKY_COLORS[0] : undefined,
      });
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic */
    }

    if (tool === 'select' || tool === 'pan') {
      const hit = hitTestElement(elements, pt.x, pt.y);
      if (hit) {
        setSelectedId(hit.id);
        dragStateRef.current = {
          mode: 'move',
          startPt: pt,
          lastPt: pt,
          movingId: hit.id,
          workingElements: elements,
        };
      } else {
        setSelectedId(null);
        dragStateRef.current = { mode: 'none', startPt: pt, lastPt: pt };
      }
      paint();
      return;
    }

    if (tool === 'eraser') {
      const hit = hitTestElement(elements, pt.x, pt.y);
      const next = hit ? elements.filter((el) => el.id !== hit.id) : elements;
      dragStateRef.current = {
        mode: 'erase',
        startPt: pt,
        lastPt: pt,
        workingElements: next,
      };
      paint();
      return;
    }

    if (tool === 'laser') {
      const trail: LaserTrail = { id: uid('laser'), points: [{ x: pt.x, y: pt.y, t: performance.now() }] };
      laserTrailsRef.current.push(trail);
      dragStateRef.current = { mode: 'laser', startPt: pt, lastPt: pt };
      startLaserLoop();
      return;
    }

    if (tool === 'pen' || tool === 'calligraphy' || tool === 'highlighter' || tool === 'dashed') {
      const stroke: StrokeItem = {
        id: uid('stroke'),
        kind: 'stroke',
        style: tool,
        color: penColor,
        size: penSize,
        points: [pt],
      };
      draftRef.current = stroke;
      dragStateRef.current = { mode: 'draw', startPt: pt, lastPt: pt };
      paint();
      return;
    }

    const shape: ShapeItem = {
      id: uid('shape'),
      kind: 'shape',
      shapeType: tool as ShapeItem['shapeType'],
      x: pt.x,
      y: pt.y,
      w: 2,
      h: 2,
      color: penColor,
      strokeWidth: Math.max(2.5, penSize),
    };
    draftRef.current = shape;
    dragStateRef.current = { mode: 'shape', startPt: pt, lastPt: pt };
    paint();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = dragStateRef.current;
    if (st.mode === 'none') return;
    const pt = toPoint(e);

    if (st.mode === 'draw' && draftRef.current?.kind === 'stroke') {
      draftRef.current.points.push(pt);
      st.lastPt = pt;
      paint();
    } else if (st.mode === 'shape' && draftRef.current?.kind === 'shape') {
      draftRef.current = {
        ...draftRef.current,
        w: pt.x - st.startPt.x,
        h: pt.y - st.startPt.y,
      };
      st.lastPt = pt;
      paint();
    } else if (st.mode === 'move' && st.movingId && st.workingElements) {
      const dx = pt.x - st.lastPt.x;
      const dy = pt.y - st.lastPt.y;
      st.workingElements = st.workingElements.map((el) =>
        el.id === st.movingId ? translateElement(el, dx, dy) : el
      );
      st.lastPt = pt;
      paint();
    } else if (st.mode === 'erase' && st.workingElements) {
      const hit = hitTestElement(st.workingElements, pt.x, pt.y);
      if (hit) {
        st.workingElements = st.workingElements.filter((el) => el.id !== hit.id);
        paint();
      }
    } else if (st.mode === 'laser') {
      const current = laserTrailsRef.current[laserTrailsRef.current.length - 1];
      if (current) {
        current.points.push({ x: pt.x, y: pt.y, t: performance.now() });
        startLaserLoop();
      }
    }
  };

  const handlePointerUp = () => {
    const st = dragStateRef.current;
    if (st.mode === 'draw' && draftRef.current) {
      const finished = draftRef.current;
      draftRef.current = null;
      dragStateRef.current = { mode: 'none', startPt: { x: 0, y: 0 }, lastPt: { x: 0, y: 0 } };
      commitSlideElements([...elements, finished], pane);
    } else if (st.mode === 'shape' && draftRef.current?.kind === 'shape') {
      const s = draftRef.current;
      draftRef.current = null;
      dragStateRef.current = { mode: 'none', startPt: { x: 0, y: 0 }, lastPt: { x: 0, y: 0 } };
      const maxSpan = Math.min(340, sizeRef.current.w - 48);
      const finalShape: ShapeItem =
        Math.hypot(s.w, s.h) < 12
          ? { ...s, w: s.shapeType === 'number-line' ? maxSpan : 140, h: s.shapeType === 'number-line' ? 50 : 110 }
          : s;
      commitSlideElements([...elements, finalShape], pane);
    } else if (st.mode === 'move' && st.workingElements) {
      const updated = st.workingElements;
      dragStateRef.current = { mode: 'none', startPt: { x: 0, y: 0 }, lastPt: { x: 0, y: 0 } };
      if (updated !== elements) {
        commitSlideElements(updated, pane);
      }
    } else if (st.mode === 'erase' && st.workingElements) {
      const updated = st.workingElements;
      dragStateRef.current = { mode: 'none', startPt: { x: 0, y: 0 }, lastPt: { x: 0, y: 0 } };
      if (updated.length !== elements.length) {
        commitSlideElements(updated, pane);
      }
    } else {
      dragStateRef.current = { mode: 'none', startPt: { x: 0, y: 0 }, lastPt: { x: 0, y: 0 } };
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const hit = hitTestElement(elements, px, py);
    if (hit && (hit.kind === 'text' || hit.kind === 'sticky')) {
      setEditingText({
        id: hit.id,
        kind: hit.kind,
        x: hit.x,
        y: hit.y,
        value: hit.text,
        bgColor: hit.bgColor,
      });
    }
  };

  const commitTextOverlay = () => {
    if (!editingText) return;
    const trimmed = editingText.value.trim();
    if (!trimmed) {
      setEditingText(null);
      return;
    }
    const cardW = Math.min(editingText.kind === 'sticky' ? 260 : 300, sizeRef.current.w - 32);
    if (editingText.id) {
      commitSlideElements(
        elements.map((el) => (el.id === editingText.id && 'text' in el ? { ...el, text: trimmed } : el)),
        pane
      );
    } else {
      const newItem: TextItem = {
        id: uid(editingText.kind),
        kind: editingText.kind,
        x: editingText.x,
        y: editingText.y,
        w: cardW,
        h: editingText.kind === 'sticky' ? 125 : 64,
        text: trimmed,
        color: editingText.kind === 'sticky' ? '#1e293b' : penColor,
        bgColor: editingText.bgColor,
        fontSize: editingText.kind === 'sticky' ? 16 : 21,
      };
      addBoardElement(newItem, pane);
    }
    setEditingText(null);
  };

  return (
    <div ref={hostRef} className="tb-board-pane" data-pane={pane}>
      {paneLabel && <div className="tb-pane-badge">{paneLabel}</div>}
      <canvas
        ref={canvasRef}
        data-testid={pane === 'main' ? 'tb-main-canvas' : 'tb-split-canvas'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className="tb-board-canvas"
      />

      {editingText && (
        <div
          className="tb-inline-editor-card"
          style={{
            left: Math.min(editingText.x, Math.max(12, sizeRef.current.w - 290)),
            top: Math.min(editingText.y, Math.max(12, sizeRef.current.h - 170)),
          }}
        >
          <textarea
            autoFocus
            rows={3}
            value={editingText.value}
            onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
            placeholder={isAr ? 'اكتب النص أو الملاحظة هنا…' : 'Type board text or sticky note…'}
            className="tb-inline-textarea"
          />
          <div className="tb-inline-editor-actions">
            {editingText.kind === 'sticky' && (
              <div className="tb-swatch-row">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditingText({ ...editingText, bgColor: c })}
                    style={{ background: c }}
                    className={`tb-mini-swatch ${editingText.bgColor === c ? 'is-selected' : ''}`}
                    aria-label={c}
                  />
                ))}
              </div>
            )}
            <button type="button" onClick={commitTextOverlay} className="tb-btn tb-btn--primary">
              {isAr ? 'إضافة للسبورة' : 'Add'}
            </button>
            <button type="button" onClick={() => setEditingText(null)} className="tb-btn tb-btn--ghost">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const BoardCanvasStage: React.FC<{
  mainCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}> = ({ mainCanvasRef }) => {
  const { overlays, t } = useBoard();

  return (
    <div
      className={`tb-stage-grid ${overlays.splitBoard ? 'is-split' : ''}`}
      data-testid="tb-canvas-stage"
      data-split={overlays.splitBoard ? 'true' : 'false'}
    >
      <SingleBoardPane
        pane="main"
        paneLabel={overlays.splitBoard ? t.leftPaneTitle : undefined}
        canvasRefOut={mainCanvasRef}
      />
      {overlays.splitBoard && (
        <SingleBoardPane pane="split" paneLabel={t.rightPaneTitle} />
      )}
    </div>
  );
};
