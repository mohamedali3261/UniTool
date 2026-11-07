import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { gridLabels, surfaceLabels } from '../../core/i18n';
import { useBoard } from '../../app/BoardContext';
import type { BoardGrid, BoardSurface } from '../../core/types';

export const CustomBoardSetupSection: React.FC = () => {
  const { lang, isAr, createNewLesson } = useBoard();
  const [surface, setSurface] = useState<BoardSurface>('chalk-green');
  const [grid, setGrid] = useState<BoardGrid>('lined');
  const [title, setTitle] = useState('');

  return (
    <section className="tb-card tb-custom-setup-card" data-testid="tb-custom-board-setup">
      <div className="tb-custom-setup__info">
        <h3>{isAr ? 'تجهيز سبورة فارغة حسب مادتك' : 'Quick Custom Blank Board'}</h3>
        <p>
          {isAr
            ? 'اختر لون السبورة وتسطير المادة لفتح حصة جديدة فوراً بدون أي ازدحام.'
            : 'Pick your preferred board surface and ruling to launch a clean board immediately.'}
        </p>
      </div>

      <div className="tb-custom-setup__controls">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isAr ? 'عنوان الحصة (اختياري)…' : 'Lesson title (optional)…'}
          className="tb-input"
        />

        <select
          value={surface}
          onChange={(e) => setSurface(e.target.value as BoardSurface)}
          aria-label={isAr ? 'نوع سطح السبورة' : 'Board surface'}
          className="tb-select"
        >
          {(Object.keys(surfaceLabels) as BoardSurface[]).map((s) => (
            <option key={s} value={s}>
              {surfaceLabels[s][lang]}
            </option>
          ))}
        </select>

        <select
          value={grid}
          onChange={(e) => setGrid(e.target.value as BoardGrid)}
          aria-label={isAr ? 'نوع التسطير' : 'Board grid'}
          className="tb-select"
        >
          {(Object.keys(gridLabels) as BoardGrid[]).map((g) => (
            <option key={g} value={g}>
              {gridLabels[g][lang]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            createNewLesson({
              title: title || (isAr ? 'حصة مخصصة' : 'Custom Class Board'),
              subject: 'math',
              grade: isAr ? 'عام' : 'General',
              surface,
              grid,
            })
          }
          className="tb-btn tb-btn--primary"
        >
          <Sparkles size={15} />
          <span>{isAr ? 'ابدأ الشرح الآن' : 'Launch Board'}</span>
        </button>
      </div>
    </section>
  );
};
