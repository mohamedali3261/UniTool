import React, { useMemo, useState } from 'react';
import { SUBJECT_TEMPLATES } from '../../data/subjectTemplates';
import { useBoard } from '../../app/BoardContext';
import type { SubjectCategory } from '../../core/types';
import { CustomBoardSetupSection } from './CustomBoardSetupSection';
import { SubjectFilterBar } from './SubjectFilterBar';
import { TemplatePreviewCard } from './TemplatePreviewCard';

export const TemplatesPage: React.FC = () => {
  const { isAr } = useBoard();
  const [category, setCategory] = useState<SubjectCategory>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUBJECT_TEMPLATES.filter((tpl) => {
      if (category !== 'all' && tpl.subject !== category) return false;
      if (!q) return true;
      return [tpl.titleAr, tpl.titleEn, tpl.descAr, tpl.descEn]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [category, query]);

  return (
    <main className="tb-page-container" data-testid="tb-templates-page">
      <header className="tb-page-hero">
        <div>
          <h1>{isAr ? 'قوالب الحصص والمواد الجاهزة' : 'Ready-to-Teach Subject Templates'}</h1>
          <p>
            {isAr
              ? 'اختر قالباً جاهزاً لمادتك الدراسية ليفتح مباشرة بعناصر قابلة للتعديل على السبورة.'
              : 'Pick a subject template to open directly on the Smartboard with editable teaching cards.'}
          </p>
        </div>
      </header>

      <CustomBoardSetupSection />

      <SubjectFilterBar
        selected={category}
        onSelect={setCategory}
        query={query}
        onQueryChange={setQuery}
      />

      <div className="tb-templates-grid">
        {filtered.map((tpl) => (
          <TemplatePreviewCard key={tpl.id} template={tpl} />
        ))}
      </div>
    </main>
  );
};
