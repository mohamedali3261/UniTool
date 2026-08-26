import React, { useState } from 'react';
import { SHAPES_CATALOG, SHAPE_CATEGORIES, ShapeItem } from '../../../data/shapesCatalog';
import { COLOR_PALETTES } from '../../../data/presets';
import { Search, Shapes, X, Palette, Check, Sparkles } from 'lucide-react';
import { getEnglishKeywordsForSearch } from '../../../utils/searchTranslator';
import { useDcLang } from '../../../hooks/useDcLang';

interface ShapesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (shape: ShapeItem, fill: string) => void;
}

export const ShapesModal: React.FC<ShapesModalProps> = ({
  isOpen,
  onClose,
  onSelectShape
}) => {
  const { t } = useDcLang();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedColor, setSelectedColor] = useState('#0284C7');

  if (!isOpen) return null;

  const searchKeywords = getEnglishKeywordsForSearch(search);

  const filteredShapes = SHAPES_CATALOG.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    if (!search.trim()) return matchesCat;

    const nameLower = item.name.toLowerCase();
    const nameArLower = item.nameAr.toLowerCase();

    const matchesSearch = searchKeywords.some(
      (kw) => nameLower.includes(kw) || nameArLower.includes(kw)
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
              <Shapes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{t.shTitle}</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded-full border border-sky-500/30">
                  +200
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

        {/* Controls Section: Search & Color Picker */}
        <div className="p-4 bg-[#0B132B]/60 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.shSearchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0B132B] border border-slate-700/80 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Color Palette Selector */}
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {SHAPE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition font-medium ${
                  activeCategory === cat.id
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shapes Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredShapes.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => {
                onSelectShape(shape, selectedColor);
                onClose();
              }}
              title={`${shape.nameAr} (${shape.name})`}
              className="group aspect-square rounded-2xl bg-[#0B132B] hover:bg-[#131d38] border border-slate-800 hover:border-sky-400 transition flex flex-col items-center justify-center p-2.5 relative hover:scale-105 active:scale-95 shadow-sm"
            >
              <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                {shape.svgPath ? (
                  <svg
                    viewBox={shape.viewBox || '0 0 200 200'}
                    className="w-full h-full drop-shadow-sm"
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
                    className="w-8 h-8 rounded-md transition"
                    style={{
                      backgroundColor: selectedColor,
                      borderRadius: shape.type === 'circle' ? '9999px' : '4px'
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-100 font-medium truncate w-full text-center mt-1.5">
                {shape.nameAr}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
