import React, { useState, useMemo, useEffect } from 'react';
import {
  TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  GOOGLE_PLAY_CATEGORIES,
  DesignTemplate,
  TemplateCategory
} from '../../../data/templates';
import { Search, LayoutTemplate, X, Zap, Smartphone, Star, Box, Sparkles } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';
import type { CartonSize } from '../../../packaging/geometry';
import type { ArtworkOptions } from '../../../packaging/artwork';
import { BoxPreview } from '../../../packaging/BoxPreview';

interface TemplatesTabProps {
  onApplyTemplate: (template: DesignTemplate) => void;
  packagingSize?: CartonSize | null;
  onApplyCartonTheme?: (artwork: ArtworkOptions) => void;
}

const PACKAGING_BRAND_THEMES: Array<{
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  artwork: ArtworkOptions;
}> = [
  {
    id: 'emerald-atelier',
    titleAr: 'حديقة الزمرد الفاخرة',
    titleEn: 'Emerald Botanical Atelier',
    descAr: 'تغليف عطور وعناية طبيعية بهوية زمردية وذهبية',
    descEn: 'Botanical emerald & warm gold perfume styling',
    artwork: {
      style: 'emerald',
      brand: 'BOTANICA',
      product: 'VERDANT ELIXIR',
      accent: '#c9d5ab',
      ml: 50,
    },
  },
  {
    id: 'noir-gold',
    titleAr: 'نوار ملكي ذهبي',
    titleEn: 'Royal Noir & Gold',
    descAr: 'إصدار ليلي فاخر بتفاصيل ذهبية كلاسيكية',
    descEn: 'Luxury dark edition with classic gold foil accents',
    artwork: {
      style: 'noir',
      brand: 'MAISON NOIR',
      product: 'NOCTURNE OUD',
      accent: '#d6b77b',
      ml: 100,
    },
  },
  {
    id: 'velvet-rose',
    titleAr: 'وردة مخملية ناعمة',
    titleEn: 'Velvet Rose Beauty',
    descAr: 'مثالي لمستحضرات التجميل والسيروم والعطور الزهرية',
    descEn: 'Tailored for cosmetics, serums & floral scents',
    artwork: {
      style: 'rose',
      brand: 'ATELIER ROSE',
      product: 'VELVET BLOOM',
      accent: '#883e54',
      ml: 30,
    },
  },
  {
    id: 'artisan-kraft',
    titleAr: 'كرافت حرفي طبيعي',
    titleEn: 'Artisan Kraft Stock',
    descAr: 'خامة كرافت دافئة للشموع والقهوة والمنتجات اليدوية',
    descEn: 'Warm kraft board for candles, specialty goods & food',
    artwork: {
      style: 'emerald',
      brand: 'TERRA CRAFT',
      product: 'HAND POURED',
      descriptor: 'SMALL BATCH',
      quantity: '100% NATURAL',
      accent: '#24795e',
      stock: 'kraft',
      ml: 50,
    },
  },
  {
    id: 'specialty-roast',
    titleAr: 'محمصة قهوة مختصة',
    titleEn: 'Specialty Coffee Box',
    descAr: 'هوية جريئة لعلب القهوة والشاي والشوكولاتة',
    descEn: 'Bold identity for coffee, cacao & gourmet boxes',
    artwork: {
      style: 'noir',
      brand: 'ROASTERY CO.',
      product: 'SINGLE ORIGIN',
      descriptor: 'ARABICA BEANS',
      quantity: 'NET WT 250G',
      accent: '#d99b52',
      ml: 100,
    },
  },
  {
    id: 'patisserie-rose',
    titleAr: 'باتيسري وحلويات فاخرة',
    titleEn: 'Fine Patisserie Box',
    descAr: 'تصميم أنيق لعلب الحلويات والهدايا والمخبوزات',
    descEn: 'Refined layout for bakery, sweets & gift boxes',
    artwork: {
      style: 'rose',
      brand: 'LA PATISSERIE',
      product: 'ARTISAN SWEETS',
      descriptor: 'FRESHLY BAKED',
      quantity: 'GIFT EDITION',
      accent: '#9f3a56',
      ml: 50,
    },
  },
];

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
      data-theme-art
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

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  onApplyTemplate,
  packagingSize,
  onApplyCartonTheme,
}) => {
  const { t, lang } = useDcLang();
  const isAr = lang === 'ar';
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { const ids = JSON.parse(localStorage.getItem('designcraft-template-favorites') || '[]'); return Array.isArray(ids) ? ids.filter((id: unknown) => typeof id === 'string' && TEMPLATE_CATALOG.some(t => t.id === id)) : []; } catch { return []; }
  });
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [orientation, setOrientation] = useState('all');
  const [storageFailed, setStorageFailed] = useState(false);
  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ ids: string[]; failed: boolean }>).detail;
      if (detail) { setFavorites(detail.ids); setStorageFailed(detail.failed); }
    };
    window.addEventListener('designcraft:template-favorites', sync);
    return () => window.removeEventListener('designcraft:template-favorites', sync);
  }, []);
  const toggleFavorite = (id: string) => {
    const ids = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    let failed = false;
    try { localStorage.setItem('designcraft-template-favorites', JSON.stringify(ids)); } catch { failed = true; }
    setFavorites(ids); setStorageFailed(failed);
    window.dispatchEvent(new CustomEvent('designcraft:template-favorites', { detail: { ids, failed } }));
  };
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return TEMPLATE_CATALOG.filter((tpl) => {
      if (favoriteOnly && !favorites.includes(tpl.id)) return false;
      if (orientation === 'landscape' && tpl.baseW <= tpl.baseH) return false;
      if (orientation === 'portrait' && tpl.baseW >= tpl.baseH) return false;
      if (orientation === 'square' && tpl.baseW !== tpl.baseH) return false;
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
  }, [query, category, favoriteOnly, favorites, orientation]);

  const groups = useMemo(
    () =>
      TEMPLATE_CATEGORIES.filter((c) => c.id !== 'all')
        .map((cat) => ({ cat, items: filtered.filter((tpl) => tpl.cat === cat.id) }))
        .filter((g) => g.items.length > 0),
    [filtered]
  );

  const catCount = (id: string) =>
    id === 'all' ? TEMPLATE_CATALOG.length : TEMPLATE_CATALOG.filter((x) => x.cat === id).length;

  if (packagingSize && onApplyCartonTheme) {
    const q = query.trim().toLowerCase();
    const visibleThemes = PACKAGING_BRAND_THEMES.filter(
      (th) =>
        !q ||
        th.titleAr.toLowerCase().includes(q) ||
        th.titleEn.toLowerCase().includes(q) ||
        th.descAr.toLowerCase().includes(q) ||
        th.descEn.toLowerCase().includes(q)
    );
    return (
      <div className="dc-carton-themes-panel" data-testid="packaging-templates-panel" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="dc-carton-tab-hero">
          <div className="dc-carton-tab-hero__badge">
            <Box className="w-4 h-4" />
            <span>{isAr ? 'قوالب وهويات العلب الجاهزة' : 'Carton Brand Themes'}</span>
          </div>
          <p className="dc-carton-tab-hero__desc">
            {isAr
              ? 'قوالب مصممة خصيصًا لتوزيع الألوان والشعارات على أوجه العلبة مع الحفاظ التام على خطوط القص والطي ومقاساتك الحالية.'
              : 'Multi-face packaging themes fitted automatically to your exact carton dimensions while preserving cut & fold dielines.'}
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAr ? 'ابحث في قوالب العلب...' : 'Search carton themes...'}
            className="dc-carton-theme-search"
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

        <div className="dc-carton-themes-grid">
          {visibleThemes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              data-testid={`carton-theme-${theme.id}`}
              className="dc-carton-theme-card"
              onClick={() => onApplyCartonTheme(theme.artwork)}
            >
              <div className="dc-carton-theme-card__preview" data-theme-art>
                <BoxPreview size={packagingSize} artwork={theme.artwork} />
              </div>
              <div className="dc-carton-theme-card__meta">
                <strong>{isAr ? theme.titleAr : theme.titleEn}</strong>
                <small>{isAr ? theme.descAr : theme.descEn}</small>
                <span className="dc-carton-theme-card__cta">
                  <Sparkles className="w-3 h-3" />
                  {isAr ? 'تطبيق الهوية على العلبة' : 'Apply to carton'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

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

      <div className="flex items-center gap-2">
        <button type="button" aria-pressed={favoriteOnly} onClick={() => setFavoriteOnly(!favoriteOnly)} className={`flex items-center gap-1 rounded-lg border p-2 text-xs ${favoriteOnly ? 'bg-amber-500 text-slate-950' : 'border-slate-700 text-slate-300'}`}><Star className="h-3 w-3" />{lang === 'ar' ? 'المفضلة' : 'Favorites'}</button>
        <select aria-label={lang === 'ar' ? 'اتجاه القالب' : 'Template orientation'} value={orientation} onChange={e => setOrientation(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-white">
          <option value="all">{lang === 'ar' ? 'كل الأشكال' : 'All orientations'}</option>
          <option value="landscape">{lang === 'ar' ? 'أفقي' : 'Landscape'}</option>
          <option value="portrait">{lang === 'ar' ? 'رأسي' : 'Portrait'}</option>
          <option value="square">{lang === 'ar' ? 'مربع' : 'Square'}</option>
        </select>
      </div>
      {storageFailed && <p role="status" className="text-xs text-amber-300">{lang === 'ar' ? 'المفضلة متاحة مؤقتًا؛ تعذر حفظها في المتصفح.' : 'Favorites are temporary; browser storage is unavailable.'}</p>}
      <p className="rounded-lg border border-sky-800 bg-sky-950/30 p-2 text-[10px] leading-relaxed text-sky-200">{lang === 'ar' ? 'قوالب الطباعة بمقاسات مقترحة عند 300 DPI. اختر المقاس نفسه في المطبعة وراجع النصوص. لا تشمل نزيفًا أو مسارات قص تلقائية. أمام وخلف الكارت قالبان منفصلان.' : 'Print templates use suggested sizes at 300 DPI. Set matching dimensions at your printer and review text. No automatic bleed or die-cut paths. Card fronts and backs are separate templates.'}</p>
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
            onClick={() => { setQuery(''); setCategory('all'); setOrientation('all'); setFavoriteOnly(false); }}
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
                  <div key={tpl.id} className="relative" data-template-id={tpl.id}>
                  <button
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
                    {tpl.print && <p className="mt-1 text-[9px] font-semibold text-emerald-300">{tpl.print.widthMm} × {tpl.print.heightMm} mm · 300 DPI</p>}
                    <p className="text-[8px] text-slate-500 font-mono truncate px-0.5">
                      {tpl.baseW} × {tpl.baseH} · {tpl.objects.length} {t.tplObjects}
                    </p>
                  </button>
                  <button type="button" aria-label={`${lang === 'ar' ? 'تفضيل' : 'Favorite'} ${lang === 'ar' ? tpl.nameAr : tpl.nameEn}`} aria-pressed={favorites.includes(tpl.id)} onClick={() => toggleFavorite(tpl.id)} className="absolute end-2 top-2 z-10 rounded-lg bg-slate-950/90 p-1.5 text-amber-300 hover:bg-slate-800"><Star className="h-3.5 w-3.5" fill={favorites.includes(tpl.id) ? 'currentColor' : 'none'} /></button>
                  </div>
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
