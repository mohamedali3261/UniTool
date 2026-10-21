import React, { useState, useMemo } from 'react';
import { TEMPLATE_CATALOG, TEMPLATE_CATEGORIES, DesignTemplate, TemplateCategory } from '../../../data/templatesCatalog';
import { Search, LayoutTemplate, X, Zap } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface TemplatesTabProps {
  onApplyTemplate: (template: DesignTemplate) => void;
}

/**
 * Tiny CSS mock preview built from the template definition itself:
 * every object is rendered as a scaled placeholder inside a mini stage.
 */
const TemplatePreview: React.FC<{ tpl: DesignTemplate }> = ({ tpl }) => {
  const stageW = 232; // logical px; card height follows the canvas ratio
  const ratio = tpl.baseH / tpl.baseW;
  const stageH = Math.max(96, Math.min(260, Math.round(stageW * ratio)));
  const k = stageW / tpl.baseW; // object scale factor for the mini stage

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-white/10 shadow-inner"
      style={{
        height: stageH,
        background: tpl.bg2
          ? `linear-gradient(135deg, ${tpl.bg} 0%, ${tpl.bg2} 100%)`
          : tpl.bg
      }}
    >
      {tpl.objects.map((o, i) => {
        const left = o.x * stageW;
        const top = o.y * stageH;

        if (o.type === 'circle') {
          const d = o.size ? o.size * stageW * 2 : 24;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left,
                top,
                width: d,
                height: d,
                transform: 'translate(-50%, -50%)',
                background: o.fill,
                opacity: o.opacity ?? 1
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
                left,
                top,
                width: (o.w ?? 0.3) * stageW,
                height: Math.max(2, (o.h ?? 0.05) * stageH),
                transform: 'translate(-50%, -50%)',
                background: o.fill,
                borderRadius: ((o.rx ?? 0) * stageW) / 2,
                opacity: o.opacity ?? 1
              }}
            />
          );
        }

        // text preview — scaled to stay readable at this size
        const fs = Math.max(7, Math.min(22, Math.round((o.size ?? 0.06) * stageW * 0.62)));
        const isMonoBg = (tpl.bg || '').toLowerCase() <= '#4a4a4a'; // rough: darker bg => light text ok
        return (
          <div
            key={i}
            className="absolute whitespace-pre text-center font-bold leading-tight"
            style={{
              left,
              top,
              transform: `translate(-50%, -50%)${o.rotation ? ` rotate(${o.rotation}deg)` : ''}`,
              fontFamily: o.fontFamily || 'Cairo, sans-serif',
              fontSize: fs,
              color: o.fill,
              width: Math.min(stageW * 0.92, (o.w ?? 0.8) * stageW),
              textShadow: isMonoBg ? 'none' : '0 1px 2px rgba(0,0,0,.35)'
            }}
          >
            {(o.text ?? '').replace(/\n/g, ' ')}
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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {TEMPLATE_CATEGORIES.map((cat) => (
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

      {/* Template cards */}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
          {filtered.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onApplyTemplate(tpl)}
              className="group text-start rounded-2xl bg-[#141E38]/90 hover:bg-[#192444] border border-slate-700/80 hover:border-sky-400/90 transition-all duration-200 p-2.5 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-0.5 active:scale-[0.98] w-full"
              title={lang === 'ar' ? tpl.descAr : tpl.descEn}
            >
              <TemplatePreview tpl={tpl} />

              <div className="flex items-start justify-between gap-2 mt-2 px-0.5">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition truncate">
                    {lang === 'ar' ? tpl.nameAr : tpl.nameEn}
                  </h4>
                  <p className="text-[9px] text-slate-500 font-mono truncate">
                    {tpl.baseW} × {tpl.baseH} · {tpl.objects.length} {t.tplObjects}
                  </p>
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 text-sky-300 text-[9px] font-bold border border-sky-500/30 shrink-0 opacity-80 group-hover:opacity-100 transition">
                  <Zap className="w-3 h-3" />
                  {t.tplApply}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-[9px] text-slate-600 leading-relaxed pt-1">
        {t.tplHint}
      </p>
    </div>
  );
};
