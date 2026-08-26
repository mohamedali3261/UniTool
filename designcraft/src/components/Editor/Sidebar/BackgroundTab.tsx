import React, { useState } from 'react';
import { COLOR_PALETTES } from '../../../data/presets';
import {
  PATTERNS_CATALOG,
  PATTERN_CATEGORIES,
  BackgroundPatternItem
} from '../../../data/patternsCatalog';
import { ColorPickerPopover } from '../../Common/ColorPickerPopover';
import { useDcLang } from '../../../hooks/useDcLang';
import { Palette, Sparkles, Grid, Layers, Check, Image as ImageIcon } from 'lucide-react';

interface BackgroundTabProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  onSelectGradient: (color1: any, color2?: string) => void;
  onSelectPattern?: (patternItem: BackgroundPatternItem) => void;
}

export const BackgroundTab: React.FC<BackgroundTabProps> = ({
  currentColor,
  onSelectColor,
  onSelectGradient,
  onSelectPattern
}) => {
  const { t } = useDcLang();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'colors' | 'patterns'>('patterns');
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

  const filteredPatterns = PATTERNS_CATALOG.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="flex flex-col h-full space-y-3.5 overflow-hidden">
      {/* Tab Header */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-sky-400" />
          <span>{t.bgCustomize}</span>
        </h3>
        <p className="text-[10px] text-slate-400">
          {t.bgCustomizeDesc}
        </p>
      </div>

      {/* Mode Switcher: Colors vs Ornate Patterns */}
      <div className="grid grid-cols-2 p-1 bg-[#0B132B] rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('patterns')}
          className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'patterns'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>{t.bgPatterns} ({PATTERNS_CATALOG.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'colors'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{t.bgColorsGradients}</span>
        </button>
      </div>

      {/* TAB 1: ORNATE PATTERNS & WALLPAPERS */}
      {activeTab === 'patterns' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar shrink-0">
            {PATTERN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-medium whitespace-nowrap transition ${
                  activeCategory === cat.id
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'bg-[#0B132B] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.nameAr}
              </button>
            ))}
          </div>

          {/* Pattern Cards Catalog - Visual Only without Text Titles */}
          <div className="flex-1 overflow-y-auto pr-0.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPatterns.map((item) => {
                const isSelected = selectedPatternId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.nameAr}
                    onClick={() => {
                      setSelectedPatternId(item.id);
                      if (onSelectPattern) {
                        onSelectPattern(item);
                      }
                    }}
                    className={`group relative aspect-square rounded-xl overflow-hidden border transition bg-slate-950 ${
                      isSelected
                        ? 'border-sky-400 ring-2 ring-sky-400/50 shadow-lg scale-[1.02]'
                        : 'border-slate-800 hover:border-sky-400/80 hover:scale-[1.03]'
                    }`}
                  >
                    {/* Live Pattern Full Bleed Preview Image */}
                    <img
                      src={item.thumbnail}
                      alt={item.nameAr}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Subtle Overlay Badge on Hover */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-black/70 backdrop-blur-md p-1 rounded-md text-[8px] text-sky-300 border border-white/10">
                      {item.type === 'svg-pattern' ? <Grid className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    </div>

                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-sky-500/25 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="p-1.5 rounded-full bg-sky-500 text-white shadow-lg animate-in zoom-in-50">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOLID COLORS & GRADIENTS */}
      {activeTab === 'colors' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {/* Solid Color Custom Picker */}
          <div className="p-3 bg-[#0B132B] rounded-xl border border-slate-800 space-y-2.5">
            <ColorPickerPopover
              label={t.bgColorSolid}
              color={currentColor || '#0B132B'}
              onChange={onSelectColor}
              allowTransparent={true}
            />

            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-semibold text-slate-400">{t.bgQuickColors}</div>
              <div className="grid grid-cols-8 gap-1">
                {COLOR_PALETTES.solids.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onSelectColor(c)}
                    className={`w-5 h-5 rounded-md transition ${
                      currentColor?.toLowerCase() === c.toLowerCase()
                        ? 'ring-2 ring-sky-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Gradients Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>{t.bgTrendyGradients}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {COLOR_PALETTES.gradients.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => onSelectGradient(g.stops[0], g.stops[1])}
                  className="group p-2 rounded-xl bg-[#0B132B] hover:bg-[#151e36] border border-slate-800 hover:border-sky-400 transition text-right flex flex-col gap-1.5"
                >
                  <div
                    className="w-full h-10 rounded-lg shadow-inner border border-white/10 group-hover:scale-[1.02] transition"
                    style={{ background: g.gradient }}
                  />
                  <span className="text-[10px] font-medium text-slate-300 group-hover:text-sky-300">
                    {g.nameAr}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
