import React, { useState } from 'react';
import { TEXT_PRESETS, POPULAR_FONTS, COLOR_PALETTES } from '../../../data/presets';
import { TextPreset, ActiveObjectProperties } from '../../../types';
import { useDcLang } from '../../../hooks/useDcLang';
import {
  Type,
  Sparkles,
  Plus,
  Sliders,
  X,
  Palette,
  Wand2
} from 'lucide-react';

interface TextTabProps {
  onAddText?: (options: {
    text: string;
    fontSize: number;
    fontWeight: string | number;
    fontFamily: string;
    fill?: string;
    backgroundColor?: string;
    shadow?: string;
    fontStyle?: '' | 'normal' | 'italic' | 'oblique';
    textAlign?: string;
  }) => void;
  onAddHeading?: () => void;
  onAddSubheading?: () => void;
  onAddBodyText?: () => void;
  activeProperties?: ActiveObjectProperties | null;
  onUpdateProperty?: (key: keyof ActiveObjectProperties, value: any) => void;
}

/* ---------- Shared section card: colored header + body ---------- */
const Section: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, trailing, children }) => (
  <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xs overflow-hidden">
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/80 bg-white/[0.02]">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`shrink-0 p-1 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </span>
        <h3 className="text-[11px] font-bold text-slate-200 truncate">{title}</h3>
      </div>
      {trailing}
    </div>
    <div className="p-3 space-y-2.5">{children}</div>
  </div>
);

/* Category accent colors for the filter chips */
const CAT_COLORS: Record<string, string> = {
  all: '#38BDF8',
  headings: '#A78BFA',
  gold: '#FBBF24',
  neon: '#22D3EE',
  calligraphy: '#F472B6',
  badges: '#34D399',
  '3d': '#FB923C'
};

