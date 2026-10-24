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
  Plus,
  Palette,
  Shuffle,
  MoreHorizontal,
  Blend
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface TextPropertiesProps {
  properties: ActiveObjectProperties;
  onUpdate: (key: string, value: any) => void;
}

/* Shared card wrapper with colored icon-chip header */
const PropCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, trailing, children }) => (
  <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xs overflow-hidden">
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-slate-800/80 bg-white/[0.02]">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`shrink-0 p-1 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</span>
        <h4 className="text-[10px] font-bold text-slate-200 truncate">{title}</h4>
      </div>
      {trailing}
    </div>
    <div className="p-2.5 space-y-2">{children}</div>
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  value_: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, value_, onChange }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
      <span>{label}</span>
      <span className="font-mono text-sky-400">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value_}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
    />
  </div>
);

export const TextProperties: React.FC<TextPropertiesProps> = ({ properties, onUpdate }) => {
  const { t } = useDcLang();
  const currentFontSize = properties.fontSize || 40;
  const isBold =
    properties.fontWeight === 'bold' ||
    properties.fontWeight === 700 ||
    properties.fontWeight === 800 ||
    properties.fontWeight === 900;
  const isItalic = properties.fontStyle === 'italic';
  const isUnderline = !!properties.underline;
  const isLinethrough = !!properties.linethrough;

  const GRADIENTS = [
    { label: t.tpGold, stops: ['#FDE68A', '#F59E0B', '#D97706'] },
    { label: t.tpNeon, stops: ['#38BDF8', '#818CF8', '#C084FC'] },
    { label: t.tpSunset, stops: ['#F87171', '#FB923C', '#FBBF24'] },
    { label: t.tpEmerald, stops: ['#34D399', '#10B981', '#047857'] },
    { label: t.tpSilver, stops: ['#FFFFFF', '#CBD5E1', '#64748B'] },
    { label: t.tpMaroon, stops: ['#F43F5E', '#BE123C', '#881337'] }
  ];

  return (
    <div className="space-y-2.5">
      {/* 1. Font family */}
      <PropCard
        title={t.tpFontFamily}
        icon={<Type className="w-3 h-3 text-sky-300" />}
        iconBg="bg-sky-500/15"
      >
        <select
          value={properties.fontFamily || 'Cairo'}
          onChange={(e) => onUpdate('fontFamily', e.target.value)}
          className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer font-medium transition hover:border-slate-600"
        >
          {POPULAR_FONTS.map((font) => (
            <option key={font.name} value={font.name}>
              {font.label}
            </option>
          ))}
        </select>

        <div className="pt-1 border-t border-slate-800/80 space-y-1">
          <label className="text-[11px] font-semibold text-slate-300">{t.tpWeight}</label>
          <select
            value={properties.fontWeight || 'normal'}
            onChange={(e) => onUpdate('fontWeight', e.target.value)}
            className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer transition hover:border-slate-600"
          >
            <option value="300">{t.tpLight}</option>
            <option value="normal">{t.tpRegular}</option>
            <option value="600">{t.tpMedium}</option>
            <option value="bold">{t.tpBold}</option>
            <option value="900">{t.tpBlack}</option>
          </select>
        </div>
      </PropCard>

      {/* 2. Font size */}
      <PropCard
        title={t.tpFontSize}
        icon={<span className="text-[10px] font-mono font-bold text-sky-300 px-0.5">{Math.round(currentFontSize)}</span>}
        iconBg="bg-sky-500/15"
      >
        <input
          type="range"
          min="8"
          max="300"
          step="1"
          value={Math.round(currentFontSize)}
          onChange={(e) => onUpdate('fontSize', parseInt(e.target.value) || 12)}
          className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        {/* Stepper + quick sizes */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-[#1C2541] border border-slate-700 rounded-xl p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onUpdate('fontSize', Math.max(8, currentFontSize - 2))}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title={t.tpSizeDown}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              value={Math.round(currentFontSize)}
              onChange={(e) => onUpdate('fontSize', parseInt(e.target.value) || 12)}
              className="w-10 bg-transparent text-center text-xs text-white font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdate('fontSize', currentFontSize + 2)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title={t.tpSizeUp}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[16, 24, 36, 48, 72, 96, 120, 180, 240].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onUpdate('fontSize', size)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono transition border shrink-0 ${
                  Math.round(currentFontSize) === size
                    ? 'bg-sky-500 text-white border-sky-400'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </PropCard>

      {/* 3. Formatting: style + align in one card */}
      <PropCard
        title={t.tpFormatting}
        icon={<Blend className="w-3 h-3 text-violet-300" />}
        iconBg="bg-violet-500/15"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onUpdate('fontWeight', isBold ? 'normal' : 'bold')}
            className={`flex-1 p-1.5 rounded-lg transition ${
              isBold ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpBoldTitle}
          >
            <Bold className="w-3.5 h-3.5 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate('fontStyle', isItalic ? 'normal' : 'italic')}
            className={`flex-1 p-1.5 rounded-lg transition ${
              isItalic ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpItalicTitle}
          >
            <Italic className="w-3.5 h-3.5 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate('underline', !isUnderline)}
            className={`flex-1 p-1.5 rounded-lg transition ${
              isUnderline ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpUnderline}
          >
            <Underline className="w-3.5 h-3.5 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate('linethrough', !isLinethrough)}
            className={`flex-1 p-1.5 rounded-lg transition ${
              isLinethrough ? 'bg-sky-500 text-white shadow-xs' : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpStrikethrough}
          >
            <Strikethrough className="w-3.5 h-3.5 mx-auto" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 pt-0.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => onUpdate('textAlign', 'right')}
            className={`p-1.5 rounded-lg transition ${
              properties.textAlign === 'right' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpAlignRight}
          >
            <AlignRight className="w-3.5 h-3.5 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate('textAlign', 'center')}
            className={`p-1.5 rounded-lg transition ${
              properties.textAlign === 'center' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpAlignCenter}
          >
            <AlignCenter className="w-3.5 h-3.5 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate('textAlign', 'left')}
            className={`p-1.5 rounded-lg transition ${
              properties.textAlign === 'left' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpAlignLeft}
          >
            <AlignLeft className="w-3.5 h-3.5 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate('textAlign', 'justify')}
            className={`p-1.5 rounded-lg transition ${
              properties.textAlign === 'justify' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={t.tpAlignJustify}
          >
            <AlignJustify className="w-3.5 h-3.5 mx-auto" />
          </button>
        </div>
      </PropCard>

      {/* 4. Colors: fill, gradients, highlight */}
      <PropCard
        title={t.tpTextColors}
        icon={<Palette className="w-3 h-3 text-emerald-300" />}
        iconBg="bg-emerald-500/15"
        trailing={<span className="text-[9px] text-emerald-400 font-normal shrink-0">{t.tpLuxury}</span>}
      >
        <ColorPickerPopover
          label={t.tpColor}
          color={properties.fill || '#FFFFFF'}
          onChange={(color) => onUpdate('fill', color)}
          onApplyGradient={(stops) => onUpdate('textGradient', stops)}
        />

        <div className="grid grid-cols-3 gap-1.5">
          {GRADIENTS.map((g, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onUpdate('textGradient', g.stops)}
              className="px-1 py-1.5 rounded-lg border border-slate-700 hover:border-sky-400 text-[10px] font-bold text-white flex items-center justify-center transition hover:scale-105 shadow-xs"
              style={{ background: `linear-gradient(135deg, ${g.stops.join(', ')})` }}
            >
              <span className="drop-shadow-md text-white truncate">{g.label}</span>
            </button>
          ))}
        </div>

        <ColorPickerPopover
          label={t.tpHighlight}
          color={properties.textBackgroundColor || 'transparent'}
          onChange={(color) => onUpdate('textBackgroundColor', color)}
          allowTransparent={true}
        />
      </PropCard>

      {/* 5. Curve text */}
      <PropCard
        title={t.tpCurve}
        icon={<Shuffle className="w-3 h-3 text-amber-300" />}
        iconBg="bg-amber-500/15"
        trailing={<span className="text-[10px] font-mono text-amber-300 font-bold shrink-0">{properties.curve || 0}°</span>}
      >
        <input
          type="range"
          min="-100"
          max="100"
          step="5"
          value={properties.curve || 0}
          onChange={(e) => onUpdate('curve', parseInt(e.target.value) || 0)}
          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
        <div className="flex justify-between items-center text-[10px] text-slate-500 px-0.5">
          <span>{t.tpCurveDown}</span>
          <button
            type="button"
            onClick={() => onUpdate('curve', 0)}
            className="text-amber-400 hover:underline font-semibold"
          >
            {t.tpCurveStraight}
          </button>
          <span>{t.tpCurveUp}</span>
        </div>
      </PropCard>

      {/* 6. Fine tuning: spacing + opacity */}
      <PropCard
        title={t.tpFineTune}
        icon={<MoreHorizontal className="w-3 h-3 text-rose-300" />}
        iconBg="bg-rose-500/15"
      >
        <SliderRow
          label={t.tpLineHeight}
          value={(properties.lineHeight?.toFixed(1) || '1.2')}
          value_={properties.lineHeight || 1.2}
          min={0.8}
          max={2.5}
          step={0.1}
          onChange={(v) => onUpdate('lineHeight', v)}
        />
        <SliderRow
          label={t.tpLetterSpacing}
          value={String(properties.charSpacing || 0)}
          value_={properties.charSpacing || 0}
          min={-50}
          max={300}
          step={10}
          onChange={(v) => onUpdate('charSpacing', Math.round(v))}
        />
        <SliderRow
          label={t.tpOpacity}
          value={`${Math.round((properties.opacity ?? 1) * 100)}%`}
          value_={properties.opacity ?? 1}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(v) => onUpdate('opacity', v)}
        />
      </PropCard>
    </div>
  );
};
