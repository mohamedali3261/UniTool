import React from 'react';
import { Download, FileDown, FileJson, HardDrive } from 'lucide-react';
import { useBoard } from '../../app/BoardContext';

export const ExportAndRecordSection: React.FC = () => {
  const { isAr, activeLesson, exportCurrentPng, exportCurrentPdf, exportLessonJson } = useBoard();

  return (
    <section className="tb-card tb-export-hub" data-testid="tb-export-section">
      <div>
        <h3>
          {isAr
            ? `تصدير ومشاركة الدرس الحالي: «${activeLesson.title}»`
            : `Export & Share Active Lesson: “${activeLesson.title}”`}
        </h3>
        <p>
          {isAr
            ? 'احفظ الشريحة الحالية كصورة عالية الدقة أو صدّر جميع شرائح الحصة في ملف PDF جاهز للطلاب.'
            : 'Download a crisp PNG of the current slide or export all lesson slides into a student-ready PDF.'}
        </p>
      </div>

      <div className="tb-export-buttons">
        <button type="button" onClick={exportCurrentPng} className="tb-btn tb-btn--ghost">
          <Download size={15} />
          <span>{isAr ? 'صورة الشريحة PNG' : 'Current Slide PNG'}</span>
        </button>

        <button type="button" onClick={exportCurrentPdf} className="tb-btn tb-btn--primary">
          <FileDown size={15} />
          <span>
            {isAr
              ? `تصدير كل الشرائح PDF (${activeLesson.slides.length})`
              : `Export Full PDF (${activeLesson.slides.length})`}
          </span>
        </button>

        <button type="button" onClick={exportLessonJson} className="tb-btn tb-btn--ghost">
          <FileJson size={15} />
          <span>{isAr ? 'ملف الدرس القابل للتعديل' : 'Editable .utboard.json'}</span>
        </button>

        <a href="/storage.html" className="tb-btn tb-btn--ghost">
          <HardDrive size={15} />
          <span>{isAr ? 'النسخ الاحتياطي العام' : 'Site Storage Backup'}</span>
        </a>
      </div>
    </section>
  );
};
