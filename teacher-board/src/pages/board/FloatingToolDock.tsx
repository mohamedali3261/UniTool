import React from 'react';
import {
  MousePointer2,
  PenTool,
  Highlighter,
  Sparkles,
  Eraser,
  Shapes,
  Ruler,
  Sigma,
  SlidersHorizontal,
  Timer,
  StickyNote,
  Type,
  MoveUpRight,
  Square,
  Circle,
  Triangle,
  Minus,
} from 'lucide-react';
import { PEN_COLORS } from '../../data/boardModes';
import { useBoard, type ActivePopover } from '../../app/BoardContext';
import { BoardModesPopover } from './BoardModesPopover';
import { MathFormulaPopover } from './MathFormulaPopover';
import type { ToolId } from '../../core/types';

export const FloatingToolDock: React.FC = () => {
  const {
    isAr,
    t,
    tool,
    setTool,
    penColor,
    setPenColor,
    penSize,
    setPenSize,
    openPopover,
    setOpenPopover,
    geometry,
    setGeometry,
    quickWidget,
    setQuickWidget,
  } = useBoard();

  const togglePopover = (target: ActivePopover) => {
    setOpenPopover((cur) => (cur === target ? null : target));
  };

  const isPenGroup =
    tool === 'pen' || tool === 'calligraphy' || tool === 'highlighter' || tool === 'dashed';
  const isShapeGroup =
    tool === 'line' ||
    tool === 'arrow' ||
    tool === 'rect' ||
    tool === 'circle' ||
    tool === 'triangle' ||
    tool === 'number-line' ||
    tool === 'axes-shape';

  const shapeOptions: { id: ToolId; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'line', labelAr: 'خط مستقيم', labelEn: 'Line', icon: <Minus size={14} /> },
    { id: 'arrow', labelAr: 'سهم توضيحي', labelEn: 'Arrow', icon: <MoveUpRight size={14} /> },
    { id: 'rect', labelAr: 'مستطيل / مربع', labelEn: 'Rectangle', icon: <Square size={14} /> },
    { id: 'circle', labelAr: 'دائرة / قطع', labelEn: 'Circle', icon: <Circle size={14} /> },
    { id: 'triangle', labelAr: 'مثلث', labelEn: 'Triangle', icon: <Triangle size={14} /> },
    { id: 'number-line', labelAr: 'خط الأعداد', labelEn: 'Number Line', icon: <span>±5</span> },
    { id: 'axes-shape', labelAr: 'محاور س/ص', labelEn: 'X/Y Axes', icon: <span>┼</span> },
  ];

  return (
    <div className="tb-dock-anchor" data-testid="tb-floating-dock">
      {/* Contextual Progressive Popovers — only ONE open at a time, zero clutter */}
      {openPopover === 'pen' && (
        <div className="tb-popover" data-testid="tb-pen-popover">
          <div className="tb-popover__section">
            <span className="tb-popover__label">
              {isAr ? 'نوع القلم' : 'Pen Type'}
            </span>
            <div className="tb-chip-wrap">
              {(
                [
                  { id: 'pen', label: t.toolPen },
                  { id: 'calligraphy', label: t.toolCalligraphy },
                  { id: 'highlighter', label: t.toolHighlighter },
                  { id: 'dashed', label: t.toolDashed },
                ] as { id: ToolId; label: string }[]
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTool(p.id)}
                  className={`tb-pill-chip ${tool === p.id ? 'is-active' : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="tb-popover__section">
            <span className="tb-popover__label">
              {isAr ? 'اللون وسُمك الخط' : 'Ink Color & Thickness'}
            </span>
            <div className="tb-swatch-row">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPenColor(c)}
                  style={{ background: c }}
                  className={`tb-color-dot ${penColor.toLowerCase() === c.toLowerCase() ? 'is-selected' : ''}`}
                  aria-label={c}
                />
              ))}
              <input
                type="range"
                min={2}
                max={16}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                aria-label={isAr ? 'سمك القلم' : 'Pen thickness'}
                className="tb-size-slider"
              />
            </div>
          </div>
        </div>
      )}

      {openPopover === 'shapes' && (
        <div className="tb-popover" data-testid="tb-shapes-popover">
          <span className="tb-popover__label">
            {isAr ? 'اختر الشكل واسحبه على السبورة' : 'Pick shape & drag on board'}
          </span>
          <div className="tb-chip-wrap">
            {shapeOptions.map((sh) => (
              <button
                key={sh.id}
                type="button"
                data-testid={`tb-shape-${sh.id}`}
                onClick={() => {
                  setTool(sh.id);
                  setOpenPopover(null);
                }}
                className={`tb-pill-chip ${tool === sh.id ? 'is-active' : ''}`}
              >
                {sh.icon}
                <span>{isAr ? sh.labelAr : sh.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {openPopover === 'geometry' && (
        <div className="tb-popover" data-testid="tb-geometry-popover">
          <span className="tb-popover__label">{t.geometryKit}</span>
          <div className="tb-chip-wrap">
            <button
              type="button"
              data-testid="tb-toggle-ruler"
              onClick={() =>
                setGeometry((g) => ({ ...g, ruler: { ...g.ruler, visible: !g.ruler.visible } }))
              }
              className={`tb-pill-chip ${geometry.ruler.visible ? 'is-active' : ''}`}
            >
              {t.ruler}
            </button>
            <button
              type="button"
              data-testid="tb-toggle-protractor"
              onClick={() =>
                setGeometry((g) => ({
                  ...g,
                  protractor: { ...g.protractor, visible: !g.protractor.visible },
                }))
              }
              className={`tb-pill-chip ${geometry.protractor.visible ? 'is-active' : ''}`}
            >
              {t.protractor}
            </button>
            <button
              type="button"
              data-testid="tb-toggle-setsquare"
              onClick={() =>
                setGeometry((g) => ({
                  ...g,
                  setSquare: { ...g.setSquare, visible: !g.setSquare.visible },
                }))
              }
              className={`tb-pill-chip ${geometry.setSquare.visible ? 'is-active' : ''}`}
            >
              {t.setSquare}
            </button>
          </div>
        </div>
      )}

      {openPopover === 'insert' && <MathFormulaPopover />}

      {openPopover === 'modes' && <BoardModesPopover />}

      {/* Main Sleek Uncluttered Teaching Dock */}
      <nav className="tb-main-dock" aria-label={isAr ? 'أدوات السبورة' : 'Smartboard tools'}>
        <button
          type="button"
          data-testid="tb-tool-select"
          onClick={() => {
            setTool('select');
            setOpenPopover(null);
          }}
          className={`tb-dock-btn ${tool === 'select' ? 'is-active' : ''}`}
          title={t.toolSelect}
        >
          <MousePointer2 size={17} />
          <span>{isAr ? 'تحديد' : 'Select'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-tool-pen"
          onClick={() => {
            if (!isPenGroup) setTool('pen');
            togglePopover('pen');
          }}
          className={`tb-dock-btn ${isPenGroup ? 'is-active' : ''}`}
          title={t.toolPen}
        >
          <PenTool size={17} />
          <span>{isAr ? 'قلم' : 'Pen'}</span>
          <i className="tb-ink-indicator" style={{ background: penColor }} />
        </button>

        <button
          type="button"
          data-testid="tb-tool-highlighter"
          onClick={() => {
            setTool('highlighter');
            setOpenPopover(null);
          }}
          className={`tb-dock-btn tb-hide-xs ${tool === 'highlighter' ? 'is-active' : ''}`}
          title={t.toolHighlighter}
        >
          <Highlighter size={17} />
          <span>{isAr ? 'تظليل' : 'Marker'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-tool-laser"
          onClick={() => {
            setTool('laser');
            setOpenPopover(null);
          }}
          className={`tb-dock-btn ${tool === 'laser' ? 'is-active' : ''}`}
          title={t.toolLaser}
        >
          <Sparkles size={17} />
          <span>{isAr ? 'ليزر' : 'Laser'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-tool-eraser"
          onClick={() => {
            setTool('eraser');
            setOpenPopover(null);
          }}
          className={`tb-dock-btn ${tool === 'eraser' ? 'is-active' : ''}`}
          title={t.toolEraser}
        >
          <Eraser size={17} />
          <span>{isAr ? 'ممحاة' : 'Eraser'}</span>
        </button>

        <span className="tb-dock-sep" />

        <button
          type="button"
          data-testid="tb-tool-text"
          onClick={() => {
            setTool('text');
            setOpenPopover(null);
          }}
          className={`tb-dock-btn ${tool === 'text' ? 'is-active' : ''}`}
          title={t.toolText}
        >
          <Type size={17} />
          <span>{isAr ? 'نص' : 'Text'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-tool-sticky"
          onClick={() => {
            setTool('sticky');
            setOpenPopover(null);
          }}
          className={`tb-dock-btn tb-hide-xs ${tool === 'sticky' ? 'is-active' : ''}`}
          title={t.toolSticky}
        >
          <StickyNote size={17} />
          <span>{isAr ? 'ملاحظة' : 'Note'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-dock-shapes"
          onClick={() => togglePopover('shapes')}
          className={`tb-dock-btn ${isShapeGroup || openPopover === 'shapes' ? 'is-active' : ''}`}
          title={t.toolShapes}
        >
          <Shapes size={17} />
          <span>{isAr ? 'أشكال' : 'Shapes'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-dock-geometry"
          onClick={() => togglePopover('geometry')}
          className={`tb-dock-btn ${
            openPopover === 'geometry' ||
            geometry.ruler.visible ||
            geometry.protractor.visible ||
            geometry.setSquare.visible
              ? 'is-active'
              : ''
          }`}
          title={t.geometryKit}
        >
          <Ruler size={17} />
          <span>{isAr ? 'هندسة' : 'Geo'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-dock-insert"
          onClick={() => togglePopover('insert')}
          className={`tb-dock-btn ${openPopover === 'insert' ? 'is-active' : ''}`}
          title={t.insertMenu}
        >
          <Sigma size={17} />
          <span>{isAr ? 'معادلات' : 'STEM'}</span>
        </button>

        <span className="tb-dock-sep" />

        <button
          type="button"
          data-testid="tb-dock-modes"
          onClick={() => togglePopover('modes')}
          className={`tb-dock-btn ${openPopover === 'modes' ? 'is-active' : ''}`}
          title={t.boardModes}
        >
          <SlidersHorizontal size={17} />
          <span>{isAr ? 'الأوضاع' : 'Modes'}</span>
        </button>

        <button
          type="button"
          data-testid="tb-dock-widget"
          onClick={() => {
            setOpenPopover(null);
            setQuickWidget((w) => (w ? null : 'timer'));
          }}
          className={`tb-dock-btn ${quickWidget ? 'is-active' : ''}`}
          title={t.classQuick}
        >
          <Timer size={17} />
          <span>{isAr ? 'الفصل' : 'Class'}</span>
        </button>
      </nav>
    </div>
  );
};
