import React, { useRef, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { subjectLabels, surfaceLabels } from '../../core/i18n';
import { useBoard } from '../../app/BoardContext';
import type { BoardSurface, SubjectCategory } from '../../core/types';

export const NewLessonBarSection: React.FC = () => {
  const { lang, isAr, createNewLesson, importLessonJson } = useBoard();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Exclude<SubjectCategory, 'all'>>('math');
  const [grade, setGrade] = useState('');
  const [surface, setSurface] = useState<BoardSurface>('white');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createNewLesson({
      title: title || (isAr ? 'حصة دراسية جديدة' : 'New Class Lesson'),
      subject,
      grade: grade || (isAr ? 'عام' : 'General'),
      surface,
    });
    setTitle('');
    setGrade('');
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importLessonJson(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="tb-card tb-new-lesson-card" data-testid="tb-new-lesson-section">
      <h3>{isAr ? 'إنشاء حصة أو درس جديد' : 'Create New Lesson Board'}</h3>
      <form onSubmit={handleCreate} className="tb-new-lesson-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isAr ? 'عنوان الدرس (مثال: المعادلات التربيعية)…' : 'Lesson title…'}
          className="tb-input"
        />

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as Exclude<SubjectCategory, 'all'>)}
          className="tb-select"
          aria-label={isAr ? 'المادة الدراسية' : 'Subject'}
        >
          {(['math', 'science', 'arabic', 'english', 'social', 'planning'] as const).map((s) => (
            <option key={s} value={s}>
              {subjectLabels[s][lang]}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder={isAr ? 'الصف الدراسي…' : 'Grade / Class…'}
          className="tb-input"
        />

        <select
          value={surface}
          onChange={(e) => setSurface(e.target.value as BoardSurface)}
          className="tb-select"
          aria-label={isAr ? 'لون السبورة' : 'Board surface'}
        >
          {(Object.keys(surfaceLabels) as BoardSurface[]).map((s) => (
            <option key={s} value={s}>
              {surfaceLabels[s][lang]}
            </option>
          ))}
        </select>

        <button type="submit" className="tb-btn tb-btn--primary">
          <Plus size={15} />
          <span>{isAr ? 'إنشاء الدرس' : 'Create Lesson'}</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="tb-btn tb-btn--ghost"
        >
          <Upload size={14} />
          <span>{isAr ? 'استيراد ملف درس' : 'Import File'}</span>
        </button>
        <input
          ref={fileInputRef}
          id="tb-import-lesson-input"
          type="file"
          accept=".json,application/json"
          hidden
          onChange={onFileSelected}
        />
      </form>
    </section>
  );
};
