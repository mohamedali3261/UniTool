import React, { useState } from 'react';
import { COLOR_PALETTES } from '../../data/presets';
import { Pipette } from 'lucide-react';

interface ColorPickerPopoverProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  label,
  color,
  onChange,
  allowTransparent = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
        <span>{label}</span>
        <span className="font-mono uppercase text-[11px] text-slate-400">{color || 'Transparent'}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2.5 p-2 bg-[#0B132B] border border-slate-700/80 hover:border-sky-500 rounded-xl transition text-left text-xs"
        >
          <div
            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner shrink-0"
            style={{
              backgroundColor: color === 'transparent' || !color ? 'transparent' : color,
              backgroundImage:
                color === 'transparent' || !color
                  ? 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 8px 8px'
                  : 'none'
            }}
          />
          <span className="truncate text-slate-200 font-mono">{color || 'Transparent'}</span>
        </button>

        <label className="relative p-2.5 bg-[#0B132B] border border-slate-700/80 hover:border-sky-500 rounded-xl cursor-pointer transition text-slate-300 hover:text-sky-400 shrink-0">
          <Pipette className="w-4 h-4" />
          <input
            type="color"
            value={color && color.startsWith('#') ? color : '#38BDF8'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 left-0 right-0 z-50 p-3 bg-[#1C2541] border border-slate-700 rounded-2xl shadow-2xl space-y-3">
            <div className="text-xs font-semibold text-slate-300">الباليت السريع / Quick Palette</div>

            <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
              {allowTransparent && (
                <button
                  type="button"
                  title="شفاف / Transparent"
                  onClick={() => {
                    onChange('transparent');
                    setIsOpen(false);
                  }}
                  className={`w-6 h-6 rounded-md border transition relative overflow-hidden ${
                    color === 'transparent' ? 'ring-2 ring-sky-400 border-white' : 'border-slate-600'
                  }`}
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#475569 0% 25%, #1e293b 0% 50%) 50% / 6px 6px'
                  }}
                />
              )}
              {COLOR_PALETTES.solids.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => {
                    onChange(c);
                    setIsOpen(false);
                  }}
                  className={`w-6 h-6 rounded-md border transition ${
                    color?.toLowerCase() === c.toLowerCase()
                      ? 'ring-2 ring-sky-400 scale-110 border-white shadow-lg'
                      : 'border-black/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Integrated Gradients */}
            <div className="pt-2 border-t border-slate-700/80 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300">تدرجات لولبية مدمجة / Merged Gradients</div>
              <div className="grid grid-cols-6 gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {COLOR_PALETTES.gradients.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    title={g.nameAr}
                    onClick={() => {
                      onChange(g.stops[0]);
                      setIsOpen(false);
                    }}
                    className="w-full h-6 rounded-md border border-slate-700 hover:scale-105 transition shadow-xs"
                    style={{ background: g.gradient }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700 flex items-center gap-2">
              <input
                type="text"
                value={color || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 bg-[#0B132B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition"
              >
                تطبيق
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
