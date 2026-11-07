import React from 'react';
import { Columns2, Eye, PanelTopClose, Maximize2 } from 'lucide-react';
import { gridLabels, surfaceLabels } from '../../core/i18n';
import { useBoard } from '../../app/BoardContext';
import type { BoardGrid, BoardSurface } from '../../core/types';

const SURFACES: BoardSurface[] = ['white', 'chalk-green', 'blackboard', 'sepia'];
const GRIDS: BoardGrid[] = ['plain', 'lined', 'grid', 'axes', 'dots', 'english-4line', 'music'];

export const BoardModesPopover: React.FC = () => {
  const {
    lang,
    isAr,
    t,
    activeSlide,
    setSlideSurface,
    setSlideGrid,
    overlays,
    setOverlays,
  } = useBoard();

  return (
    <div className="tb-popover tb-popover--wide" data-testid="tb-modes-popover">
      <div className="tb-popover__section">
        <span className="tb-popover__label">
          {isAr ? 'لون وخامة سطح السبورة' : 'Board Surface Mode'}
        </span>
        <div className="tb-surface-grid">
          {SURFACES.map((s) => {
            const info = surfaceLabels[s];
            const active = activeSlide.surface === s;
            return (
              <button
                key={s}
                type="button"
                data-testid={`tb-surface-${s}`}
                onClick={() => setSlideSurface(s)}
                className={`tb-surface-chip ${active ? 'is-active' : ''}`}
              >
                <span className="tb-surface-swatch" style={{ background: info.swatch }} />
                <span>{info[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tb-popover__section">
        <span className="tb-popover__label">
          {isAr ? 'تسطير وتخطيط المادة' : 'Subject Ruling / Grid'}
        </span>
        <div className="tb-chip-wrap">
          {GRIDS.map((g) => (
            <button
              key={g}
              type="button"
              data-testid={`tb-grid-${g}`}
              onClick={() => setSlideGrid(g)}
              className={`tb-pill-chip ${activeSlide.grid === g ? 'is-active' : ''}`}
            >
              {gridLabels[g][lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="tb-popover__section">
        <span className="tb-popover__label">
          {isAr ? 'أوضاع العرض والشرح التفاعلي' : 'Interactive Presentation Modes'}
        </span>
        <div className="tb-chip-wrap">
          <button
            type="button"
            data-testid="tb-toggle-split"
            onClick={() => setOverlays((o) => ({ ...o, splitBoard: !o.splitBoard }))}
            className={`tb-pill-chip ${overlays.splitBoard ? 'is-active' : ''}`}
          >
            <Columns2 size={13} />
            <span>{t.splitMode}</span>
          </button>

          <button
            type="button"
            data-testid="tb-toggle-spotlight"
            onClick={() => setOverlays((o) => ({ ...o, spotlight: !o.spotlight }))}
            className={`tb-pill-chip ${overlays.spotlight ? 'is-active' : ''}`}
          >
            <Eye size={13} />
            <span>{t.spotlight}</span>
          </button>

          <button
            type="button"
            data-testid="tb-toggle-curtain"
            onClick={() => setOverlays((o) => ({ ...o, curtain: !o.curtain }))}
            className={`tb-pill-chip ${overlays.curtain ? 'is-active' : ''}`}
          >
            <PanelTopClose size={13} />
            <span>{t.curtain}</span>
          </button>

          <button
            type="button"
            onClick={() => setOverlays((o) => ({ ...o, focusMode: !o.focusMode }))}
            className={`tb-pill-chip ${overlays.focusMode ? 'is-active' : ''}`}
          >
            <Maximize2 size={13} />
            <span>{t.focusMode}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
