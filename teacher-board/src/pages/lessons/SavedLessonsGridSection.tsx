import React from 'react';
import { Copy, Trash2, ArrowUpLeft, Layers } from 'lucide-react';
import { subjectLabels } from '../../core/i18n';
import { useBoard } from '../../app/BoardContext';

export const SavedLessonsGridSection: React.FC = () => {
  const { lang, isAr, lessons, activeLesson, selectLesson, duplicateLesson, deleteLesson } =
    useBoard();

  return (
    <section data-testid="tb-saved-lessons-section">
      <h2 className="tb-section-heading">
        {isAr ? `الدروس المحفوظة محلياً (${lessons.length})` : `Saved Lessons (${lessons.length})`}
      </h2>

      <div className="tb-lessons-grid">
        {lessons.map((doc) => {
          const isCurrent = doc.id === activeLesson.id;
          return (
            <article
              key={doc.id}
              className={`tb-card tb-lesson-card ${isCurrent ? 'is-current' : ''}`}
            >
              <div className="tb-tpl-meta-row">
                <span className="tb-subject-badge">{subjectLabels[doc.subject][lang]}</span>
                {isCurrent && (
                  <span className="tb-active-tag">{isAr ? 'مفتوح الآن' : 'Active'}</span>
                )}
              </div>

              <h3>{doc.title}</h3>
              <p className="tb-lesson-sub">
                <span>{doc.grade}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Layers size={12} />
                  {doc.slides.length} {isAr ? 'شرائح' : 'slides'}
                </span>
              </p>

              <div className="tb-lesson-actions">
                <button
                  type="button"
                  onClick={() => selectLesson(doc.id)}
                  className="tb-btn tb-btn--primary"
                >
                  <span>{isAr ? 'فتح السبورة' : 'Open Board'}</span>
                  <ArrowUpLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateLesson(doc.id)}
                  className="tb-btn tb-btn--ghost"
                  title={isAr ? 'تكرار الدرس' : 'Duplicate'}
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteLesson(doc.id)}
                  className="tb-btn tb-btn--ghost"
                  title={isAr ? 'حذف الدرس' : 'Delete'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
