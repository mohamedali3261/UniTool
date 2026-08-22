import React, { useState } from 'react';
import {
  ORNAMENTS_CATALOG,
  ORNAMENT_CATEGORIES,
  OrnamentItem
} from '../../../data/ornamentsCatalog';
import { COLOR_PALETTES } from '../../../data/presets';
import { Sparkles, Search, Palette, Plus, Check } from 'lucide-react';

interface OrnamentsTabProps {
  onAddOrnament: (item: OrnamentItem, fillColor?: string) => void;
  canvasBackgroundColor?: string;
  onChangeCanvasColor?: (color: string) => void;
  onChangeCanvasGradient?: (color1: string, color2: string) => void;
}

export const OrnamentsTab: React.FC<OrnamentsTabProps> = ({
  onAddOrnament,
  canvasBackgroundColor = '#0B132B',
  onChangeCanvasColor,
  onChangeCanvasGradient
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#F59E0B'); // Default Golden
  const [addedId, setAddedId] = useState<string | null>(null);

  // Quick Preset Colors for Ornaments
  const ORNAMENT_COLORS = [
    { name: 'ذهبي', hex: '#F59E0B' },
    { name: 'أصفر لامع', hex: '#EAB308' },
    { name: 'سماوي', hex: '#38BDF8' },
    { name: 'أزرق', hex: '#0284C7' },
    { name: 'زمردي', hex: '#10B981' },
    { name: 'وردي', hex: '#EC4899' },
    { name: 'بنفسجي', hex: '#8B5CF6' },
    { name: 'أبيض', hex: '#FFFFFF' },
    { name: 'داكن', hex: '#0F172A' }
  ];

  const filteredOrnaments = ORNAMENTS_CATALOG.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.nameAr.includes(searchQuery) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryAr.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handleOrnamentClick = (item: OrnamentItem) => {
    setAddedId(item.id);
    onAddOrnament(item, selectedColor);
    setTimeout(() => setAddedId(null), 800);
  };

  return (
    <div className="flex flex-col h-full space-y-3.5 overflow-hidden">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>الزخارف والنقوش الإسلامية والشرقية</span>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono border border-amber-500/30">
            {ORNAMENTS_CATALOG.length}+ زخرفة
          </span>
        </h3>
        <p className="text-[10px] text-slate-400">
          اختر من بين القبالات الإسلامية، الإطارات الملكية، فواصل المخطوطات، الأرابيسك، الأختام والأهلة.
        </p>
      </div>

      {/* Ornament Color Switcher */}
      <div className="p-2.5 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
          <span>لون الزخرفة المضافة:</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/20"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-mono text-[10px] text-amber-400">{selectedColor}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {ORNAMENT_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setSelectedColor(c.hex)}
              title={c.name}
              className={`w-6 h-6 rounded-lg border transition shrink-0 relative flex items-center justify-center ${
                selectedColor.toLowerCase() === c.hex.toLowerCase()
                  ? 'ring-2 ring-amber-400 scale-110 border-white'
                  : 'border-slate-700 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {selectedColor.toLowerCase() === c.hex.toLowerCase() && (
                <Check className={`w-3.5 h-3.5 stroke-[3] ${c.hex === '#FFFFFF' ? 'text-slate-900' : 'text-white'}`} />
              )}
            </button>
          ))}
          <label className="relative w-6 h-6 rounded-lg border border-slate-700 bg-slate-800 hover:border-amber-400 cursor-pointer flex items-center justify-center shrink-0">
            <Palette className="w-3.5 h-3.5 text-slate-300" />
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ابحث في الزخارف (قبالات، إطارات، فواصل، هلال)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pr-8 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[38px]"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar shrink-0">
        {ORNAMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap transition min-h-[30px] ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Ornaments Catalog Grid */}
      <div className="flex-1 overflow-y-auto pr-0.5 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredOrnaments.map((item) => {
            const isJustAdded = addedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOrnamentClick(item)}
                className={`group relative aspect-square rounded-2xl bg-[#0B132B] border p-2.5 flex flex-col items-center justify-between transition hover:-translate-y-0.5 overflow-hidden shadow-sm ${
                  isJustAdded
                    ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10'
                    : 'border-slate-800 hover:border-amber-400/80 hover:bg-[#151e36]'
                }`}
              >
                {/* SVG Visual Preview */}
                <div className="w-full h-20 flex items-center justify-center p-1 relative">
                  <svg
                    viewBox={item.viewBox || '0 0 200 200'}
                    className="w-full h-full max-h-full transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                  >
                    <path
                      d={item.svgPath}
                      fill={selectedColor || item.defaultFill || '#F59E0B'}
                      stroke={item.defaultStroke || 'none'}
                      strokeWidth={item.defaultStrokeWidth || 0}
                    />
                  </svg>
                </div>

                {/* Name Label */}
                <div className="w-full text-center mt-1">
                  <span className="text-[10px] font-medium text-slate-300 group-hover:text-amber-300 truncate block">
                    {item.nameAr}
                  </span>
                </div>

                {/* Plus Icon Overlay */}
                <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md p-1 rounded-lg text-amber-400 opacity-0 group-hover:opacity-100 transition shadow-md">
                  <Plus className="w-3.5 h-3.5" />
                </div>

                {/* Success Indicator */}
                {isJustAdded && (
                  <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-lg">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>تمت الإضافة</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {filteredOrnaments.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            لا توجد زخارف تطابق البحث.
          </div>
        )}
      </div>

      {/* Collapsible Canvas Background Colors Bar at Bottom */}
      {onChangeCanvasColor && (
        <div className="p-2.5 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1 text-slate-200">
              <Palette className="w-3.5 h-3.5 text-sky-400" />
              <span>لون خلفية الكانفاس:</span>
            </span>
            <span className="font-mono text-[10px] text-sky-400 uppercase">
              {canvasBackgroundColor}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {COLOR_PALETTES.solids.slice(0, 10).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChangeCanvasColor(c)}
                className={`w-5 h-5 rounded-md border transition shrink-0 ${
                  canvasBackgroundColor?.toLowerCase() === c.toLowerCase()
                    ? 'ring-2 ring-sky-400 scale-110 border-white'
                    : 'border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            {onChangeCanvasGradient && COLOR_PALETTES.gradients.slice(0, 4).map((g) => (
              <button
                key={g.name}
                type="button"
                title={g.nameAr}
                onClick={() => onChangeCanvasGradient(g.stops[0], g.stops[1])}
                className="w-5 h-5 rounded-md border border-slate-700 transition shrink-0 hover:scale-110"
                style={{ background: g.gradient }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
