import React, { useState, useMemo } from 'react';
import {
  TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  GOOGLE_PLAY_CATEGORIES,
  DesignTemplate,
  TemplateCategory
} from '../../../data/templates';
import { Search, LayoutTemplate, X, Zap, Smartphone } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface TemplatesTabProps {
  onApplyTemplate: (template: DesignTemplate) => void;
}

const GP_CATEGORY_IDS = new Set<string>(GOOGLE_PLAY_CATEGORIES);
const MAIN_CATEGORIES = TEMPLATE_CATEGORIES.filter((c) => c.id === 'all' || !GP_CATEGORY_IDS.has(c.id));
const GP_CATEGORIES = TEMPLATE_CATEGORIES.filter((c) => GP_CATEGORY_IDS.has(c.id));

const gradientOf = (from: string, to?: string) =>
  to ? `linear-gradient(135deg, ${from} 0%, ${to} 100%)` : from;

/**
 * Faithful miniature of the template, built from its own object definitions.
 * The stage uses container queries (cqw) so every element keeps the exact
 * proportions of the real canvas at any card width.
 */
const TemplatePreview: React.FC<{ tpl: DesignTemplate }> = ({ tpl }) => {
  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border border-white/10 shadow-inner"
      style={{
        aspectRatio: `${tpl.baseW} / ${tpl.baseH}`,
        background: gradientOf(tpl.bg, tpl.bg2),
        containerType: 'inline-size'
      }}
    >
      {tpl.objects.map((o, i) => {
        const rotate = o.rotation ? ` rotate(${o.rotation}deg)` : '';
        const common: React.CSSProperties = {
          left: `${o.x * 100}%`,
          top: `${o.y * 100}%`,
          transform: `translate(-50%, -50%)${rotate}`,
          opacity: o.opacity ?? 1
        };

        if (o.type === 'circle') {
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                ...common,
                width: `${(o.size ?? 0.1) * 100}cqw`,
                height: `${(o.size ?? 0.1) * 100}cqw`,
                background: gradientOf(o.fill || '#0284C7', o.fill2),
                boxShadow: o.shadow
                  ? `${(o.shadow.offsetX ?? 0) * 100}cqw ${(o.shadow.offsetY ?? 0) * 100}cqw ${o.shadow.blur * 100}cqw ${o.shadow.color}`
                  : undefined
              }}
            />
          );
        }

        if (o.type === 'rect') {
          return (
            <div
              key={i}
              className="absolute"
              style={{
                ...common,
                width: `${(o.w ?? 0.3) * 100}%`,
                height: `${(o.h ?? 0.05) * 100}%`,
                background: gradientOf(o.fill || '#0284C7', o.fill2),
                borderRadius: `${(o.rx ?? 0) * 100}cqw`,
                boxShadow: o.shadow
                  ? `${(o.shadow.offsetX ?? 0) * 100}cqw ${(o.shadow.offsetY ?? 0) * 100}cqw ${o.shadow.blur * 100}cqw ${o.shadow.color}`
                  : undefined
              }}
            />
          );
        }

        const gradientText = !!o.fill2;
        const textShadow = o.shadow && !gradientText
          ? `${(o.shadow.offsetX ?? 0) * 100}cqw ${(o.shadow.offsetY ?? 0) * 100}cqw ${o.shadow.blur * 100}cqw ${o.shadow.color}`
          : undefined;

        return (
          <div
            key={i}
            className="absolute whitespace-pre-line text-center"
            style={{
              ...common,
              width: `${Math.min(94, (o.w ?? 0.9) * 100)}%`,
              fontFamily: o.fontFamily || 'Cairo, sans-serif',
              fontWeight: (o.fontWeight ?? 700) as React.CSSProperties['fontWeight'],
              fontSize: `max(3px, ${(o.size ?? 0.06) * 100}cqw)`,
              lineHeight: 1.3,
              color: gradientText ? 'transparent' : o.fill || '#FFFFFF',
              backgroundImage: gradientText ? gradientOf(o.fill || '#FFFFFF', o.fill2) : undefined,
              WebkitBackgroundClip: gradientText ? 'text' : undefined,
              backgroundClip: gradientText ? 'text' : undefined,
              textShadow
            }}
          >
            {o.text ?? ''}
          </div>
        );
      })}
    </div>
  );
};

