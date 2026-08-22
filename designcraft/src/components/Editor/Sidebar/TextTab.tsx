import React, { useState } from 'react';
import { TEXT_PRESETS, POPULAR_FONTS, COLOR_PALETTES } from '../../../data/presets';
import { TextPreset, ActiveObjectProperties } from '../../../types';
import {
  Type,
  Sparkles,
  Plus,
  Palette,
  Sliders
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

export const TextTab: React.FC<TextTabProps> = ({
  onAddText,
  onAddHeading,
  onAddSubheading,
  onAddBodyText,
  activeProperties,
  onUpdateProperty
}) => {
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
    const textToAdd = customText.trim() || 'نص جديد';
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
      if (preset.backgroundColor) onUpdateProperty('backgroundColor', preset.backgroundColor);
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
    { id: 'all', label: 'الكل' },
    { id: 'headings', label: 'عناوين' },
    { id: 'gold', label: 'ذهبي فخم' },
    { id: 'neon', label: 'نيون وتوهج' },
    { id: 'calligraphy', label: 'خطوط عربية' },
    { id: 'badges', label: 'شارات وعروض' },
    { id: '3d', label: 'تأثيرات 3D' }
  ];

  const filteredPresets = TEXT_PRESETS.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-0.5 select-none">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Type className="w-4 h-4 text-sky-400" />
          <span>قسم النصوص والخطوط والتنسيقات الجاهزة</span>
        </h3>
        <p className="text-[11px] text-slate-400">
          إضافة نصوص مخصصة، خطوط عربية وتنسيقات نيون ومذهبة بضغطة واحدة
        </p>
      </div>

      {/* Quick Add Custom Text Field */}
      <form onSubmit={handleAddCustomText} className="space-y-2 bg-[#0B132B] p-3 rounded-2xl border border-slate-700/80 shadow-xs">
        <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span>أدخل نصك الخاص:</span>
          <span className="text-[10px] text-sky-400 font-normal">معاينة حية</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="اكتب عنوانك أو نصك هنا..."
            className="flex-1 bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1 transition shadow-md shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        </div>
      </form>

      {/* Preset Customizable Properties Section */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>مقياس الحجم لكافة التنسيقات</span>
          </span>
          <span className="text-[10px] text-sky-400 font-mono">{presetScale}% الحجم</span>
        </div>

        {/* Size Scaler & Color Customizer Bar */}
        <div className="bg-[#0B132B] p-2.5 rounded-2xl border border-slate-800 space-y-2.5">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300 font-medium">
              <span>تحكم كامل في الحجم بمؤشر مستمر:</span>
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

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-300">تخصيص لون التنسيق:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOverridePresetColor(null)}
                className={`px-2 py-0.5 rounded-md text-[10px] border transition ${
                  overridePresetColor === null
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                الأصلي
              </button>
              {['#FFFFFF', '#FCD34D', '#38BDF8', '#F43F5E', '#10B981', '#A855F7'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setOverridePresetColor(c)}
                  className={`w-5 h-5 rounded-md border transition ${
                    overridePresetColor === c ? 'border-white ring-2 ring-sky-400 scale-110' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Styled Font Combinations / Presets Gallery */}
      <div className="space-y-2.5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>مكتبة التنسيقات النصية الجاهزة ({filteredPresets.length})</span>
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition border ${
                activeCategory === cat.id
                  ? 'bg-sky-500 text-white border-sky-400 shadow-xs'
                  : 'bg-[#0B132B] hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-0.5 no-scrollbar">
          {filteredPresets.map((preset) => {
            const previewText = customText.trim() || preset.text;
            const previewColor = overridePresetColor || preset.fill;
            const scaledFontSize = Math.min(Math.round(preset.fontSize * (presetScale / 100)), 24);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="p-3 rounded-xl bg-[#0B132B] hover:bg-[#152042] border border-slate-800 hover:border-sky-400 transition text-center shadow-xs group flex flex-col items-center justify-center gap-1"
              >
                <div
                  className="truncate transition group-hover:scale-102 max-w-full"
                  style={{
                    fontFamily: preset.fontFamily,
                    color: previewColor,
                    fontSize: scaledFontSize,
                    fontWeight: preset.fontWeight,
                    fontStyle: preset.fontStyle || 'normal',
                    backgroundColor: preset.backgroundColor || 'transparent',
                    padding: preset.backgroundColor ? '4px 12px' : '0',
                    borderRadius: '8px',
                    display: 'inline-block'
                  }}
                >
                  {previewText}
                </div>
                <div className="text-[10px] text-slate-400 font-sans">{preset.labelAr}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Selector Gallery */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>مكتبة الخطوط العربية والإنجليزية</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-0.5 no-scrollbar">
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
              className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                selectedFont === font.name
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-[#0B132B] hover:bg-[#152042] border-slate-800 text-slate-200'
              }`}
            >
              <span className="text-sm font-bold truncate max-w-full" style={{ fontFamily: font.name }}>
                {customText.trim() || font.name}
              </span>
              <span className="text-[9px] text-slate-400 font-sans truncate">{font.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette Quick Picker for Text */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            <span>ألوان أساسية مخصصة</span>
          </span>
        </div>

        <div className="grid grid-cols-8 gap-1.5">
          {COLOR_PALETTES.solids.slice(0, 16).map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelectedColor(c);
                if (isTextSelected && onUpdateProperty) {
                  onUpdateProperty('fill', c);
                }
              }}
              className={`w-6 h-6 rounded-lg transition border hover:scale-110 shadow-xs ${
                selectedColor === c ? 'border-white ring-2 ring-sky-400' : 'border-slate-700'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
