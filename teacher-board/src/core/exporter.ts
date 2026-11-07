import { jsPDF } from 'jspdf';
import {
  BOARD_LOGICAL_HEIGHT,
  BOARD_LOGICAL_WIDTH,
  renderSlideToContext,
} from './boardRenderer';
import type { BoardSlide, LessonDocument } from './types';

export function renderSlideDataUrl(slide: BoardSlide, scale = 1.5): string {
  const c = document.createElement('canvas');
  c.width = Math.round(BOARD_LOGICAL_WIDTH * scale);
  c.height = Math.round(BOARD_LOGICAL_HEIGHT * scale);
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  renderSlideToContext(ctx, BOARD_LOGICAL_WIDTH, BOARD_LOGICAL_HEIGHT, slide.surface, slide.grid, slide.elements);
  return c.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportSlidePng(slide: BoardSlide, lessonTitle: string, slideIndex: number): void {
  const url = renderSlideDataUrl(slide, 2);
  const safeName = (lessonTitle || 'lesson').replace(/[^\w\u0600-\u06FF-]+/g, '-');
  downloadDataUrl(url, `${safeName}-slide-${slideIndex + 1}.png`);
}

export function exportLessonPdf(lesson: LessonDocument): void {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [BOARD_LOGICAL_WIDTH, BOARD_LOGICAL_HEIGHT],
  });

  lesson.slides.forEach((slide, idx) => {
    if (idx > 0) {
      pdf.addPage([BOARD_LOGICAL_WIDTH, BOARD_LOGICAL_HEIGHT], 'landscape');
    }
    const png = renderSlideDataUrl(slide, 1.5);
    pdf.addImage(png, 'PNG', 0, 0, BOARD_LOGICAL_WIDTH, BOARD_LOGICAL_HEIGHT);
  });

  const safeName = (lesson.title || 'teacher-lesson').replace(/[^\w\u0600-\u06FF-]+/g, '-');
  pdf.save(`${safeName}.pdf`);
}

export function playClassroomChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch {
    /* audio optional */
  }
}
