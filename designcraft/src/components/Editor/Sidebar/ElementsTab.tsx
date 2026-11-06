import { SHAPES_CATALOG } from '../../../data/shapesCatalog';
import {
  PATTERNS_CATALOG,
  PATTERN_CATEGORIES,
  BackgroundPatternItem,
} from '../../../data/patternsCatalog';
import React, { useState } from 'react';
import {
  Square,
  Circle,
  Triangle,
  Star,
  Minus,
  MoveRight,
  Heart,
  Award,
  Shapes,
  Palette,
  Maximize2,
  Sparkles,
  Grid,
  Search,
  Check,
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

const QUICK_SHAPE_COLORS = [
  '#24795E',
  '#0284C7',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#14B8A6',
  '#6366F1',
  '#D97706',
  '#EC4899',
  '#0F172A',
  '#334155',
  '#64748B',
  '#FFFFFF',
];

interface ElementsTabProps {
  onAddRectangle: (fill?: string, rx?: number) => void;
  onAddCircle: (fill?: string) => void;
  onAddTriangle: (fill?: string) => void;
  onAddStar: (fill?: string) => void;
  onAddLine: (stroke?: string) => void;
  onAddArrow: (stroke?: string) => void;
  onAddBadge: (fill?: string) => void;
  onAddHeart: (fill?: string) => void;
  onOpenShapesModal?: () => void;
  onOpenPatternsModal?: () => void;
  onSelectPattern?: (patternItem: BackgroundPatternItem) => void;
}

export const ElementsTab: React.FC<ElementsTabProps> = ({
  onAddRectangle,
  onAddCircle,
  onAddTriangle,
  onAddStar,
  onAddLine,
  onAddArrow,
  onAddBadge,
  onAddHeart,
  onOpenShapesModal,
  onOpenPatternsModal,
  onSelectPattern,
}) => {
  const { t, lang } = useDcLang();
  const isAr = lang === 'ar';
  const [selectedColor, setSelectedColor] = useState('#24795E');
  const [patternCategory, setPatternCategory] = useState<string>('all');
  const [patternSearch, setPatternSearch] = useState('');
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

  const shapesList = [
    {
      id: 'rect',
      label: t.elemRect,
      icon: <Square className="w-4 h-4" />,
      action: () => onAddRectangle(selectedColor, 0),
    },
    {
      id: 'rounded-rect',
      label: t.elemRoundedRect,
      icon: <div className="w-4 h-3.5 rounded-sm border-2 border-current" />,
      action: () => onAddRectangle(selectedColor, 20),
    },
    {
      id: 'circle',
      label: t.elemCircle,
      icon: <Circle className="w-4 h-4" />,
      action: () => onAddCircle(selectedColor),
    },
    {
      id: 'triangle',
      label: t.elemTriangle,
      icon: <Triangle className="w-4 h-4" />,
      action: () => onAddTriangle(selectedColor),
    },
    {
      id: 'star',
      label: t.elemStar,
      icon: <Star className="w-4 h-4" />,
      action: () => onAddStar(selectedColor),
    },
    {
      id: 'badge',
      label: t.elemBadge,
      icon: <Award className="w-4 h-4" />,
      action: () => onAddBadge(selectedColor),
    },
    {
      id: 'line',
      label: t.elemLine,
      icon: <Minus className="w-4 h-4" />,
      action: () => onAddLine(selectedColor),
    },
    {
      id: 'arrow',
      label: t.elemArrow,
      icon: <MoveRight className="w-4 h-4" />,
      action: () => onAddArrow(selectedColor),
    },
    {
      id: 'heart',
      label: t.elemHeart,
      icon: <Heart className="w-4 h-4" />,
      action: () => onAddHeart(selectedColor),
    },
  ];

  const q = patternSearch.trim().toLowerCase();
  const filteredPatterns = PATTERNS_CATALOG.filter((item) => {
    const matchesCategory = patternCategory === 'all' || item.category === patternCategory;
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      item.nameAr.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.descriptionAr.toLowerCase().includes(q)
    );
  });

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="flex flex-col h-full space-y-3 overflow-y-auto pr-0.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Shapes className="w-3.5 h-3.5 text-sky-400" />
          <span>{t.elemTitle}</span>
        </h3>
        {onOpenShapesModal && (
          <button
            type="button"
            onClick={onOpenShapesModal}
            className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-500/30 transition"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{SHAPES_CATALOG.length}</span>
          </button>
        )}
      </div>

      {/* Prominent Modal Opener Button */}
      {onOpenShapesModal && (
        <button
          type="button"
          onClick={onOpenShapesModal}
          className="w-full p-2 rounded-xl bg-gradient-to-r from-sky-600/30 to-blue-600/30 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-500/40 text-white font-bold text-xs flex items-center justify-between transition group shadow-xs"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#24795E] !text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 !text-white" />
            </div>
            <span>{t.elemOpenShapes}</span>
          </div>
          <span className="text-[10px] font-mono bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full font-bold">
            {SHAPES_CATALOG.length}
          </span>
        </button>
      )}

      {/* Color Pre-selector */}
      <div className="p-2 bg-[#0B132B] rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center gap-1 font-medium">
            <Palette className="w-3 h-3 text-sky-400" /> {t.elemFillColor}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-sky-400">{selectedColor}</span>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              aria-label={t.elemFillColor}
              className="w-5 h-5 rounded border-0 bg-transparent p-0"
            />
          </div>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {QUICK_SHAPE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              aria-label={c}
              onClick={() => setSelectedColor(c)}
              className={`w-5 h-5 rounded-md border border-black/15 transition ${
                selectedColor.toLowerCase() === c.toLowerCase()
                  ? 'ring-2 ring-[#24795E] scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Quick Shapes Grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {shapesList.map((shape) => (
          <button
            key={shape.id}
            type="button"
            onClick={shape.action}
            className="p-2 rounded-xl bg-[#0B132B] hover:bg-[#151e36] border border-slate-800 hover:border-sky-400 text-slate-200 hover:text-sky-300 transition flex flex-col items-center justify-center gap-1 group shadow-2xs"
          >
            <div className="p-1 rounded-lg bg-slate-800/80 group-hover:bg-sky-500/20 text-sky-400 transition">
              {shape.icon}
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">{shape.label}</span>
          </button>
        ))}
      </div>

      {/* Patterned Backgrounds Section (60+ Seamless Patterns) */}
      <div
        data-testid="shapes-patterns-section"
        className="pt-2.5 border-t border-slate-800 space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.elemPatternsTitle}</span>
            <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-full border border-sky-500/30">
              {PATTERNS_CATALOG.length}
            </span>
          </h4>
          {(onOpenPatternsModal || onOpenShapesModal) && (
            <button
              type="button"
              onClick={onOpenPatternsModal || onOpenShapesModal}
              className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded-lg border border-sky-500/30 transition"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>{t.elemPatternsOpenWindow}</span>
            </button>
          )}
        </div>

        {/* Pattern Search */}
        <div className="relative">
          <Search
            className={`w-3.5 h-3.5 text-slate-400 absolute ${isAr ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 pointer-events-none`}
          />
          <input
            type="text"
            value={patternSearch}
            onChange={(e) => setPatternSearch(e.target.value)}
            placeholder={t.elemPatternsSearch}
            aria-label={t.elemPatternsSearch}
            className={`w-full bg-[#0B132B] border border-slate-700/80 rounded-lg ${isAr ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5'} py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-sky-500`}
          />
        </div>

        {/* Pattern Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
          {PATTERN_CATEGORIES.map((cat) => {
            const active = patternCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPatternCategory(cat.id)}
                className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap transition font-semibold border ${
                  active
                    ? '!bg-[#24795E] !text-white !border-[#24795E] shadow-2xs'
                    : 'bg-[#0B132B] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                {isAr ? cat.nameAr : cat.name}
              </button>
            );
          })}
        </div>

        {/* 60 Patterned Backgrounds Grid */}
        {filteredPatterns.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-4">{t.elemPatternsEmpty}</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
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
                      backgroundSize: item.type === 'svg-pattern' ? '40px 40px' : 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  {isSelected && (
                    <span className="absolute top-1 left-1 p-0.5 rounded-full bg-[#24795E] !text-white shadow-sm">
                      <Check className="w-3 h-3 !text-white stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
