import React, { useState } from 'react';
import { ICONS_CATALOG, COLOR_PALETTES } from '../../../data/presets';
import { Search, SmilePlus, Palette, Sparkles, Check, Maximize2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getEnglishKeywordsForSearch } from '../../../utils/searchTranslator';

interface IconsTabProps {
  onAddIcon: (iconName: string, color: string) => void;
  onOpenIconsModal?: () => void;
  onUpdateSelectedIconColor?: (color: string) => void;
}

export const IconsTab: React.FC<IconsTabProps> = ({ onAddIcon, onOpenIconsModal, onUpdateSelectedIconColor }) => {
  const [search, setSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState('#38BDF8');
  const [activeCategory, setActiveCategory] = useState('all');

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onUpdateSelectedIconColor?.(color);
  };

  const allIcons = ICONS_CATALOG.flatMap((cat) =>
    cat.icons.map((ic) => ({ ...ic, category: cat.category, categoryAr: cat.categoryAr }))
  );

  const searchKeywords = getEnglishKeywordsForSearch(search);

  const filteredIcons = allIcons.filter((item) => {
    const matchCat = activeCategory === 'all' || item.category === activeCategory;
    if (!search.trim()) return matchCat;

    const nameLower = item.name.toLowerCase();
    const labelLower = item.label.toLowerCase();

    const matchSearch = searchKeywords.some(
      (kw) => nameLower.includes(kw) || labelLower.includes(kw)
    );

    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <SmilePlus className="w-3.5 h-3.5 text-sky-400" />
          <span>مكتبة الأيقونات</span>
        </h3>
        {onOpenIconsModal && (
          <button
            type="button"
            onClick={onOpenIconsModal}
            className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-500/30 transition"
          >
            <Maximize2 className="w-3 h-3" />
            <span>نافذة شاملة</span>
          </button>
        )}
      </div>

      {/* Prominent Modal Button */}
      {onOpenIconsModal && (
        <button
          type="button"
          onClick={onOpenIconsModal}
          className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-sky-600/30 to-blue-600/30 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-500/40 text-white font-bold text-xs flex items-center justify-between transition group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500 text-white shadow-sm group-hover:scale-110 transition">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span>فتح نافذة البحث الشاملة للأيقونات</span>
          </div>
          <span className="text-[10px] font-mono bg-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full font-bold">
            +{allIcons.length}
          </span>
        </button>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ابحث في الأيقونات (مثال: Play, Star, Cart, Phone)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pr-8 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Icon Color Picker */}
      <div className="p-2.5 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-bold">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            <span>لون الأيقونة</span>
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-5 h-5 rounded-md cursor-pointer bg-transparent border-0"
            />
            <span className="font-mono text-[11px] text-sky-400 font-bold">{selectedColor}</span>
          </div>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {COLOR_PALETTES.solids.slice(0, 16).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handleColorChange(c)}
              className={`w-5 h-5 rounded-md transition flex items-center justify-center ${
                selectedColor === c ? 'ring-2 ring-white scale-110 shadow-sm' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            >
              {selectedColor === c && (
                <Check className={`w-3 h-3 ${c === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition font-medium ${
            activeCategory === 'all'
              ? 'bg-sky-500 text-white font-bold shadow-sm'
              : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          الكل ({allIcons.length})
        </button>
        {ICONS_CATALOG.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => setActiveCategory(cat.category)}
            className={`px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition font-medium ${
              activeCategory === cat.category
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.categoryAr} ({cat.icons.length})
          </button>
        ))}
      </div>

      {/* Clean Icons Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 flex-1 overflow-y-auto pr-0.5">
        {filteredIcons.map((ic, idx) => {
          const IconComponent = (LucideIcons as any)[ic.name] || LucideIcons.Sparkles;
          return (
            <button
              key={`${ic.name}-${idx}`}
              type="button"
              onClick={() => onAddIcon(ic.name, selectedColor)}
              title={`${ic.label} (${ic.name})`}
              className="h-14 rounded-xl bg-[#0B132B] hover:bg-[#131d38] border border-slate-800/90 hover:border-sky-400 transition flex flex-col items-center justify-center group shadow-sm hover:scale-105 active:scale-95 relative"
            >
              <div style={{ color: selectedColor }}>
                <IconComponent className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <span className="text-[9px] text-slate-400 group-hover:text-slate-200 mt-1 max-w-[90%] truncate">
                {ic.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
