/**
 * The outline stage.
 *
 * Draws the current glyph as editable SVG (fill + hull + nodes), lets the user
 * drag nodes, marquee/lasso select, pan and zoom, and shows the "ghost" of the
 * untouched original so every change is visible. All pointer maths goes through
 * the shared mapper, so screen and font units never drift apart.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MousePointer2, PenTool, Hand, Lasso, ZoomIn, Undo2, Redo2, Eye, Grid3x3, Ruler, CornerUpLeft, Maximize2 } from 'lucide-react';
import type { GlyphContour, GlyphPoint, GlyphShape } from '../../core/fontEngine';
import { bboxOf, insidePolygon, nearestPoint, nodeKey, translate } from '../../core/geometry';
import { contoursToRawPathData } from '../../core/outline';
import { useStageMapper, zoomAround } from '../useStageView';
import { AdvanceBox, EmBox, MetricGuides, StageGrid, StageRulers } from './StageOverlay';
import type { StageTool } from '../../state/labStore';

export interface OutlineStageProps {
  shape: GlyphShape;
  original: GlyphContour[];
  advance: number;
  upm: number;
  metrics: { ascender: number; descender: number; xHeight: number; capHeight: number; unitsPerEm: number };
  userGuides: number[];
  tool: StageTool;
  zoom: number;
  pan: { x: number; y: number };
  selection: string[];
  showMetrics: boolean;
  showGrid: boolean;
  compare: boolean;
  lang: 'ar' | 'en';
  canUndo: boolean;
  canRedo: boolean;
  onTool: (tool: StageTool) => void;
  onZoom: (zoom: number, pan?: { x: number; y: number }) => void;
  onPan: (pan: { x: number; y: number }) => void;
  onSelection: (nodes: string[], contour?: number | null) => void;
  onContours: (contours: GlyphContour[], labelAr: string, labelEn: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleMetrics: () => void;
  onToggleGrid: () => void;
  onToggleCompare: () => void;
  onAddGuide: (y: number) => void;
}

type DragState =
  | { kind: 'nodes'; start: { x: number; y: number }; origin: GlyphContour[]; moved: boolean }
  | { kind: 'pan'; start: { x: number; y: number }; origin: { x: number; y: number } }
  | { kind: 'marquee'; start: { x: number; y: number }; current: { x: number; y: number } }
  | { kind: 'lasso'; points: Array<{ x: number; y: number }> }
  | null;

export function OutlineStage(props: OutlineStageProps) {
  const { shape, upm, metrics, tool, zoom, pan } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 520 });
  const [drag, setDrag] = useState<DragState>(null);
  const [penPoints, setPenPoints] = useState<Array<{ x: number; y: number }>>([]);
  // live geometry while a node drag is in flight: the document is only written once
  const [dragPreview, setDragPreview] = useState<GlyphContour[] | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setSize({ width: Math.max(240, rect.width), height: Math.max(240, rect.height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const mapper = useStageMapper({ ...size, zoom, pan, upm, padding: 46 });
  const shownContours = dragPreview ?? shape.contours;
  const pathData = useMemo(() => contoursToRawPathData(shownContours), [shownContours]);
  const ghostPath = useMemo(() => contoursToRawPathData(props.original), [props.original]);
  // font units → screen pixels: one transform shared by outline, ghost and handles
  const outlineTransform = `translate(${mapper.originX} ${mapper.originY}) scale(${mapper.scale} ${-mapper.scale})`;
  const selected = useMemo(() => new Set(props.selection), [props.selection]);
  const box = useMemo(
    () => bboxOf(shownContours.flatMap((contour) => contour.points)),
    [shownContours],
  );
  const ar = props.lang === 'ar';

  const pointAt = useCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    },
    [],
  );

  const commitContours = useCallback(
    (contours: GlyphContour[], labelAr: string, labelEn: string) => props.onContours(contours, labelAr, labelEn),
    [props],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointAt(event);
    const fontPoint = mapper.toFont(point.x, point.y);
    (event.target as Element).setPointerCapture?.(event.pointerId);

    if (event.button === 1 || props.tool === 'pan') {
      setDrag({ kind: 'pan', start: point, origin: pan });
      return;
    }

    if (props.tool === 'zoom') {
      props.onZoom(Math.min(8, zoom * 1.25));
      return;
    }

    if (props.tool === 'pen') {
      // Each click adds a node; double-click (see handleDoubleClick) closes the path.
      setPenPoints((points) => [...points, { x: Math.round(fontPoint.x), y: Math.round(fontPoint.y) }]);
      return;
    }

    if (props.tool === 'lasso') {
      setDrag({ kind: 'lasso', points: [point] });
      return;
    }

    // select tool
    const hit = nearestPoint(shape.contours, fontPoint.x, fontPoint.y, 12 / mapper.scale);
    if (hit) {
      const key = nodeKey(hit.point.contour, hit.point.contourIndex);
      const nextSelection = event.shiftKey
        ? selected.has(key)
          ? props.selection.filter((entry) => entry !== key)
          : [...props.selection, key]
        : selected.has(key)
          ? props.selection
          : [key];
      props.onSelection(nextSelection, hit.point.contour);
      setDragPreview(null);
      setDrag({ kind: 'nodes', start: fontPoint, origin: shape.contours, moved: false });
      return;
    }
    setDrag({ kind: 'marquee', start: point, current: point });
    if (!event.shiftKey) props.onSelection([]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointAt(event);
    const fontPoint = mapper.toFont(point.x, point.y);
    setCursor({ x: Math.round(fontPoint.x), y: Math.round(fontPoint.y) });
    if (!drag) return;

    if (drag.kind === 'pan') {
      props.onPan({ x: drag.origin.x + (point.x - drag.start.x), y: drag.origin.y + (point.y - drag.start.y) });
      return;
    }
    if (drag.kind === 'nodes') {
      const dx = fontPoint.x - drag.start.x;
      const dy = fontPoint.y - drag.start.y;
      const snap = event.altKey ? 1 : 2;
      const contours = translate(drag.origin, Math.round(dx / snap) * snap, Math.round(dy / snap) * snap, selected);
      setHover({ x: Math.round(dx), y: Math.round(dy) });
      setDragPreview(contours);
      setDrag({ ...drag, moved: true });
      return;
    }
    if (drag.kind === 'marquee') {
      setDrag({ ...drag, current: point });
      return;
    }
    if (drag.kind === 'lasso') {
      setDrag({ ...drag, points: [...drag.points, point] });
    }
  };

  const handlePointerUp = () => {
    if (drag?.kind === 'nodes') {
      // one undo entry per drag: the preview is written to the document once
      if (drag.moved && dragPreview) commitContours(dragPreview, 'تحريك نقاط', 'Moved points');
      setDragPreview(null);
      setDrag(null);
      setHover(null);
      return;
    }
    if (drag?.kind === 'marquee') {
      const { start, current } = drag;
      const x1 = Math.min(start.x, current.x);
      const x2 = Math.max(start.x, current.x);
      const y1 = Math.min(start.y, current.y);
      const y2 = Math.max(start.y, current.y);
      if (Math.abs(x2 - x1) > 4 || Math.abs(y2 - y1) > 4) {
        const nodes = shape.contours.flatMap((contour, contourIndex) =>
          contour.points
            .map((point, pointIndex) => ({ point, key: nodeKey(contourIndex, pointIndex) }))
            .filter(({ point }) => {
              const screen = mapper.toScreen(point.x, point.y);
              return screen.x >= x1 && screen.x <= x2 && screen.y >= y1 && screen.y <= y2;
            })
            .map(({ key }) => key),
        );
        props.onSelection(nodes);
      }
    }
    if (drag?.kind === 'lasso' && drag.points.length > 3) {
      const polygon = drag.points.map((point) => mapper.toFont(point.x, point.y));
      const nodes = shape.contours.flatMap((contour, contourIndex) =>
        contour.points
          .map((point, pointIndex) => ({ point, key: nodeKey(contourIndex, pointIndex) }))
          .filter(({ point }) => insidePolygon(polygon, point.x, point.y))
          .map(({ key }) => key),
      );
      props.onSelection(nodes);
    }
    setDrag(null);
    setHover(null);
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (props.tool === 'pen' && penPoints.length >= 3) {
      commitContours(
        [
          ...shape.contours,
          {
            closed: true,
            points: penPoints.map((entry) => ({ x: entry.x, y: entry.y, onCurve: true, contour: shape.contours.length, index: 0, contourIndex: 0 })),
          },
        ],
        'إضافة مسار',
        'Added path',
      );
      setPenPoints([]);
      return;
    }
    const point = pointAt(event);
    const fontPoint = mapper.toFont(point.x, point.y);
    const hit = nearestPoint(shape.contours, fontPoint.x, fontPoint.y, 14 / mapper.scale);
    if (hit) {
      // toggle corner ⇄ control point (a real outline operation)
      const contours = shape.contours.map((contour) =>
        contour.points.includes(hit.point)
          ? { ...contour, points: contour.points.map((entry) => (entry === hit.point ? { ...entry, onCurve: !entry.onCurve } : entry)) }
          : contour,
      );
      commitContours(contours, 'تغيير نوع النقطة', 'Changed point type');
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey && !event.altKey) {
      const point = pointAt(event);
      const next = zoom * (event.deltaY > 0 ? 0.92 : 1.08);
      const result = zoomAround({ ...size, zoom, pan, upm, padding: 46 }, Math.min(8, Math.max(0.25, next)), point);
      props.onZoom(result.zoom, result.pan);
      return;
    }
    event.preventDefault();
    const point = pointAt(event);
    const next = zoom * (event.deltaY > 0 ? 0.9 : 1.1);
    const result = zoomAround({ ...size, zoom, pan, upm, padding: 46 }, Math.min(8, Math.max(0.25, next)), point);
    props.onZoom(result.zoom, result.pan);
  };


  return (
    <div className="fl-stage-shell">
      <div className="fl-stage-toolbar">
        <div className="fl-stage-tools" role="toolbar" aria-label={ar ? 'أدوات الرسم' : 'Drawing tools'}>
          {(
            [
              { id: 'select', icon: <MousePointer2 size={15} />, ar: 'تحديد', en: 'Select' },
              { id: 'pen', icon: <PenTool size={15} />, ar: 'قلم', en: 'Pen' },
              { id: 'lasso', icon: <Lasso size={15} />, ar: 'لاسو', en: 'Lasso' },
              { id: 'pan', icon: <Hand size={15} />, ar: 'تحريك', en: 'Pan' },
              { id: 'zoom', icon: <ZoomIn size={15} />, ar: 'تكبير', en: 'Zoom' },
            ] as const
          ).map((entry) => (
            <button
              key={entry.id}
              type="button"
              title={`${entry.ar} / ${entry.en}`}
              aria-pressed={tool === entry.id}
              className={tool === entry.id ? 'is-active' : ''}
              onClick={() => props.onTool(entry.id)}
            >
              {entry.icon}
              <small>{ar ? entry.ar : entry.en}</small>
            </button>
          ))}
        </div>
        <div className="fl-stage-toggles">
          <button type="button" className={props.showMetrics ? 'is-active' : ''} title={ar ? 'أدلة المقاييس' : 'Metric guides'} aria-pressed={props.showMetrics} onClick={props.onToggleMetrics}>
            <Ruler size={15} />
          </button>
          <button type="button" className={props.showGrid ? 'is-active' : ''} title={ar ? 'الشبكة' : 'Grid'} aria-pressed={props.showGrid} onClick={props.onToggleGrid}>
            <Grid3x3 size={15} />
          </button>
          <button type="button" className={props.compare ? 'is-active' : ''} title={ar ? 'مقارنة بالأصل' : 'Compare with original'} aria-pressed={props.compare} onClick={props.onToggleCompare}>
            <Eye size={15} />
          </button>
          <button type="button" title={ar ? 'تراجع' : 'Undo'} aria-label={ar ? 'تراجع' : 'Undo'} onClick={props.onUndo} disabled={!props.canUndo}>
            <Undo2 size={15} />
          </button>
          <button type="button" title={ar ? 'إعادة' : 'Redo'} aria-label={ar ? 'إعادة' : 'Redo'} onClick={props.onRedo} disabled={!props.canRedo}>
            <Redo2 size={15} />
          </button>
          <button type="button" title={ar ? 'ملاءمة' : 'Fit'} aria-label={ar ? 'ملاءمة' : 'Fit'} onClick={() => props.onZoom(1, { x: 0, y: 0 })}>
            <Maximize2 size={15} />
          </button>
          <span className="fl-zoom-readout">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`fl-stage fl-tool-${tool}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        role="application"
        aria-label={ar ? 'مساحة تحرير الحرف' : 'Glyph outline editor'}
        tabIndex={0}
      >
        <svg width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`}>
          <defs>
            <pattern id="fl-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.35" />
            </pattern>
          </defs>
          {props.showGrid ? <StageGrid mapper={mapper} upm={upm} width={size.width} height={size.height} step={upm >= 2000 ? 100 : 50} /> : null}
          <EmBox mapper={mapper} upm={upm} />
          <AdvanceBox mapper={mapper} advance={props.advance} upm={upm} />
          {props.showMetrics ? <MetricGuides mapper={mapper} metrics={metrics} userGuides={props.userGuides} width={size.width} height={size.height} ar={ar} /> : null}

          <g transform={outlineTransform}>
            {props.compare && ghostPath ? <path d={ghostPath} className="fl-ghost" vectorEffect="non-scaling-stroke" /> : null}
            {pathData ? <path d={pathData} className="fl-outline-fill" vectorEffect="non-scaling-stroke" /> : null}
            {pathData ? <path d={pathData} className="fl-outline-line" vectorEffect="non-scaling-stroke" /> : null}
          </g>

          {/* hull of the current outline: shows where the node box is */}
          {shownContours.some((contour) => contour.points.length > 0) ? (
            <rect
              className="fl-bbox"
              x={mapper.toScreen(box.x1, box.y2).x}
              y={mapper.toScreen(box.x1, box.y2).y}
              width={Math.max(1, mapper.toScreen(box.x2, box.y1).x - mapper.toScreen(box.x1, box.y2).x)}
              height={Math.max(1, mapper.toScreen(box.x2, box.y1).y - mapper.toScreen(box.x1, box.y2).y)}
            />
          ) : null}

          {/* handles: control points sit on the curve of their node */}
          {shownContours.map((contour, contourIndex) =>
            contour.points.map((point: GlyphPoint, pointIndex: number) => {
              const screen = mapper.toScreen(point.x, point.y);
              const isSelected = selected.has(nodeKey(contourIndex, pointIndex));
              return (
                <g key={`${contourIndex}-${pointIndex}`} className={`fl-node${isSelected ? ' is-selected' : ''}${point.onCurve ? '' : ' is-control'}`}>
                  {point.onCurve ? (
                    <rect x={screen.x - 4} y={screen.y - 4} width={8} height={8} />
                  ) : (
                    <circle cx={screen.x} cy={screen.y} r={3.2} />
                  )}
                  {isSelected ? <circle cx={screen.x} cy={screen.y} r={8} className="fl-node-halo" /> : null}
                </g>
              );
            }),
          )}

          {drag?.kind === 'marquee' ? (
            <rect
              className="fl-marquee"
              x={Math.min(drag.start.x, drag.current.x)}
              y={Math.min(drag.start.y, drag.current.y)}
              width={Math.abs(drag.current.x - drag.start.x)}
              height={Math.abs(drag.current.y - drag.start.y)}
            />
          ) : null}
          {drag?.kind === 'lasso' ? (
            <polygon className="fl-lasso" points={drag.points.map((point) => `${point.x},${point.y}`).join(' ')} />
          ) : null}
          {penPoints.length > 0 ? (
            <g className="fl-pen-preview">
              <polyline points={penPoints.map((entry) => { const screen = mapper.toScreen(entry.x, entry.y); return `${screen.x},${screen.y}`; }).join(' ')} />
              {penPoints.map((entry, index) => {
                const screen = mapper.toScreen(entry.x, entry.y);
                return <circle key={index} cx={screen.x} cy={screen.y} r={4} />;
              })}
              <circle cx={mapper.toScreen(cursor.x, cursor.y).x} cy={mapper.toScreen(cursor.x, cursor.y).y} r={3} className="is-hover" />
            </g>
          ) : null}

          <StageRulers mapper={mapper} width={size.width} height={size.height} upm={upm} />
        </svg>

        <div className="fl-stage-coords" aria-live="off">
          <span>
            x <b>{cursor.x}</b>
          </span>
          <span>
            y <b>{cursor.y}</b>
          </span>
          <span>
            {ar ? 'المقياس' : 'upm'} <b>{upm}</b>
          </span>
          {hover ? (
            <span className="is-delta">
              Δ <b>{hover.x}</b> / <b>{hover.y}</b>
            </span>
          ) : null}
        </div>

        {shownContours.every((contour) => contour.points.length === 0) ? (
          <div className="fl-stage-empty">
            <CornerUpLeft size={22} />
            <p>{ar ? 'هذا الحرف فارغ — ارسم مساراً بالقلم أو أضف شكلاً جاهزاً.' : 'This glyph is empty — draw with the pen or add a preset shape.'}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
