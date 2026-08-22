import React from 'react';
import { ActiveObjectProperties } from '../../../types';
import { POPULAR_FONTS } from '../../../data/presets';
import { ColorPickerPopover } from '../../Common/ColorPickerPopover';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Minus,
  Plus
} from 'lucide-react';

interface TextPropertiesProps {
  properties: ActiveObjectProperties;
  onUpdate: (key: string, value: any) => void;
}

export const TextProperties: React.FC<TextPropertiesProps> = ({ properties, onUpdate }) => {
  const currentFontSize = properties.fontSize || 40;
  const isBold =
    properties.fontWeight === 'bold' ||
    properties.fontWeight === 700 ||
    properties.fontWeight === 800 ||
    properties.fontWeight === 900;
  const isItalic = properties.fontStyle === 'italic';
  const isUnderline = !!properties.underline;
  const isLinethrough = !!properties.linethrough;

  return (
    <div className="space-y-4">
      {/* Font Family Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">نوع الخط / Font Family</label>
        <select
          value={properties.fontFamily || 'Cairo'}
          onChange={(e) => onUpdate('fontFamily', e.target.value)}
          className="w-full bg-[#0B132B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer font-medium"
        >
          {POPULAR_FONTS.map((font) => (
            <option key={font.name} value={font.name}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size Slider & Weight Controls */}
      <div className="space-y-2 bg-[#0B132B] p-2.5 rounded-2xl border border-slate-700/80 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>حجم الخط بالمؤشر (Font Size)</span>
          <span className="font-mono text-sky-400 font-bold text-xs">{Math.round(currentFontSize)} px</span>
        </div>

        {/* Continuous Range Slider for Font Size (8px to 300px) */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="8"
            max="300"
            step="1"
            value={Math.round(currentFontSize)}
            onChange={(e) => onUpdate('fontSize', parseInt(e.target.value) || 12)}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Quick Size Stepper and Number Box */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
          <div className="flex items-center bg-[#1C2541] border border-slate-700 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => onUpdate('fontSize', Math.max(8, currentFontSize - 2))}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="تصغير الحجم"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={Math.round(currentFontSize)}
              onChange={(e) => onUpdate('fontSize', parseInt(e.target.value) || 12)}
              className="w-12 bg-transparent text-center text-xs text-white font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdate('fontSize', currentFontSize + 2)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="تكبير الحجم"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Size Preset Badges */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[16, 24, 36, 48, 72, 96, 120, 180, 240].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onUpdate('fontSize', size)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono transition border ${
                  Math.round(currentFontSize) === size
                    ? 'bg-sky-500 text-white border-sky-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 pt-1.5 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300">السُمك (Weight)</label>
          <select
            value={properties.fontWeight || 'normal'}
            onChange={(e) => onUpdate('fontWeight', e.target.value)}
            className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="300">خفيف (Light 300)</option>
            <option value="normal">عادي (Regular 400)</option>
            <option value="600">متوسط (Medium 600)</option>
            <option value="bold">عريض (Bold 700)</option>
            <option value="900">عريض جداً (Black 900)</option>
          </select>
        </div>
      </div>

      {/* Font Styles & Alignments - Icon Only Toolbar */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">التنسيق والمحاذاة (أيقونات فقط)</label>
        <div className="flex items-center gap-1 bg-[#0B132B] p-1.5 rounded-xl border border-slate-700 justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdate('fontWeight', isBold ? 'normal' : 'bold')}
              className={`p-2 rounded-lg transition ${
                isBold ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="عريض (Bold)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate('fontStyle', isItalic ? 'normal' : 'italic')}
              className={`p-2 rounded-lg transition ${
                isItalic ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="مائل (Italic)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate('underline', !isUnderline)}
              className={`p-2 rounded-lg transition ${
                isUnderline ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="تسطير (Underline)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate('linethrough', !isLinethrough)}
              className={`p-2 rounded-lg transition ${
                isLinethrough ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="شطب (Strikethrough)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-700/80 mx-0.5" />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdate('textAlign', 'right')}
              className={`p-2 rounded-lg transition ${
                properties.textAlign === 'right' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="محاذاة لليمين"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate('textAlign', 'center')}
              className={`p-2 rounded-lg transition ${
                properties.textAlign === 'center' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="توسيط"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate('textAlign', 'left')}
              className={`p-2 rounded-lg transition ${
                properties.textAlign === 'left' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="محاذاة لليسار"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate('textAlign', 'justify')}
              className={`p-2 rounded-lg transition ${
                properties.textAlign === 'justify' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="ضبط المحاذاة (Justify)"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Colors: Text Fill & Text Background */}
      <div className="grid grid-cols-1 gap-3">
        <ColorPickerPopover
          label="لون النص (Text Color)"
          color={properties.fill || '#FFFFFF'}
          onChange={(color) => onUpdate('fill', color)}
        />

        {/* Text Gradient Presets */}
        <div className="space-y-1.5 bg-[#0B132B] p-2.5 rounded-2xl border border-slate-700/80">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>تدرج لوني للنص (Text Gradient)</span>
            <span className="text-[10px] text-sky-400 font-normal">فخامة وتأثير</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { label: 'ذهبي', stops: ['#FDE68A', '#F59E0B', '#D97706'] },
              { label: 'نيون', stops: ['#38BDF8', '#818CF8', '#C084FC'] },
              { label: 'غروب', stops: ['#F87171', '#FB923C', '#FBBF24'] },
              { label: 'زمردي', stops: ['#34D399', '#10B981', '#047857'] },
              { label: 'فضي', stops: ['#FFFFFF', '#CBD5E1', '#64748B'] },
              { label: 'عنابي', stops: ['#F43F5E', '#BE123C', '#881337'] }
            ].map((g, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onUpdate('textGradient', g.stops)}
                className="px-2 py-1.5 rounded-xl border border-slate-700 hover:border-sky-400 text-[11px] font-bold text-white flex items-center justify-between transition hover:scale-105 shadow-xs"
                style={{
                  background: `linear-gradient(135deg, ${g.stops.join(', ')})`
                }}
              >
                <span className="drop-shadow-md text-white">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        <ColorPickerPopover
          label="خلفية النص (Highlight Background)"
          color={properties.textBackgroundColor || 'transparent'}
          onChange={(color) => onUpdate('textBackgroundColor', color)}
          allowTransparent={true}
        />
      </div>

      {/* Curved / Arc Text Slider */}
      <div className="space-y-1.5 bg-[#0B132B] p-2.5 rounded-2xl border border-slate-700/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span>تقويس وانحناء النص (Curved / Arc Text)</span>
          <span className="font-mono text-sky-400 font-bold text-xs">{properties.curve || 0}°</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          step="5"
          value={properties.curve || 0}
          onChange={(e) => onUpdate('curve', parseInt(e.target.value) || 0)}
          className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
          <span>قوس لأسفل (-100)</span>
          <button
            type="button"
            onClick={() => onUpdate('curve', 0)}
            className="text-amber-400 hover:underline"
          >
            مستقيم (0)
          </button>
          <span>قوس لأعلى (+100)</span>
        </div>
      </div>

      {/* Spacing Sliders */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>تباعد الأسطر (Line Height)</span>
            <span className="font-mono text-sky-400">{properties.lineHeight?.toFixed(1) || '1.2'}</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={properties.lineHeight || 1.2}
            onChange={(e) => onUpdate('lineHeight', parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>تباعد الحروف (Letter Spacing)</span>
            <span className="font-mono text-sky-400">{properties.charSpacing || 0}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="300"
            step="10"
            value={properties.charSpacing || 0}
            onChange={(e) => onUpdate('charSpacing', parseInt(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>الشفافية (Opacity)</span>
            <span className="font-mono text-sky-400">{Math.round((properties.opacity ?? 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={properties.opacity ?? 1}
            onChange={(e) => onUpdate('opacity', parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
