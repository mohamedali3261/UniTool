import React, { useEffect, useState } from 'react';
import { DIMENSION_PRESETS, COLOR_PALETTES } from '../../../data/presets';
import { ColorPickerPopover } from '../../Common/ColorPickerPopover';
import { PresetSilhouette } from '../../Dashboard/PresetSilhouette';
import {
  Box,
  Maximize2,
  Palette,
  Sliders,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';
import {
  cartonError,
  type CartonSize,
} from '../../../packaging/geometry';
import {
  formatCartonDims,
  formatUnitNumber,
  mmToUnit,
  unitShortLabel,
  unitToMm,
  type PackagingUnit,
} from '../../../packaging/units';

interface CanvasPropertiesProps {
  width: number;
  height: number;
  isPackaging?: boolean;
  packagingSize?: CartonSize | null;
  backgroundColor: string;
  onResizeCanvas: (width: number, height: number) => void;
  onResizeCarton?: (next: CartonSize) => void;
  onOpenCartonResizeModal?: (unit: PackagingUnit) => void;
  onSetBackgroundColor: (color: string) => void;
  onSetBackgroundGradient: (stops: string[]) => void;
}

const PAPERBOARD_STOCKS = [
  { id: 'bleached-white', ar: 'أبيض مصقول', en: 'Bleached White', color: '#ffffff' },
  { id: 'ivory-luxe', ar: 'عاجي فاخر', en: 'Luxury Ivory', color: '#f7f2e7' },
  { id: 'natural-kraft', ar: 'كرافت طبيعي', en: 'Natural Kraft', color: '#d8be98' },
  { id: 'warm-sand', ar: 'رملي دافئ', en: 'Warm Sand', color: '#eadcc9' },
  { id: 'botanical-emerald', ar: 'زمردي داكن', en: 'Botanical Green', color: '#163d34' },
  { id: 'royal-noir', ar: 'أسود مطفي', en: 'Matte Noir', color: '#171b25' },
] as const;

const QUICK_CARTON_SIZES: Array<{
  id: string;
  ar: string;
  en: string;
  size: CartonSize;
}> = [
  {
    id: 'perfume-30',
    ar: 'علبة عطر 30 مل',
    en: '30 ml Perfume Box',
    size: { height: 105, width: 55, depth: 35, glue: 12, tuck: 12 },
  },
  {
    id: 'perfume-50',
    ar: 'علبة عطر 50 مل',
    en: '50 ml Perfume Box',
    size: { height: 120, width: 65, depth: 45, glue: 14, tuck: 15 },
  },
  {
    id: 'perfume-100',
    ar: 'علبة عطر 100 مل',
    en: '100 ml Perfume Box',
    size: { height: 145, width: 80, depth: 55, glue: 15, tuck: 18 },
  },
  {
    id: 'cream-jar',
    ar: 'علبة كريم وعناية',
    en: 'Skincare Jar Box',
    size: { height: 85, width: 85, depth: 65, glue: 15, tuck: 18 },
  },
  {
    id: 'candle-box',
    ar: 'علبة شمعة عطرية',
    en: 'Scented Candle Box',
    size: { height: 110, width: 90, depth: 90, glue: 16, tuck: 20 },
  },
  {
    id: 'serum-dropper',
    ar: 'علبة سيروم / قطارة',
    en: 'Serum Dropper Box',
    size: { height: 130, width: 48, depth: 48, glue: 12, tuck: 12 },
  },
];

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const CanvasProperties: React.FC<CanvasPropertiesProps> = ({
  width,
  height,
  isPackaging,
  packagingSize,
  backgroundColor,
  onResizeCanvas,
  onResizeCarton,
  onOpenCartonResizeModal,
  onSetBackgroundColor,
  onSetBackgroundGradient,
}) => {
  const { lang, t } = useDcLang();
  const isAr = lang === 'ar';
  const roundedW = Math.round(width);
  const roundedH = Math.round(height);

  // Packaging cm/mm state (defaults to 'cm' so box properties edit directly in سم!)
  const [boxUnit, setBoxUnit] = useState<PackagingUnit>('cm');
  const [boxDraft, setBoxDraft] = useState(() => ({
    height: packagingSize ? formatUnitNumber(packagingSize.height, 'cm') : '12',
    width: packagingSize ? formatUnitNumber(packagingSize.width, 'cm') : '6.5',
    depth: packagingSize ? formatUnitNumber(packagingSize.depth, 'cm') : '4.5',
  }));

  useEffect(() => {
    if (!packagingSize) return;
    setBoxDraft({
      height: formatUnitNumber(packagingSize.height, boxUnit),
      width: formatUnitNumber(packagingSize.width, boxUnit),
      depth: formatUnitNumber(packagingSize.depth, boxUnit),
    });
  }, [packagingSize?.height, packagingSize?.width, packagingSize?.depth, boxUnit]);

  const switchBoxUnit = (next: PackagingUnit) => {
    if (next === boxUnit) return;
    setBoxDraft((prev) => {
      const conv = (raw: string) => {
        if (!raw || raw.trim() === '') return '';
        const n = Number(raw);
        if (!Number.isFinite(n)) return raw;
        return formatUnitNumber(unitToMm(n, boxUnit), next);
      };
      return {
        height: conv(prev.height),
        width: conv(prev.width),
        depth: conv(prev.depth),
      };
    });
    setBoxUnit(next);
  };

  if (isPackaging && packagingSize && onResizeCarton) {
    const hinged = packagingSize.construction === 'hinged-lid';
    const hMm =
      boxDraft.height.trim() === ''
        ? NaN
        : unitToMm(Number(boxDraft.height), boxUnit);
    const wMm =
      boxDraft.width.trim() === ''
        ? NaN
        : unitToMm(Number(boxDraft.width), boxUnit);
    const dMm =
      boxDraft.depth.trim() === ''
        ? NaN
        : unitToMm(Number(boxDraft.depth), boxUnit);

    const autoGlue = Number.isFinite(wMm)
      ? clamp(packagingSize.glue, 5, Math.min(30, wMm * 0.4))
      : packagingSize.glue;
    const autoTuck = hinged
      ? Number.isFinite(hMm)
        ? clamp(packagingSize.tuck, 5, Math.min(30, hMm * 0.7))
        : packagingSize.tuck
      : Number.isFinite(wMm) && Number.isFinite(dMm)
        ? clamp(packagingSize.tuck, 5, Math.min(30, dMm * 0.6, wMm * 0.25))
        : packagingSize.tuck;

    const nextCarton: CartonSize = {
      ...packagingSize,
      height: hMm,
      width: wMm,
      depth: dMm,
      glue: Math.round(autoGlue * 100) / 100,
      tuck: Math.round(autoTuck * 100) / 100,
    };
    const cartonIssue = cartonError(nextCarton);

    return (
      <div className="space-y-5 select-none" data-testid="packaging-properties-panel">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Box className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'خصائص العلبة والخامة' : 'Carton & Board Properties'}</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            {isAr
              ? 'عدّل مقاس العلبة بالسنتيمتر (سم) أو الملليمتر، واختر لون وخامة ورق التغليف.'
              : 'Edit carton dimensions in cm or mm and customize paperboard stock.'}
          </p>
        </div>

        {/* Carton cm / mm Live Dimensions */}
        <div className="p-4 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              {isAr ? 'مقاسات العلبة' : 'Box Dimensions'}
            </span>
            <div
              className="carton-unit-switch carton-unit-switch--compact"
              role="group"
              data-testid="props-carton-unit-toggle"
              aria-label={isAr ? 'وحدة قياس العلبة' : 'Box unit'}
            >
              {(['cm', 'mm'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={boxUnit === u}
                  onClick={() => switchBoxUnit(u)}
                >
                  {u === 'cm' ? (isAr ? 'سم' : 'cm') : isAr ? 'مم' : 'mm'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['height', hinged ? (isAr ? 'الارتفاع' : 'Height') : isAr ? 'الطول' : 'Length', hinged ? 20 : 30, hinged ? 150 : 500],
                ['width', isAr ? 'العرض' : 'Width', hinged ? 100 : 20, hinged ? 650 : 300],
                ['depth', hinged ? (isAr ? 'القاعدة' : 'Base') : isAr ? 'العمق' : 'Depth', hinged ? 100 : 10, hinged ? 650 : 150],
              ] as const
            ).map(([k, label, minMm, maxMm]) => (
              <div key={k} className="space-y-1">
                <label className="text-[10px] text-slate-400">
                  {label} ({unitShortLabel(boxUnit, isAr)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={mmToUnit(minMm, boxUnit)}
                  max={mmToUnit(maxMm, boxUnit)}
                  aria-label={`${label} (${unitShortLabel(boxUnit, isAr)})`}
                  value={boxDraft[k]}
                  onChange={(e) =>
                    setBoxDraft((prev) => ({ ...prev, [k]: e.target.value }))
                  }
                  className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>{isAr ? 'مساحة المفرود بالبيكسل:' : 'Sheet pixels:'}</span>
            <span
              dir="ltr"
              data-testid="properties-canvas-dimensions"
              className="font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-800/50 whitespace-nowrap"
            >
              {roundedW} × {roundedH} px
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={!!cartonIssue}
              onClick={() => {
                if (!cartonIssue) onResizeCarton(nextCarton);
              }}
              className="dc-carton-apply-btn flex-1"
            >
              {isAr ? 'تحديث المقاس' : 'Update Size'}
            </button>
            {onOpenCartonResizeModal && (
              <button
                type="button"
                onClick={() => onOpenCartonResizeModal(boxUnit)}
                className="dc-carton-secondary-btn"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isAr ? 'الألسنة' : 'Flaps'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Paperboard Stock & Background */}
        <div className="p-4 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Palette className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'خامة ولون كرتون العلبة' : 'Paperboard Stock & Color'}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {PAPERBOARD_STOCKS.map((stock) => (
              <button
                key={stock.id}
                type="button"
                onClick={() => onSetBackgroundColor(stock.color)}
                className="dc-paperboard-swatch"
              >
                <i style={{ backgroundColor: stock.color }} />
                <span>{isAr ? stock.ar : stock.en}</span>
              </button>
            ))}
          </div>

          <ColorPickerPopover
            label={t.cpCustomColor}
            color={backgroundColor}
            onChange={onSetBackgroundColor}
            onApplyGradient={onSetBackgroundGradient}
            allowTransparent={true}
          />
        </div>

        {/* Standard Box Sizes Switcher (only for reverse-tuck standard cartons) */}
        {!hinged && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300">
              {isAr ? 'مقاسات علب قياسية سريعة' : 'Quick Standard Carton Sizes'}
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {QUICK_CARTON_SIZES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onResizeCarton(preset.size)}
                  className="dc-quick-carton-preset"
                >
                  <div className="font-bold text-[11px]">
                    {isAr ? preset.ar : preset.en}
                  </div>
                  <div className="text-[10px] font-mono" dir="ltr">
                    {formatCartonDims(preset.size, boxUnit, isAr)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 select-none">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Maximize2 className="w-4 h-4 text-sky-400" />
          <span>{t.cpTitle}</span>
        </h3>
        <p className="text-[11px] text-slate-400">{t.cpDesc}</p>
      </div>

      {/* Canvas Dimensions */}
      <div className="p-4 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-sky-400" /> {t.cpDimensions}
          </span>
          <span
            dir="ltr"
            data-testid="properties-canvas-dimensions"
            className="font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-800/50 whitespace-nowrap shrink-0"
          >
            {roundedW} × {roundedH} px
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">{t.cpWidth}</label>
            <input
              type="number"
              min="200"
              max="4000"
              step="1"
              readOnly={!!isPackaging}
              aria-label={t.cpWidth}
              value={roundedW}
              onChange={(e) => {
                if (isPackaging) return;
                const val = Math.round(Number(e.target.value));
                if (Number.isFinite(val) && val > 0) onResizeCanvas(val, height);
              }}
              className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">{t.cpHeight}</label>
            <input
              type="number"
              min="200"
              max="4000"
              step="1"
              readOnly={!!isPackaging}
              aria-label={t.cpHeight}
              value={roundedH}
              onChange={(e) => {
                if (isPackaging) return;
                const val = Math.round(Number(e.target.value));
                if (Number.isFinite(val) && val > 0) onResizeCanvas(width, val);
              }}
              className="w-full bg-[#1C2541] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Background Color Picker & Palettes */}
      <div className="p-4 bg-[#0B132B] rounded-2xl border border-slate-800 space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Palette className="w-4 h-4 text-sky-400" />
          <span>{t.cpBgColor}</span>
        </div>

        <ColorPickerPopover
          label={t.cpCustomColor}
          color={backgroundColor}
          onChange={onSetBackgroundColor}
          onApplyGradient={onSetBackgroundGradient}
          allowTransparent={true}
        />

        {/* Quick Solid Palette */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-semibold text-slate-400">{t.cpSolidColors}</div>
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTES.solids.slice(0, 16).map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                aria-label={c}
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
            <span>{t.cpGradients}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {COLOR_PALETTES.gradients.map((g) => (
              <button
                key={g.name}
                type="button"
                onClick={() => onSetBackgroundGradient(g.stops)}
                className="h-8 px-1 rounded-xl border border-white/10 hover:scale-105 transition shadow-xs flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md"
                style={{ background: g.gradient }}
                title={isAr ? g.nameAr : g.name}
                aria-label={isAr ? g.nameAr : g.name}
              >
                <span className="truncate">{isAr ? g.nameAr : g.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Dimension Presets switcher */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="text-xs font-semibold text-slate-300">{t.cpSocialSizes}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {DIMENSION_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
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
                <div className="font-bold truncate text-[11px]">
                  {isAr ? preset.titleAr : preset.title}
                </div>
                <div className="text-[10px] text-sky-400 font-mono mt-0.5">
                  {preset.width} × {preset.height} px
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
