import React, { useState } from 'react';
import { ICONS_CATALOG, COLOR_PALETTES } from '../../../data/presets';
import { Search, SmilePlus, X, Palette, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getEnglishKeywordsForSearch } from '../../../utils/searchTranslator';

interface IconsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string, color: string) => void;
}

export const IconsModal: React.FC<IconsModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('#38BDF8');

  if (!isOpen) return null;

  const allIcons = ICONS_CATALOG.flatMap((cat) =>
    cat.icons.map((ic) => ({ ...ic, category: cat.category, categoryAr: cat.categoryAr }))
  );

  const searchKeywords = getEnglishKeywordsForSearch(search);

  const filteredIcons = allIcons.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    if (!search.trim()) return matchesCat;

    const nameLower = item.name.toLowerCase();
    const labelLower = item.label.toLowerCase();

    const matchesSearch = searchKeywords.some(
      (kw) => nameLower.includes(kw) || labelLower.includes(kw)
    );

    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1C2541] border border-sky-500/30 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[720px] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#0B132B] border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <SmilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>مكتبة الأيقونات والرموز</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded-full border border-sky-500/30">
                  +{allIcons.length}
                </span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Palette Bar */}
        <div className="p-4 bg-[#0B132B]/60 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث في الأيقونات (مثال: Play, Star, Cart, Phone, User, Heart)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Color Selector */}
            <div className="flex items-center gap-2 bg-[#0B132B] p-1.5 rounded-xl border border-slate-800">
              <Palette className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {COLOR_PALETTES.solids.slice(0, 10).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-lg transition flex items-center justify-center shrink-0 ${
                      selectedColor === c ? 'ring-2 ring-white scale-110 shadow-sm' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {selectedColor === c && (
                      <Check className={`w-3.5 h-3.5 ${c === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-6 h-6 rounded-lg bg-transparent cursor-pointer border-0 shrink-0"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition font-medium ${
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
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition font-medium ${
                  activeCategory === cat.category
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.categoryAr} ({cat.icons.length})
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {filteredIcons.map((ic, idx) => {
            const IconComponent = (LucideIcons as any)[ic.name] || LucideIcons.Sparkles;
            return (
              <button
                key={`${ic.name}-${idx}`}
                type="button"
                onClick={() => {
                  onSelectIcon(ic.name, selectedColor);
                  onClose();
                }}
                title={`${ic.label} (${ic.name})`}
                className="group aspect-square rounded-2xl bg-[#0B132B] hover:bg-[#131d38] border border-slate-800 hover:border-sky-400 transition flex flex-col items-center justify-center p-2 hover:scale-105 active:scale-95 shadow-sm"
              >
                <div style={{ color: selectedColor }}>
                  <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110" />
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200 mt-1.5 max-w-[90%] truncate text-center font-medium">
                  {ic.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
