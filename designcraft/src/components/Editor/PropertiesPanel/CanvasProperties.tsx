import React from 'react';
import { DIMENSION_PRESETS, COLOR_PALETTES } from '../../../data/presets';
import { ColorPickerPopover } from '../../Common/ColorPickerPopover';
import { PresetSilhouette } from '../../Dashboard/PresetSilhouette';
import { Sliders, Sparkles, Maximize2, Palette } from 'lucide-react';

interface CanvasPropertiesProps {
  width: number;
  height: number;
  backgroundColor: string;
  onResizeCanvas: (width: number, height: number) => void;
  onSetBackgroundColor: (color: string) => void;
  onSetBackgroundGradient: (stops: string[]) => void;
}

export const CanvasProperties: React.FC<CanvasPropertiesProps> = ({
  width,
  height,
  backgroundColor,
  onResizeCanvas,
  onSetBackgroundColor,
  onSetBackgroundGradient
}) => {
  return (
    <div className="space-y-5 select-none">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Maximize2 className="w-4 h-4 text-sky-400" />
          <span>خصائص الكانفاس والتصميم</span>
        </h3>
        <p className="text-[11px] text-slate-400">انقر على أي عنصر بالتصميم للتحكم به، أو اضبط ألوان وأبعاد اللوحة من هنا</p>
      </div>

      {/* Canvas Dimensions */}
      <div className="p-4 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-sky-400" /> أبعاد اللوحة (بكسل)
          </span>
          <span className="font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/50">
            {width} × {height} px
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">العرض (Width)</label>
            <input
              type="number"
              min="200"
              max="4000"
              value={width}
              onChange={(e) => onResizeCanvas(parseInt(e.target.value) || width, height)}
              className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">الارتفاع (Height)</label>
            <input
              type="number"
              min="200"
              max="4000"
              value={height}
              onChange={(e) => onResizeCanvas(width, parseInt(e.target.value) || height)}
              className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Background Color Picker & Palettes */}
      <div className="p-4 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Palette className="w-4 h-4 text-sky-400" />
          <span>لون خلفية الكانفاس</span>
        </div>

        <ColorPickerPopover
          label="اختر لون مخصص"
          color={backgroundColor}
          onChange={onSetBackgroundColor}
          allowTransparent={true}
        />

        {/* Quick Solid Palette */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-semibold text-slate-400">ألوان موحدة سريعة:</div>
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTES.solids.slice(0, 16).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSetBackgroundColor(c)}
                className={`w-5 h-5 rounded-md transition border hover:scale-110 ${
                  backgroundColor?.toLowerCase() === c.toLowerCase()
                    ? 'border-white ring-2 ring-sky-400 scale-105'
                    : 'border-slate-700'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Quick Gradients */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>تدرجات احترافية جاهزة:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {COLOR_PALETTES.gradients.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => onSetBackgroundGradient(g.stops)}
                className="h-8 rounded-xl border border-white/10 hover:scale-105 transition shadow-xs flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md"
                style={{ background: g.gradient }}
                title={g.nameAr}
              >
                {g.nameAr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Dimension Presets switcher */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-300">أبعاد ومقاسات جاهزة منصات السوشيال:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {DIMENSION_PRESETS.filter(p => p.id !== 'custom').map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onResizeCanvas(preset.width, preset.height)}
              className={`p-2 rounded-xl border text-right transition flex items-center gap-2.5 ${
                width === preset.width && height === preset.height
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300 ring-1 ring-sky-400/50'
                  : 'bg-[#0B132B] hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <PresetSilhouette
                width={preset.width}
                height={preset.height}
                category={preset.category}
                icon={preset.icon}
                className="w-10 h-10"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-[11px]">{preset.titleAr}</div>
                <div className="text-[10px] text-sky-400 font-mono mt-0.5">{preset.width} × {preset.height} px</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