export const TemplatesTab: React.FC<TemplatesTabProps> = ({ onApplyTemplate }) => {
  const { t, lang } = useDcLang();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return TEMPLATE_CATALOG.filter((tpl) => {
      if (category !== 'all' && tpl.cat !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      return (
        tpl.nameAr.toLowerCase().includes(q) ||
        tpl.nameEn.toLowerCase().includes(q) ||
        (tpl.descAr || '').toLowerCase().includes(q) ||
        (tpl.descEn || '').toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const groups = useMemo(
    () =>
      TEMPLATE_CATEGORIES.filter((c) => c.id !== 'all')
        .map((cat) => ({ cat, items: filtered.filter((tpl) => tpl.cat === cat.id) }))
        .filter((g) => g.items.length > 0),
    [filtered]
  );

  const catCount = (id: string) =>
    id === 'all' ? TEMPLATE_CATALOG.length : TEMPLATE_CATALOG.filter((x) => x.cat === id).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-sky-400" />
          <span>{t.tplTitle}</span>
        </h3>
        <p className="text-[10px] text-slate-400">{t.tplDesc}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.tplSearch}
          className="w-full bg-[#0B132B] border border-slate-700 rounded-xl ps-8 pe-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {MAIN_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id as TemplateCategory | 'all')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-medium whitespace-nowrap transition flex items-center gap-1 ${
              category === cat.id
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
            <span className={`text-[9px] px-1 py-0.5 rounded-full font-mono ${category === cat.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {catCount(cat.id)}
            </span>
          </button>
        ))}
      </div>

      {/* Official Google Play asset sizes */}
      <div className="rounded-xl border border-emerald-500/20 bg-[#0B132B]/70 p-1.5 space-y-1.5">
        <div className="flex items-center gap-1.5 px-1 text-[9px] font-bold uppercase tracking-wide text-emerald-300/90">
          <Smartphone className="w-3 h-3" />
          <span>{t.tplGpSizes}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {GP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id as TemplateCategory | 'all')}
              title={lang === 'ar' ? cat.nameAr : cat.nameEn}
              className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-[9px] font-medium transition border ${
                category === cat.id
                  ? 'bg-emerald-500 text-white font-bold border-emerald-400 shadow-sm'
                  : 'bg-[#0B132B] text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <span className="truncate">{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
              <span className={`shrink-0 text-[8px] px-1 py-0.5 rounded-full font-mono ${category === cat.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {catCount(cat.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Template cards grouped by section */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#141E38] border border-dashed border-slate-700/80 space-y-2">
          <LayoutTemplate className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">{t.tplNoResults}</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setCategory('all'); }}
            className="text-xs text-sky-400 hover:underline font-bold"
          >
            {t.resetFilters || 'RESET'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ cat, items }) => (
            <section key={cat.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <h4 className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${GP_CATEGORY_IDS.has(cat.id) ? 'bg-emerald-400' : 'bg-sky-400'}`} />
                  <span className="truncate">{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                </h4>
                <span className="text-[9px] text-slate-500 font-mono shrink-0">{items.length}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {items.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onApplyTemplate(tpl)}
                    className="group text-start rounded-xl bg-[#141E38]/90 hover:bg-[#192444] border border-slate-700/80 hover:border-sky-400/90 transition-all duration-200 p-1.5 shadow-sm hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-0.5 active:scale-[0.98] w-full"
                    title={lang === 'ar' ? tpl.descAr : tpl.descEn}
                  >
                    <div className="relative">
                      <TemplatePreview tpl={tpl} />
                      {tpl.isNew && (
                        <span className="absolute top-1 start-1 px-1 py-0.5 rounded-md bg-gradient-to-r from-fuchsia-500 to-sky-400 text-[7px] font-black tracking-wide text-white shadow-md">
                          {t.tplNew}
                        </span>
                      )}
                      <div className="absolute inset-0 rounded-lg bg-slate-950/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500 text-white text-[9px] font-bold shadow-lg">
                          <Zap className="w-2.5 h-2.5" />
                          {t.tplApply}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-[10px] leading-tight font-bold text-white group-hover:text-sky-300 transition truncate mt-1.5 px-0.5">
                      {lang === 'ar' ? tpl.nameAr : tpl.nameEn}
                    </h4>
                    <p className="text-[8px] text-slate-500 font-mono truncate px-0.5">
                      {tpl.baseW} × {tpl.baseH} · {tpl.objects.length} {t.tplObjects}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-[9px] text-slate-600 leading-relaxed pt-1">
        {t.tplHint}
      </p>
    </div>
  );
};
