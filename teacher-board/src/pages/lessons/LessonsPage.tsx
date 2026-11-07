import React from 'react';
import { useBoard } from '../../app/BoardContext';
import { ExportAndRecordSection } from './ExportAndRecordSection';
import { NewLessonBarSection } from './NewLessonBarSection';
import { SavedLessonsGridSection } from './SavedLessonsGridSection';

export const LessonsPage: React.FC = () => {
  const { isAr } = useBoard();

  return (
    <main className="tb-page-container" data-testid="tb-lessons-page">
      <header className="tb-page-hero">
        <div>
          <h1>{isAr ? 'مكتبة دروسي والتصدير للطلاب' : 'My Lessons & Student Export Hub'}</h1>
          <p>
            {isAr
              ? 'جميع حصصك وشروحك محفوظة تلقائياً داخل متصفحك مع إمكانية التصدير بصيغة PDF أو صور أو ملفات قابلة للمشاركة.'
              : 'All your lesson boards are saved automatically in your browser and ready to export as PDF, PNG, or lesson files.'}
          </p>
        </div>
      </header>

      <NewLessonBarSection />
      <ExportAndRecordSection />
      <SavedLessonsGridSection />
    </main>
  );
};
