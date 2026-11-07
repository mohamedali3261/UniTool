import React, { useEffect } from 'react';
import { BoardProvider, useBoard } from './BoardContext';
import { StudioHeader } from '../components/StudioHeader';
import { ToastBanner } from '../components/ToastBanner';
import { BoardPage } from '../pages/board/BoardPage';
import { TemplatesPage } from '../pages/templates/TemplatesPage';
import { ClassroomPage } from '../pages/classroom/ClassroomPage';
import { LessonsPage } from '../pages/lessons/LessonsPage';

const StudioWorkspace: React.FC = () => {
  const {
    lang,
    route,
    undo,
    redo,
    selectedId,
    deleteElementById,
    setOpenPopover,
    setOverlays,
  } = useBoard();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setOpenPopover(null);
        setOverlays((o) => ({ ...o, focusMode: false, spotlight: false }));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteElementById(selectedId);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteElementById, redo, selectedId, setOpenPopover, setOverlays, undo]);

  return (
    <div className="tb-app" dir={lang === 'ar' ? 'rtl' : 'ltr'} data-testid="tb-app">
      <StudioHeader />
      {route === 'board' && <BoardPage />}
      {route === 'templates' && <TemplatesPage />}
      {route === 'classroom' && <ClassroomPage />}
      {route === 'lessons' && <LessonsPage />}
      <ToastBanner />
    </div>
  );
};

export default function App() {
  return (
    <BoardProvider>
      <StudioWorkspace />
    </BoardProvider>
  );
}
