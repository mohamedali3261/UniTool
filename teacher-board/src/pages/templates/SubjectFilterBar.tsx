import React from 'react';
import { Search } from 'lucide-react';
import { subjectLabels } from '../../core/i18n';
import { useBoard } from '../../app/BoardContext';
import type { SubjectCategory } from '../../core/types';

const CATEGORIES: SubjectCategory[] = [
  'all',
  'math',
  'science',
  'arabic',
  'english',
  'social',
  'planning',
];

export const SubjectFilterBar: React.FC<{
  selected: SubjectCategory;
  onSelect: (cat: SubjectCategory) => void;
  query: string;
  onQueryChange: (q: string) => void;
}> = ({ selected, onSelect, query, onQueryChange }) => {
  const { lang, isAr } = useBoard();

  return (
    <div className="tb-filter-bar" data-testid="tb-subject-filter-bar">
      <div className="tb-search-box">
        <Search size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={isAr ? 'ابحث عن قالب مادة أو درس…' : 'Search subject templates…'}
          aria-label={isAr ? 'بحث القوالب' : 'Search templates'}
        />
      </div>

      <div className="tb-chip-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            data-testid={`tb-cat-${cat}`}
            onClick={() => onSelect(cat)}
            className={`tb-pill-chip ${selected === cat ? 'is-active' : ''}`}
          >
            {subjectLabels[cat][lang]}
          </button>
        ))}
      </div>
    </div>
  );
};
