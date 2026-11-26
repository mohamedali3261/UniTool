/**
 * القسم ٢ — رف الحروف.
 * تبويبات النص (عربي/لاتيني/رموز)، بحث بالاسم أو الكود، مرشّحات، عدّاد
 * الإنجاز وشبكة الحروف مع معاينة مصغّرة مرسومة من نفس المنحنيات.
 */
import { useMemo, useState } from 'react';
import { Search, Filter, Sparkles, ArrowUpDown, Star } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { displayName, filterGlyphs, GLYPH_GROUPS, type ScriptTab } from '../../core/naming';
import { scriptCoverage, type GlyphEntry } from '../../core/glyphIndex';
import { contoursToPathData } from '../../core/outline';
import { Segmented } from '../../ui/controls';
import { glyphState } from '../../core/project';

const TABS: Array<{ value: ScriptTab; ar: string; en: string }> = [
  { value: 'arabic', ar: 'عربي', en: 'Arabic' },
  { value: 'latin', ar: 'لاتيني', en: 'Latin' },
  { value: 'other', ar: 'رموز وأرقام', en: 'Symbols' },
];

type SortMode = 'unicode' | 'name' | 'points';

export function GlyphRail() {
  const { state, dispatch, index, ar, font } = useFontLab();
  const [tab, setTab] = useState<ScriptTab>('arabic');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [sort, setSort] = useState<SortMode>('unicode');
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('unitool.fontlab.favourites') || '[]');
    } catch {
      return [];
    }
  });

  const coverage = useMemo(() => scriptCoverage(index), [index]);
  const edited = useMemo(() => new Set(state.edited), [state.edited]);
  const counts = useMemo(
    () => ({
      arabic: index.filter((entry) => entry.script === 'arabic').length,
      latin: index.filter((entry) => entry.script === 'latin').length,
      other: index.filter((entry) => entry.script === 'other').length,
    }),
    [index],
  );

  const entries = useMemo(() => {
    let list = filterGlyphs(index, tab, group, query, edited);
    if (favourites.length && group === 'pinned') list = index.filter((entry) => favourites.includes(entry.name) && entry.script === tab);
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'points') list = [...list].sort((a, b) => b.points - a.points);
    return list;
  }, [index, tab, group, query, edited, favourites, sort]);

  const total = counts[tab] || 1;
  const drawn = entries.filter((entry) => entry.points > 0).length;

  const toggleFavourite = (name: string) => {
    setFavourites((current) => {
      const next = current.includes(name) ? current.filter((entry) => entry !== name) : [...current, name];
      try {
        localStorage.setItem('unitool.fontlab.favourites', JSON.stringify(next));
      } catch {
        /* ignore quota errors */
      }
      return next;
    });
  };

  return (
    <aside className="fl-rail" aria-label={ar ? 'رف الحروف' : 'Glyph rail'}>
      <div className="fl-rail-tabs">
        <Segmented<ScriptTab>
          ariaLabel={ar ? 'نص الحروف' : 'Glyph script'}
          value={tab}
          onChange={(value) => setTab(value)}
          options={TABS.map((entry) => ({
            value: entry.value,
            label: ar ? entry.ar : entry.en,
            count: counts[entry.value],
          }))}
        />
      </div>

      <div className="fl-search">
        <Search size={14} />
        <input
          type="search"
          value={query}
          placeholder={ar ? 'ابحث باسم الحرف، الشكل أو U+0628' : 'Search by letter, name or U+0628'}
          aria-label={ar ? 'بحث الحروف' : 'Search glyphs'}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button type="button" onClick={() => setQuery('')} aria-label={ar ? 'مسح البحث' : 'Clear search'}>
            ×
          </button>
        ) : null}
      </div>

      <div className="fl-filters" role="group" aria-label={ar ? 'مرشحات' : 'Filters'}>
        <Filter size={13} />
        <select value={group} onChange={(event) => setGroup(event.target.value)} aria-label={ar ? 'نوع الحروف' : 'Glyph filter'}>
          {GLYPH_GROUPS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {ar ? entry.ar : entry.en}
            </option>
          ))}
          <option value="pinned">{ar ? 'مفضلة' : 'Starred'}</option>
        </select>
        <button type="button" title={ar ? 'ترتيب' : 'Sort'} aria-label={ar ? 'ترتيب الحروف' : 'Sort glyphs'} onClick={() => setSort(sort === 'unicode' ? 'points' : sort === 'points' ? 'name' : 'unicode')}>
          <ArrowUpDown size={13} />
          <small>{sort === 'unicode' ? 'U+' : sort === 'points' ? '#' : 'A'}</small>
        </button>
      </div>

      <div className="fl-rail-progress">
        <div className="fl-progress-text">
          <span>
            {ar ? 'مرسوم' : 'Drawn'} <b>{drawn}</b> {ar ? 'من' : 'of'} <b>{entries.length}</b>
          </span>
          <em>{Math.round((drawn / total) * 100)}%</em>
        </div>
        <div className="fl-progress" role="progressbar" aria-valuenow={drawn} aria-valuemax={Math.max(1, entries.length)}>
          <i style={{ width: `${Math.min(100, (drawn / Math.max(1, entries.length)) * 100)}%` }} />
        </div>
        <div className="fl-coverage">
          <span>
            <i style={{ background: '#43b48b' }} /> {ar ? 'عربي' : 'Arabic'} {coverage.arabicPct}%
          </span>
          <span>
            <i style={{ background: '#5b9bd5' }} /> {ar ? 'لاتيني' : 'Latin'} {coverage.latinPct}%
          </span>
          <span>
            <i style={{ background: '#c9a227' }} /> {ar ? 'أخرى' : 'Other'} {coverage.otherPct}%
          </span>
        </div>
      </div>

      <div className="fl-glyph-grid" role="listbox" aria-label={ar ? 'شبكة الحروف' : 'Glyph grid'}>
        {entries.map((entry) => (
          <GlyphCell
            key={entry.name}
            entry={entry}
            ar={ar}
            selected={state.selection.glyph === entry.name}
            edited={edited.has(entry.name)}
            starred={favourites.includes(entry.name)}
            onStar={() => toggleFavourite(entry.name)}
            onClick={() => dispatch({ type: 'select', glyph: entry.name })}
            contours={font ? glyphState(state.doc, font.glyphs.get(entry.name)!).contours : []}
            upm={state.doc.metrics.unitsPerEm}
          />
        ))}
        {entries.length === 0 ? (
          <p className="fl-glyph-empty">
            <Sparkles size={16} />
            {ar ? 'لا حروف مطابقة — جرّب بحثاً آخر.' : 'No matching glyphs — try another search.'}
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function GlyphCell({
  entry,
  ar,
  selected,
  edited,
  starred,
  onStar,
  onClick,
  contours,
  upm,
}: {
  entry: GlyphEntry;
  ar: boolean;
  selected: boolean;
  edited: boolean;
  starred: boolean;
  onStar: () => void;
  onClick: () => void;
  contours: import('../../core/fontEngine').GlyphContour[];
  upm: number;
}) {
  const path = useMemo(() => contoursToPathData(contours, upm), [contours, upm]);
  return (
    <div role="option" aria-selected={selected} className={`fl-glyph${selected ? ' is-selected' : ''}${edited ? ' is-edited' : ''}`}>
      <button type="button" className="fl-glyph-main" onClick={onClick} title={`${displayName(entry, ar ? 'ar' : 'en')} — ${entry.unicodeHex}`}>
        <svg viewBox={`0 0 ${upm} ${upm}`} aria-hidden="true">
          {path ? <path d={path} /> : <text x={upm / 2} y={upm * 0.72} textAnchor="middle" fontSize={upm * 0.5}>{entry.label}</text>}
        </svg>
        <small>{entry.label}</small>
      </button>
      <button type="button" className={`fl-glyph-star${starred ? ' is-on' : ''}`} onClick={onStar} aria-label={ar ? 'إضافة للمفضلة' : 'Star glyph'} aria-pressed={starred}>
        <Star size={11} />
      </button>
      {Object.keys(entry.forms).length > 0 ? <i className="fl-glyph-badge" title={ar ? 'له أشكال متصلة' : 'Has positional forms'} /> : null}
    </div>
  );
}
