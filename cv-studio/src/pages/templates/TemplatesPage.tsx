import { useMemo, useState } from 'react';
import { useCvStudio } from '../../app/context';
import type { TemplateCategory } from '../../core/types';
import { CV_TEMPLATES } from '../../data/templates';
import { CustomTemplateBuilder } from './CustomTemplateBuilder';
import { TemplateCard } from './TemplateCard';
import { TemplateFilterBar } from './TemplateFilterBar';
import './templates.css';

export function TemplatesPage() {
  const { t } = useCvStudio();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('all');
  const [customOpen, setCustomOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CV_TEMPLATES.filter((tpl) => {
      if (category !== 'all' && tpl.category !== category) return false;
      if (!q) return true;
      const hay = `${tpl.nameAr} ${tpl.nameEn} ${tpl.descAr} ${tpl.descEn} ${tpl.badgeAr} ${tpl.badgeEn}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  return (
    <div className="cvt-page" data-testid="cv-templates-page">
      <div className="cvt-page-header">
        <div>
          <h1>{t('مكتبة القوالب المهنية الواقعية', 'Professional Resume Templates')}</h1>
          <p>
            {t(
              'بدّل بين القوالب القياسية (ATS) والتنفيذية والأكاديمية في أي لحظة دون ضياع حرف واحد من بياناتك المكتوبة.',
              'Switch between 100% ATS, Executive, Tech, Finance, and Academic layouts anytime without losing your typed content.',
            )}
          </p>
        </div>
      </div>

      <TemplateFilterBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        onOpenCustomBuilder={() => setCustomOpen(true)}
      />

      <div className="cvt-grid">
        {filtered.map((tpl) => (
          <TemplateCard key={tpl.id} template={tpl} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="cvt-empty">
          <p>{t('لا توجد قوالب مطابقة لعبارة البحث — جرّب تصنيفاً آخر أو صمّم قالبك الخاص.', 'No templates matched your search — try another filter or build a custom template.')}</p>
        </div>
      )}

      <CustomTemplateBuilder open={customOpen} onClose={() => setCustomOpen(false)} />
    </div>
  );
}