export const TextTab: React.FC<TextTabProps> = ({
  onAddText,
  onAddHeading,
  onAddBodyText,
  activeProperties,
  onUpdateProperty
}) => {
  const { t } = useDcLang();
  const [customText, setCustomText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Cairo');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');

  // Preset customizer state
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [presetScale, setPresetScale] = useState<number>(100); // 100% size multiplier
  const [overridePresetColor, setOverridePresetColor] = useState<string | null>(null);

  const isTextSelected = activeProperties && (
    activeProperties.type === 'textbox' ||
    activeProperties.type === 'text' ||
    activeProperties.type === 'i-text'
  );

  const safeAddText = (options: {
    text: string;
    fontSize: number;
    fontWeight: string | number;
    fontFamily: string;
    fill?: string;
    backgroundColor?: string;
    shadow?: string;
    fontStyle?: '' | 'normal' | 'italic' | 'oblique';
    textAlign?: string;
  }) => {
    if (typeof onAddText === 'function') {
      onAddText(options);
    } else if (typeof onAddHeading === 'function') {
      onAddHeading();
    }
  };

  const handleAddCustomText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToAdd = customText.trim() || t.addNewText;
    safeAddText({
      text: textToAdd,
      fontSize: Math.round(36 * (presetScale / 100)),
      fontWeight: 700,
      fontFamily: selectedFont,
      fill: selectedColor
    });
    setCustomText('');
  };

  const handleApplyPreset = (preset: TextPreset) => {
    if (isTextSelected && onUpdateProperty) {
      onUpdateProperty('fontFamily', preset.fontFamily);
      onUpdateProperty('fontWeight', preset.fontWeight);
      if (preset.fill) onUpdateProperty('fill', preset.fill);
      if (preset.backgroundColor) onUpdateProperty('textBackgroundColor', preset.backgroundColor);
      if (preset.fontStyle) onUpdateProperty('fontStyle', preset.fontStyle);
      return;
    }

    const textToAdd = customText.trim() || preset.text;
    const finalSize = Math.round(preset.fontSize * (presetScale / 100));
    const finalColor = overridePresetColor || preset.fill;

    safeAddText({
      text: textToAdd,
      fontSize: finalSize,
      fontWeight: preset.fontWeight,
      fontFamily: preset.fontFamily,
      fill: finalColor,
      backgroundColor: preset.backgroundColor,
      shadow: preset.shadow,
      fontStyle: preset.fontStyle as any
    });
  };

  const categories = [
    { id: 'all', label: t.catAllText },
    { id: 'headings', label: t.catHeadings },
    { id: 'gold', label: t.catGolden },
    { id: 'neon', label: t.catNeon },
    { id: 'calligraphy', label: t.catArabicFonts },
    { id: 'badges', label: t.catBadges },
    { id: '3d', label: t.cat3D }
  ];

  const filteredPresets = TEXT_PRESETS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="flex flex-col h-full gap-2.5 overflow-y-auto pr-0.5 select-none">

      {/* Page intro header */}
      <div className="flex items-start gap-2.5 px-1 pt-1">
        <span className="shrink-0 p-1.5 rounded-xl bg-gradient-to-br from-sky-500/25 to-indigo-500/25 border border-sky-500/30 text-sky-300 flex items-center justify-center">
          <Type className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-white leading-snug">{t.textTabDesc}</h3>
          <p className="text-[10px] text-slate-400 leading-relaxed">{t.textTabSubdesc}</p>
        </div>
      </div>

      {/* 1. Quick add custom text */}
      <Section
        title={t.enterCustomText}
        icon={<Plus className="w-3.5 h-3.5 text-sky-300" />}
        iconBg="bg-sky-500/15"
        trailing={<span className="text-[10px] text-sky-400 font-normal shrink-0">{t.livePreview}</span>}
      >
        <form onSubmit={handleAddCustomText} className="flex gap-1.5">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={t.textInputPlaceholder}
            className="flex-1 min-w-0 bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1 transition shadow-md shadow-sky-500/20 shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addBtn}</span>
          </button>
        </form>
      </Section>

      {/* 2. Customizer: scale + color before adding */}
      <Section
        title={t.scaleSection}
        icon={<Sliders className="w-3.5 h-3.5 text-amber-300" />}
        iconBg="bg-amber-500/15"
        trailing={<span className="text-[10px] text-sky-400 font-mono font-bold shrink-0">{presetScale}%</span>}
      >
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>{t.scaleSliderHint}</span>
            <span className="text-sky-400 font-mono">{presetScale}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="300"
            step="5"
            value={presetScale}
            onChange={(e) => setPresetScale(parseInt(e.target.value) || 100)}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px]">
          <span className="text-slate-400 shrink-0">{t.customColorLabel}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOverridePresetColor(null)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] border transition ${
                overridePresetColor === null
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.originalLabel}
            </button>
            {['#FFFFFF', '#FCD34D', '#38BDF8', '#F43F5E', '#10B981', '#A855F7'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setOverridePresetColor(c)}
                className={`w-[18px] h-[18px] rounded-md border transition hover:scale-110 ${
                  overridePresetColor === c ? 'border-white ring-2 ring-sky-400 scale-110' : 'border-slate-700'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* 3. Styled presets gallery */}
      <Section
        title={`${t.textPresetsLibrary} · ${filteredPresets.length}`}
        icon={<Wand2 className="w-3.5 h-3.5 text-violet-300" />}
        iconBg="bg-violet-500/15"
      >
        {/* Category filter chips with accent dots */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar -mx-0.5 px-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold whitespace-nowrap transition border ${
                activeCategory === cat.id
                  ? 'bg-sky-500 text-white border-sky-400 shadow-xs'
                  : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: CAT_COLORS[cat.id] || '#38BDF8' }}
              />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Preset cards */}
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-0.5 no-scrollbar">
          {filteredPresets.map((preset) => {
            const previewText = customText.trim() || preset.text;
            const previewColor = overridePresetColor || preset.fill;
            const scaledFontSize = Math.min(Math.round(preset.fontSize * (presetScale / 100)), 22);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="h-20 px-2 rounded-xl bg-slate-900/60 hover:bg-[#152042] border border-slate-800 hover:border-sky-400/70 hover:shadow-md hover:shadow-sky-500/10 transition group flex flex-col items-center justify-center gap-1 text-center"
              >
                <div className="flex-1 flex items-center justify-center min-w-0 w-full">
                  <div
                    className="truncate max-w-full transition group-hover:scale-105"
                    style={{
                      fontFamily: preset.fontFamily,
                      color: previewColor,
                      fontSize: scaledFontSize,
                      fontWeight: preset.fontWeight,
                      fontStyle: preset.fontStyle || 'normal',
                      backgroundColor: preset.backgroundColor || 'transparent',
                      padding: preset.backgroundColor ? '3px 10px' : '0',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}
                  >
                    {previewText}
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 group-hover:text-sky-300 transition truncate max-w-full font-sans">
                  {preset.labelAr}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 4. Fonts gallery */}
      <Section
        title={t.textFontsLibrary}
        icon={<Type className="w-3.5 h-3.5 text-cyan-300" />}
        iconBg="bg-cyan-500/15"
      >
        <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5 no-scrollbar">
          {POPULAR_FONTS.map((font) => (
            <button
              key={font.name}
              type="button"
              onClick={() => {
                setSelectedFont(font.name);
                if (isTextSelected && onUpdateProperty) {
                  onUpdateProperty('fontFamily', font.name);
                } else {
                  safeAddText({
                    text: customText.trim() || font.name,
                    fontSize: Math.round(30 * (presetScale / 100)),
                    fontWeight: 700,
                    fontFamily: font.name,
                    fill: selectedColor
                  });
                }
              }}
              className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 min-h-[46px] ${
                selectedFont === font.name
                  ? 'bg-sky-500/15 border-sky-400 text-sky-200 shadow-xs ring-1 ring-sky-400/40'
                  : 'bg-slate-900/60 hover:bg-[#152042] border-slate-800 text-slate-200 hover:border-slate-600'
              }`}
            >
              <span className="text-sm font-bold truncate max-w-full w-full" style={{ fontFamily: font.name }}>
                {customText.trim() || font.name}
              </span>
              <span className="text-[9px] text-slate-500 font-sans truncate max-w-full w-full">{font.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* 5. Quick colors */}
      <Section
        title={t.basicColors}
        icon={<Palette className="w-3.5 h-3.5 text-emerald-300" />}
        iconBg="bg-emerald-500/15"
      >
        <div className="grid grid-cols-8 gap-1.5">
          {COLOR_PALETTES.solids.slice(0, 24).map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelectedColor(c);
                if (isTextSelected && onUpdateProperty) {
                  onUpdateProperty('fill', c);
                }
              }}
              className={`w-6 h-6 rounded-lg transition border hover:scale-110 hover:border-slate-400 ${
                selectedColor === c ? 'border-white ring-2 ring-sky-400 scale-110' : 'border-slate-700'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Section>

      {/* bottom spacing */}
      <div className="pb-1" />
    </div>
  );
};
