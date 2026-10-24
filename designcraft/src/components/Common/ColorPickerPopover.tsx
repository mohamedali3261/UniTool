import React, { useEffect, useState } from 'react';
import { COLOR_PALETTES } from '../../data/presets';
import { useDcLang } from '../../hooks/useDcLang';
import { Check, Pipette } from 'lucide-react';

interface ColorPickerPopoverProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
  /** When provided, gradient swatches apply a real gradient instead of its first stop. */
  onApplyGradient?: (stops: string[]) => void;
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const isValidColor = (value: string) =>
  value === 'transparent' || HEX_RE.test(value);

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  label,
  color,
  onChange,
  allowTransparent = true,
  onApplyGradient
}) => {
  const { lang, t } = useDcLang();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(color || '');
  const [invalid, setInvalid] = useState(false);

  const isTransparent = !color || color === 'transparent';

  useEffect(() => {
    if (!isOpen) setDraft(color || '');
  }, [color, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraft(color || '');
        setInvalid(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, color]);

  const open = () => {
    setDraft(color || '');
    setInvalid(false);
    setIsOpen((prev) => !prev);
  };

  const close = () => {
    setDraft(color || '');
    setInvalid(false);
    setIsOpen(false);
  };

  const commitDraft = () => {
    const next = draft.trim();
    if (!isValidColor(next)) {
      setInvalid(true);
      return;
    }
    onChange(next);
    setIsOpen(false);
  };

  const pick = (nextColor: string) => {
    onChange(nextColor);
    close();
  };

  const applyGradient = (stops: string[]) => {
    if (onApplyGradient) {
      onApplyGradient(stops);
    } else {
      onChange(stops[0]);
    }
    close();
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
        <span>{label}</span>
        <span className="font-mono uppercase text-[11px] text-slate-400">
          {isTransparent ? t.colorTransparent : color}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={open}
          aria-expanded={isOpen}
          aria-label={label}
          className="flex-1 flex items-center gap-2.5 p-2 bg-[#0B132B] border border-slate-700/80 hover:border-sky-500 rounded-xl transition text-left text-xs"
        >
          <div
            className="w-6 h-6 rounded-lg border border-white/20 shadow-inner shrink-0"
            style={{
              backgroundColor: isTransparent ? 'transparent' : color,
              backgroundImage: isTransparent
                ? 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 8px 8px'
                : 'none'
            }}
          />
          <span className="truncate text-slate-200 font-mono">
            {isTransparent ? t.colorTransparent : color}
          </span>
        </button>

        <label
          className="relative p-2.5 bg-[#0B132B] border border-slate-700/80 hover:border-sky-500 rounded-xl cursor-pointer transition text-slate-300 hover:text-sky-400 shrink-0"
          title={label}
        >
          <Pipette className="w-4 h-4" />
          <input
            type="color"
            aria-label={label}
            value={!isTransparent && color.startsWith('#') ? color : '#38BDF8'}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute top-full mt-2 left-0 right-0 z-50 p-3 bg-[#1C2541] border border-slate-700 rounded-2xl shadow-2xl space-y-3">
            <div className="text-xs font-semibold text-slate-300">{t.colorPaletteQuick}</div>

            <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
              {allowTransparent && (
                <button
                  type="button"
                  title={t.colorTransparent}
                  aria-label={t.colorTransparent}
                  onClick={() => pick('transparent')}
                  className={`w-6 h-6 rounded-md border transition relative overflow-hidden ${
                    color === 'transparent'
                      ? 'ring-2 ring-sky-400 border-white'
                      : 'border-slate-600'
                  }`}
                  style={{
                    backgroundImage:
                      'repeating-conic-gradient(#475569 0% 25%, #1e293b 0% 50%) 50% / 6px 6px'
                  }}
                />
              )}
              {COLOR_PALETTES.solids.map((c) => {
                const isSelected = color?.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={c}
                    onClick={() => pick(c)}
                    className={`w-6 h-6 rounded-md border transition flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-sky-400 scale-110 border-white shadow-lg'
                        : 'border-black/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3 h-3 stroke-[3] ${
                          c.toUpperCase() === '#FFFFFF' ? 'text-slate-900' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-700/80 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-300">
                {t.colorGradientsTitle}
              </div>
              <div className="grid grid-cols-6 gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {COLOR_PALETTES.gradients.map((g) => {
                  const name = lang === 'ar' ? g.nameAr : g.name;
                  return (
                    <button
                      key={g.name}
                      type="button"
                      title={`${name} — ${stopsLabel(g.stops)}`}
                      aria-label={name}
                      onClick={() => applyGradient(g.stops)}
                      className="w-full h-6 rounded-md border border-slate-700 hover:scale-105 transition shadow-xs"
                      style={{ background: g.gradient }}
                    />
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-500">{t.colorGradientHint}</p>
            </div>

            <div className="pt-2 border-t border-slate-700 space-y-1.5">
              <input
                type="text"
                dir="ltr"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setInvalid(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitDraft();
                  } else if (e.key === 'Escape') {
                    close();
                  }
                }}
                placeholder="#000000"
                aria-label={label}
                aria-invalid={invalid}
                className={`w-full bg-[#0B132B] border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono text-left focus:outline-none transition ${
                  invalid
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-slate-700 focus:border-sky-500'
                }`}
              />
              <div className="flex items-center gap-2">
                {invalid && (
                  <span className="flex-1 text-[10px] text-rose-400">{t.colorInvalid}</span>
                )}
                <button
                  type="button"
                  onClick={commitDraft}
                  className="ms-auto px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium transition"
                >
                  {t.colorApply}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function stopsLabel(stops: string[]) {
  return stops.join(' → ');
}
