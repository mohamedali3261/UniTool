import React from 'react';
import { ArrowUpLeft } from 'lucide-react';
import { gridLabels, subjectLabels, surfaceLabels } from '../../core/i18n';
import { SURFACE_PALETTES } from '../../data/boardModes';
import type { SubjectTemplate } from '../../data/subjectTemplates';
import { useBoard } from '../../app/BoardContext';

export const TemplatePreviewCard: React.FC<{ template: SubjectTemplate }> = ({ template }) => {
  const { lang, isAr, applySubjectTemplate } = useBoard();
  const pal = SURFACE_PALETTES[template.surface];

  return (
    <article className="tb-card tb-template-card" data-testid={`tb-tpl-${template.id}`}>
      <div
        className="tb-template-card__preview"
        style={{
          background: pal.bg,
          color: pal.defaultInk,
          borderColor: pal.line,
        }}
      >
        <span className="tb-tpl-surface-tag">
          {surfaceLabels[template.surface][lang]} · {gridLabels[template.grid][lang]}
        </span>
        <div className="tb-tpl-mini-art">
          <strong>{isAr ? template.titleAr : template.titleEn}</strong>
        </div>
      </div>

      <div className="tb-template-card__body">
        <div className="tb-tpl-meta-row">
          <span className="tb-subject-badge">{subjectLabels[template.subject][lang]}</span>
          <small>{isAr ? template.gradeAr : template.gradeEn}</small>
        </div>

        <h3>{isAr ? template.titleAr : template.titleEn}</h3>
        <p>{isAr ? template.descAr : template.descEn}</p>

        <button
          type="button"
          onClick={() => applySubjectTemplate(template)}
          className="tb-btn tb-btn--primary w-full"
        >
          <span>{isAr ? 'فتح القالب على السبورة' : 'Open on Smartboard'}</span>
          <ArrowUpLeft size={14} />
        </button>
      </div>
    </article>
  );
};
