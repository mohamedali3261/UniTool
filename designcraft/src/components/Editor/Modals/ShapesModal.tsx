import React, { useEffect, useState } from 'react';
import { SHAPES_CATALOG, SHAPE_CATEGORIES, ShapeItem } from '../../../data/shapesCatalog';
import {
  PATTERNS_CATALOG,
  PATTERN_CATEGORIES,
  BackgroundPatternItem,
} from '../../../data/patternsCatalog';
import { Search, Shapes, X, Palette, Check, Grid } from 'lucide-react';
import { getEnglishKeywordsForSearch } from '../../../utils/searchTranslator';
import { useDcLang } from '../../../hooks/useDcLang';

const MODAL_COLORS = [
  '#24795E',
  '#0284C7',
  '#2563EB',
  '#7C3AED',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#1E293B',
  '#FFFFFF',
];

interface ShapesModalProps {
  isOpen: boolean;
  initialTab?: 'shapes' | 'patterns';
  onClose: () => void;
  onSelectShape: (shape: ShapeItem, fill: string) => void;
  onSelectPattern?: (pattern: BackgroundPatternItem) => void;
}

export const ShapesModal: React.FC<ShapesModalProps> = ({
  isOpen,
  initialTab = 'shapes',
  onClose,
  onSelectShape,
  onSelectPattern,
}) => {
  const { t, lang } = useDcLang();
  const isAr = lang === 'ar';
  const [mode, setMode] = useState<'shapes' | 'patterns'>(initialTab);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [patternCategory, setPatternCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('#24795E');
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialTab);
      setSearch('');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const searchKeywords = getEnglishKeywordsForSearch(search);

  const filteredShapes = SHAPES_CATALOG.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    if (!search.trim()) return matchesCat;
    const nameLower = item.name.toLowerCase();
    const nameArLower = item.nameAr.toLowerCase();
    const matchesSearch = searchKeywords.some(
      (kw) => nameLower.includes(kw) || nameArLower.includes(kw),
    );
    return matchesSearch && matchesCat;
  });

  const q = search.trim().toLowerCase();
  const filteredPatterns = PATTERNS_CATALOG.filter((item) => {
    const matchesCat = patternCategory === 'all' || item.category === patternCategory;
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      item.nameAr.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.descriptionAr.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.shTitle}
        dir={isAr ? 'rtl' : 'ltr'}
        data-testid="shapes-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C2541] border border-slate-700/80 rounded-2xl w-full max-w-[560px] h-[min(76dvh,470px)] flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Compact Modal Header */}
        <div className="px-3.5 py-2.5 bg-[#0B132B] border-b border-slate-700/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              {mode === 'shapes' ? <Shapes className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">
              {mode === 'shapes' ? t.shTitle : t.elemPatternsTitle}
            </h2>
          </div>

          {/* Mode Switcher: Shapes vs Patterned Backgrounds */}
          <div className="flex items-center gap-1 bg-[#1C2541] p-0.5 rounded-xl border border-slate-700/70 shrink-0">
            <button
              type="button"
              aria-pressed={mode === 'shapes'}
              onClick={() => {
                setMode('shapes');
                setSearch('');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                mode === 'shapes'
                  ? '!bg-[#24795E] !text-white shadow-2xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>{t.shTabShapes}</span>
              <span className="text-[9px] font-mono opacity-85">{SHAPES_CATALOG.length}</span>
            </button>
            <button
              type="button"
              aria-pressed={mode === 'patterns'}
              onClick={() => {
                setMode('patterns');
                setSearch('');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                mode === 'patterns'
                  ? '!bg-[#24795E] !text-white shadow-2xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>{t.shTabPatterns}</span>
              <span className="text-[9px] font-mono opacity-85">{PATTERNS_CATALOG.length}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            title={t.close}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Search, Color & Category Controls */}
        <div className="px-3.5 py-2.5 bg-[#0B132B]/70 border-b border-slate-800 space-y-2 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search
                className={`w-3.5 h-3.5 text-slate-400 absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 pointer-events-none`}
              />
              <input
                type="text"
                placeholder={mode === 'shapes' ? t.shSearchPlaceholder : t.shPatternsSearchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full bg-[#0B132B] border border-slate-700/80 rounded-xl ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500`}
              />
            </div>

            {mode === 'shapes' && (
              <div className="flex items-center gap-1.5 bg-[#0B132B] px-2 py-1 rounded-xl border border-slate-800 shrink-0">
                <Palette className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {MODAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      title={c}
                      aria-label={c}
                      className={`w-5 h-5 rounded-md border border-black/15 transition flex items-center justify-center shrink-0 ${
                        selectedColor.toLowerCase() === c.toLowerCase()
                          ? 'ring-2 ring-[#24795E] scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {selectedColor.toLowerCase() === c.toLowerCase() && (
                        <Check className={`w-3 h-3 ${c === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  title={selectedColor}
                  aria-label={selectedColor}
                  className="w-5 h-5 rounded bg-transparent border-0 p-0 shrink-0"
                />
              </div>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            {mode === 'shapes'
              ? SHAPE_CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition font-medium border ${
                        active
                          ? '!bg-[#24795E] !text-white !border-[#24795E] font-bold shadow-2xs'
                          : 'bg-[#0B132B] text-slate-400 hover:text-white border-slate-800'
                      }`}
                    >
                      {isAr ? cat.label : cat.labelEn}
                    </button>
                  );
                })
              : PATTERN_CATEGORIES.map((cat) => {
                  const active = patternCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPatternCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition font-medium border ${
                        active
                          ? '!bg-[#24795E] !text-white !border-[#24795E] font-bold shadow-2xs'
                          : 'bg-[#0B132B] text-slate-400 hover:text-white border-slate-800'
                      }`}
                    >
                      {isAr ? cat.nameAr : cat.name}
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Modal Body Grid */}
        {mode === 'shapes' ? (
          filteredShapes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500 py-10">
              <Shapes className="w-8 h-8 text-slate-500" />
              <p className="text-xs font-semibold text-slate-300">{t.shNoResults}</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {filteredShapes.map((shape) => (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() => {
                      onSelectShape(shape, selectedColor);
                      onClose();
                    }}
                    title={isAr ? shape.nameAr : shape.name}
                    aria-label={isAr ? shape.nameAr : shape.name}
                    className="group aspect-square rounded-xl bg-[#0B132B] hover:bg-[#131d38] border border-slate-800 hover:border-[#24795E] transition flex flex-col items-center justify-center p-2 relative shadow-2xs"
                  >
                    <div className="w-7 h-7 flex items-center justify-center transition-transform group-hover:scale-110">
                      {shape.svgPath ? (
                        <svg
                          viewBox={shape.viewBox || '0 0 200 200'}
                          className="w-full h-full drop-shadow-2xs"
                        >
                          <path
                            d={shape.svgPath}
                            fill={selectedColor}
                            stroke={shape.defaultStroke || 'none'}
                            strokeWidth={shape.defaultStrokeWidth || 0}
                          />
                        </svg>
                      ) : (
                        <div
                          className="w-6 h-6 rounded-sm transition"
                          style={{
                            backgroundColor: selectedColor,
                            borderRadius: shape.type === 'circle' ? '9999px' : '4px',
                          }}
                        />
                      )}
                    </div>
                    <span className="text-[9.5px] text-slate-400 group-hover:text-slate-100 font-medium truncate w-full text-center mt-1">
                      {isAr ? shape.nameAr : shape.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : filteredPatterns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-500 py-10">
            <Grid className="w-8 h-8 text-slate-500" />
            <p className="text-xs font-semibold text-slate-300">{t.elemPatternsEmpty}</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {filteredPatterns.map((item) => {
                const isSelected = selectedPatternId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-theme-art
                    title={isAr ? item.nameAr : item.name}
                    aria-label={isAr ? item.nameAr : item.name}
                    onClick={() => {
                      setSelectedPatternId(item.id);
                      onSelectPattern?.(item);
                      onClose();
                    }}
                    className={`group relative aspect-square rounded-xl overflow-hidden border transition ${
                      isSelected
                        ? 'border-[#24795E] ring-2 ring-[#24795E]/60 shadow-sm'
                        : 'border-slate-800 hover:border-[#24795E]'
                    }`}
                  >
                    <span
                      data-theme-art
                      aria-hidden="true"
                      className="block w-full h-full transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundImage: `url("${item.thumbnail}")`,
                        backgroundRepeat: item.type === 'svg-pattern' ? 'repeat' : 'no-repeat',
                        backgroundSize: item.type === 'svg-pattern' ? '44px 44px' : 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
