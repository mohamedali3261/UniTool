import React, { useRef } from 'react';
import { RotateCw, X } from 'lucide-react';
import { useBoard } from '../../app/BoardContext';

export const GeometryToolsOverlay: React.FC = () => {
  const { isAr, geometry, setGeometry } = useBoard();
  const dragRef = useRef<{
    tool: 'ruler' | 'protractor' | 'setSquare' | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ tool: null, startX: 0, startY: 0, origX: 0, origY: 0 });

  const beginDrag = (
    tool: 'ruler' | 'protractor' | 'setSquare',
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    e.stopPropagation();
    const cur = geometry[tool];
    dragRef.current = {
      tool,
      startX: e.clientX,
      startY: e.clientY,
      origX: cur.x,
      origY: cur.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.tool) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const key = d.tool;
    setGeometry((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        x: Math.max(20, d.origX + dx),
        y: Math.max(20, d.origY + dy),
      },
    }));
  };

  const endDrag = () => {
    dragRef.current.tool = null;
  };

  return (
    <>
      {/* 1. Interactive Graduated Ruler (cm) */}
      {geometry.ruler.visible && (
        <div
          data-testid="tb-geometry-ruler"
          onPointerDown={(e) => beginDrag('ruler', e)}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          className="tb-geo-tool tb-geo-ruler"
          style={{
            left: geometry.ruler.x,
            top: geometry.ruler.y,
            width: geometry.ruler.lengthPx,
            transform: `rotate(${geometry.ruler.angle}deg)`,
          }}
        >
          <div className="tb-geo-ticks">
            {Array.from({ length: 21 }, (_, cm) => (
              <div key={cm} className="tb-geo-cm">
                <span>{cm}</span>
              </div>
            ))}
          </div>
          <div className="tb-geo-controls">
            <span className="tb-geo-angle-badge">{geometry.ruler.angle}°</span>
            <button
              type="button"
              onClick={() =>
                setGeometry((g) => ({
                  ...g,
                  ruler: { ...g.ruler, angle: (g.ruler.angle + 15) % 360 },
                }))
              }
              title={isAr ? 'تدوير ١٥°' : 'Rotate 15°'}
            >
              <RotateCw size={12} />
            </button>
            <button
              type="button"
              onClick={() =>
                setGeometry((g) => ({ ...g, ruler: { ...g.ruler, visible: false } }))
              }
              aria-label={isAr ? 'إغلاق المسطرة' : 'Close ruler'}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive 180° Protractor with Live Angle Arm */}
      {geometry.protractor.visible && (
        <div
          data-testid="tb-geometry-protractor"
          onPointerDown={(e) => beginDrag('protractor', e)}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          className="tb-geo-tool tb-geo-protractor"
          style={{
            left: geometry.protractor.x,
            top: geometry.protractor.y,
            transform: `rotate(${geometry.protractor.angle}deg)`,
          }}
        >
          <svg viewBox="0 0 260 145" className="tb-protractor-svg">
            <path
              d="M 10 135 A 120 120 0 0 1 250 135 Z"
              fill="rgba(255,255,255,0.82)"
              stroke="#24795e"
              strokeWidth="2"
            />
            {Array.from({ length: 19 }, (_, idx) => {
              const deg = idx * 10;
              const rad = (deg * Math.PI) / 180;
              const x1 = 130 - 118 * Math.cos(rad);
              const y1 = 135 - 118 * Math.sin(rad);
              const x2 = 130 - 104 * Math.cos(rad);
              const y2 = 135 - 104 * Math.sin(rad);
              const tx = 130 - 90 * Math.cos(rad);
              const ty = 135 - 90 * Math.sin(rad);
              return (
                <g key={deg}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1f4434" strokeWidth="1.3" />
                  {deg % 30 === 0 && (
                    <text x={tx} y={ty} fontSize="8.5" textAnchor="middle" fill="#1f4434" fontWeight="700">
                      {deg}°
                    </text>
                  )}
                </g>
              );
            })}
            {/* Live Angle Ray */}
            {(() => {
              const r = (geometry.protractor.measureDeg * Math.PI) / 180;
              const rx = 130 + 112 * Math.cos(r);
              const ry = 135 - 112 * Math.sin(r);
              return (
                <>
                  <line x1="130" y1="135" x2={rx} y2={ry} stroke="#dc2626" strokeWidth="2.4" />
                  <circle cx="130" cy="135" r="4" fill="#24795e" />
                </>
              );
            })()}
          </svg>
          <div className="tb-protractor-bar">
            <input
              type="range"
              min={0}
              max={180}
              value={geometry.protractor.measureDeg}
              onChange={(e) =>
                setGeometry((g) => ({
                  ...g,
                  protractor: { ...g.protractor, measureDeg: Number(e.target.value) },
                }))
              }
              aria-label={isAr ? 'قياس الزاوية' : 'Measure angle'}
            />
            <span className="tb-geo-angle-badge">{geometry.protractor.measureDeg}°</span>
            <button
              type="button"
              onClick={() =>
                setGeometry((g) => ({ ...g, protractor: { ...g.protractor, visible: false } }))
              }
              aria-label={isAr ? 'إغلاق المنقلة' : 'Close protractor'}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Right-Angle Set Square */}
      {geometry.setSquare.visible && (
        <div
          data-testid="tb-geometry-setsquare"
          onPointerDown={(e) => beginDrag('setSquare', e)}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          className="tb-geo-tool tb-geo-setsquare"
          style={{
            left: geometry.setSquare.x,
            top: geometry.setSquare.y,
            transform: `rotate(${geometry.setSquare.angle}deg)`,
          }}
        >
          <svg viewBox="0 0 180 180" width="170" height="170">
            <polygon
              points="12,168 168,168 12,12"
              fill="rgba(236, 253, 245, 0.8)"
              stroke="#24795e"
              strokeWidth="2.5"
            />
            <polygon
              points="38,144 106,144 38,76"
              fill="rgba(255,255,255,0.5)"
              stroke="#24795e"
              strokeWidth="1.4"
            />
          </svg>
          <div className="tb-setsquare-actions">
            <button
              type="button"
              onClick={() =>
                setGeometry((g) => ({
                  ...g,
                  setSquare: { ...g.setSquare, angle: (g.setSquare.angle + 45) % 360 },
                }))
              }
              title={isAr ? 'تدوير ٤٥°' : 'Rotate 45°'}
            >
              <RotateCw size={12} />
            </button>
            <button
              type="button"
              onClick={() =>
                setGeometry((g) => ({ ...g, setSquare: { ...g.setSquare, visible: false } }))
              }
              aria-label={isAr ? 'إغلاق المثلث' : 'Close set square'}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
