import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Eraser,
  Video,
  Square,
} from 'lucide-react';
import { useBoard } from '../../app/BoardContext';

export const SlidesStripSection: React.FC<{
  mainCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}> = ({ mainCanvasRef }) => {
  const {
    isAr,
    t,
    activeLesson,
    activeSlideIndex,
    setSlideIndex,
    addSlide,
    duplicateCurrentSlide,
    clearCurrentSlide,
    selectedId,
    deleteElementById,
    undo,
    redo,
    canUndo,
    canRedo,
    isRecording,
    toggleRecording,
  } = useBoard();

  const total = activeLesson.slides.length;

  return (
    <div className="tb-top-floating-bar" data-testid="tb-slides-strip">
      {/* Undo / Redo / Delete Selected / Clear Slide */}
      <div className="tb-pill-group">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title={t.undo}
          aria-label={t.undo}
          className="tb-icon-btn"
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title={t.redo}
          aria-label={t.redo}
          className="tb-icon-btn"
        >
          <Redo2 size={15} />
        </button>
        {selectedId && (
          <button
            type="button"
            onClick={() => deleteElementById(selectedId)}
            title={isAr ? 'حذف العنصر المحدد' : 'Delete selected'}
            className="tb-icon-btn tb-icon-btn--danger"
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          type="button"
          data-testid="tb-clear-slide"
          onClick={clearCurrentSlide}
          title={t.clearSlide}
          aria-label={t.clearSlide}
          className="tb-icon-btn"
        >
          <Eraser size={14} />
        </button>
      </div>

      {/* Multi-Slide Pager (< 1 / N > +) */}
      <div className="tb-pill-group">
        <button
          type="button"
          disabled={activeSlideIndex <= 0}
          onClick={() => setSlideIndex(Math.max(0, activeSlideIndex - 1))}
          aria-label={isAr ? 'الشريحة السابقة' : 'Previous slide'}
          className="tb-icon-btn"
        >
          {isAr ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
        <span className="tb-slide-counter" dir="ltr" data-testid="tb-slide-counter">
          {activeSlideIndex + 1} / {total}
        </span>
        <button
          type="button"
          disabled={activeSlideIndex >= total - 1}
          onClick={() => setSlideIndex(Math.min(total - 1, activeSlideIndex + 1))}
          aria-label={isAr ? 'الشريحة التالية' : 'Next slide'}
          className="tb-icon-btn"
        >
          {isAr ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
        <button
          type="button"
          data-testid="tb-add-slide"
          onClick={addSlide}
          title={t.newSlide}
          aria-label={t.newSlide}
          className="tb-icon-btn"
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={duplicateCurrentSlide}
          title={t.dupSlide}
          aria-label={t.dupSlide}
          className="tb-icon-btn tb-hide-sm"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* Quick Video + Audio Lesson Recorder */}
      <button
        type="button"
        onClick={() => toggleRecording(mainCanvasRef.current)}
        className={`tb-record-pill ${isRecording ? 'is-recording' : ''}`}
        title={isRecording ? t.recordStop : t.recordStart}
      >
        {isRecording ? <Square size={13} /> : <Video size={14} />}
        <span className="tb-hide-sm">{isRecording ? t.recordStop : t.recordStart}</span>
      </button>
    </div>
  );
};
