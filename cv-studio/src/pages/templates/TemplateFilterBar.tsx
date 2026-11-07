import { Search, Sparkles } from 'lucide-react';
import { useCvStudio } from '../../app/context';
import type { TemplateCategory } from '../../core/types';

export function TemplateFilterBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  onOpenCustomBuilder,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  category: TemplateCategory;
  onCategoryChange: (c: TemplateCategory) => void;
  onOpenCustomBuilder: () => void;
}) {
  const { t } = useCvStudio();

  const categories: { id: TemplateCategory; ar: string; en: string }[] = [
    { id: 'all', ar: 'جميع القوالب', en: 'All Templates' },
    { id: 'ats', ar: 'قياسي ATS 100%', en: '100% ATS' },
    { id: 'executive', ar: 'تنفيذي وإدارة', en: 'Executive' },
    { id: 'tech', ar: 'هندسة وتقنية', en: 'Tech & Engineering' },
    { id: 'finance', ar: 'مالية ومحاسبة', en: 'Finance' },
    { id: 'creative', ar: 'تصميم وتسويق', en: 'Product & Creative' },
    { id: 'academic', ar: 'أكاديمي وبحثي', en: 'Academic' },
    { id: 'fresh-grad', ar: 'خريج جديد', en: 'Fresh Graduate' },
  ];

  return (
    <div className="cvt-filter-bar">
      <div className="cvt-filter-top">
        <div className="cvt-search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder={t('ابحث حسب التخصص أو المسمى الوظيفي…', 'Search by specialty, role, or layout…')}
            aria-label={t('البحث في القوالب', 'Search templates')}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="cv-btn primary"
          onClick={onOpenCustomBuilder}
          data-testid="open-custom-template-btn"
        >
          <Sparkles size={15} />
          <span>{t('تصميم قالب مخصص من الصفر', 'Build Custom Template')}</span>
        </button>
      </div>

      <div className="cvt-cat-pills" role="tablist" aria-label={t('تصنيفات القوالب', 'Template categories')}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={category === cat.id}
            className={`cv-chip ${category === cat.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {t(cat.ar, cat.en)}
          </button>
        ))}
      </div>
    </div>
  );
}
