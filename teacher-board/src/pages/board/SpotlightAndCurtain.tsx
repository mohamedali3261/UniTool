import React, { useEffect, useState } from 'react';
import { GripHorizontal, X } from 'lucide-react';
import { useBoard } from '../../app/BoardContext';

export const SpotlightAndCurtain: React.FC = () => {
  const { isAr, overlays, setOverlays } = useBoard();
  const [spotPos, setSpotPos] = useState({ x: 50, y: 46 });

  useEffect(() => {
    if (!overlays.spotlight) return;
    const onMove = (e: PointerEvent) => {
      setSpotPos({
        x: (e.clientX / Math.max(1, window.innerWidth)) * 100,
        y: (e.clientY / Math.max(1, window.innerHeight)) * 100,
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [overlays.spotlight]);

  return (
    <>
      {overlays.spotlight && (
        <div
          data-testid="tb-spotlight-overlay"
          className="tb-spotlight-layer"
          style={{
            background: `radial-gradient(circle 145px at ${spotPos.x}% ${spotPos.y}%, transparent 0%, transparent 78%, rgba(8, 12, 10, 0.72) 100%)`,
          }}
        >
          <button
            type="button"
            onClick={() => setOverlays((o) => ({ ...o, spotlight: false }))}
            className="tb-overlay-dismiss"
          >
            <X size={13} />
            <span>{isAr ? 'إغلاق الكشاف' : 'Close Spotlight'}</span>
          </button>
        </div>
      )}

      {overlays.curtain && (
        <div
          data-testid="tb-curtain-overlay"
          className="tb-curtain-shade"
          style={{ top: `${Math.round(overlays.curtainRatio * 100)}%` }}
        >
          <div className="tb-curtain-handle">
            <input
              type="range"
              min={12}
              max={90}
              value={Math.round(overlays.curtainRatio * 100)}
              onChange={(e) =>
                setOverlays((o) => ({ ...o, curtainRatio: Number(e.target.value) / 100 }))
              }
              aria-label={isAr ? 'تحريك ستارة الإجابة' : 'Slide answer curtain'}
            />
            <span className="tb-curtain-title">
              <GripHorizontal size={15} />
              {isAr ? 'اسحب الشريط لكشف خطوات الحل تدريجياً' : 'Slide to reveal solution step by step'}
            </span>
            <button
              type="button"
              onClick={() => setOverlays((o) => ({ ...o, curtain: false }))}
              className="tb-btn tb-btn--ghost"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
