import React, { useState } from 'react';
import { ActiveObjectProperties } from '../../../types';
import {
  FlipHorizontal,
  FlipVertical,
  Sparkles,
  Eye,
  EyeOff,
  Scissors,
  Crop,
  RotateCcw,
  Blend,
  Layers,
  SunMedium,
  CheckCircle2
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface ImagePropertiesProps {
  properties: ActiveObjectProperties;
  onUpdate: (key: string, value: any) => void;
  onApplyFilter: (filterType: string, value?: any) => void;
}

export const ImageProperties: React.FC<ImagePropertiesProps> = ({
  properties,
  onUpdate,
  onApplyFilter
}) => {
  const { t } = useDcLang();
  const [activeTab, setActiveTab] = useState<'softFade' | 'corners' | 'hardCrop' | 'style' | 'filters'>('softFade');

  // Soft Fade values (0 - 100 percentage)
  const fadeTop = properties.fadeTop ?? 0;
  const fadeBottom = properties.fadeBottom ?? 0;
  const fadeLeft = properties.fadeLeft ?? 0;
  const fadeRight = properties.fadeRight ?? 0;
  const fadeRadial = properties.fadeRadial ?? 0;
  const hasAnyFade = fadeTop > 0 || fadeBottom > 0 || fadeLeft > 0 || fadeRight > 0 || fadeRadial > 0;

  // Corner radii
  const rTL = properties.clipCornerTL ?? 0;
  const rTR = properties.clipCornerTR ?? 0;
  const rBR = properties.clipCornerBR ?? 0;
  const rBL = properties.clipCornerBL ?? 0;

  // Inset crops
  const cropT = properties.cropTop ?? 0;
  const cropB = properties.cropBottom ?? 0;
  const cropL = properties.cropLeft ?? 0;
  const cropR = properties.cropRight ?? 0;

  const hasBorders = properties.hasBorders !== false;
  const maxDimension = Math.max(properties.width || 400, properties.height || 400);
  const maxRadius = Math.round(maxDimension / 2);
  const maxCrop = Math.round(maxDimension * 0.45);

  const handleResetAllFades = () => {
    onUpdate('fadeTop', 0);
    onUpdate('fadeBottom', 0);
    onUpdate('fadeLeft', 0);
    onUpdate('fadeRight', 0);
    onUpdate('fadeRadial', 0);
  };

  const handleAllCornersChange = (val: number) => {
    onUpdate('clipCornerTL', val);
    onUpdate('clipCornerTR', val);
    onUpdate('clipCornerBR', val);
    onUpdate('clipCornerBL', val);
  };

  const handleResetCorners = () => {
    onUpdate('clipCornerTL', 0);
    onUpdate('clipCornerTR', 0);
    onUpdate('clipCornerBR', 0);
    onUpdate('clipCornerBL', 0);
  };

  const handleResetHardCrops = () => {
    onUpdate('cropTop', 0);
    onUpdate('cropBottom', 0);
    onUpdate('cropLeft', 0);
    onUpdate('cropRight', 0);
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* 1. Main Feature Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#070D1E] rounded-xl border border-slate-800 text-[11px] font-bold text-center">
        <button
          type="button"
          onClick={() => setActiveTab('softFade')}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
            activeTab === 'softFade'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Blend className="w-3.5 h-3.5" />
          <span>{t.ipFade}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('corners')}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
            activeTab === 'corners'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>{t.ipCorners}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
            activeTab === 'style'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.ipBorder}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('filters')}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
            activeTab === 'filters'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.ipFilters}</span>
        </button>
      </div>

      {/* 2. TAB: SOFT GRADIENT EDGE FADE (الإخفاء الجزئي والتلاشي التدريجي) */}
      {activeTab === 'softFade' && (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Blend className="w-4 h-4 text-sky-400" />
              <span>{t.ipFadeDesc}</span>
            </div>
            {hasAnyFade && (
              <button
                type="button"
                onClick={handleResetAllFades}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.ipClearFade}</span>
              </button>
            )}
          </div>

          <div className="bg-[#0B132B] p-2.5 rounded-xl border border-sky-950/60 text-[11px] text-slate-300 leading-relaxed">
            {t.ipFadeExplanation}
          </div>

          {/* Quick Presets for Partial Fade */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400">{t.ipFadePresets}</label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  onUpdate('fadeTop', 0);
                  onUpdate('fadeBottom', 45);
                  onUpdate('fadeLeft', 0);
                  onUpdate('fadeRight', 0);
                  onUpdate('fadeRadial', 0);
                }}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-200 hover:text-white transition text-center"
              >
                {t.ipFadeBottom}
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdate('fadeTop', 35);
                  onUpdate('fadeBottom', 35);
                  onUpdate('fadeLeft', 0);
                  onUpdate('fadeRight', 0);
                  onUpdate('fadeRadial', 0);
                }}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-200 hover:text-white transition text-center"
              >
                {t.ipFadeTopBottom}
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdate('fadeTop', 0);
                  onUpdate('fadeBottom', 0);
                  onUpdate('fadeLeft', 35);
                  onUpdate('fadeRight', 35);
                  onUpdate('fadeRadial', 0);
                }}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-200 hover:text-white transition text-center"
              >
                {t.ipFadeSides}
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdate('fadeTop', 0);
                  onUpdate('fadeBottom', 0);
                  onUpdate('fadeLeft', 0);
                  onUpdate('fadeRight', 0);
                  onUpdate('fadeRadial', 50);
                }}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-200 hover:text-white transition text-center"
              >
                {t.ipFadeRadial}
              </button>
            </div>
          </div>

          {/* Individual Edge Sliders */}
          <div className="space-y-3 bg-[#0B132B]/90 p-3 rounded-xl border border-slate-800/80">
            <div className="text-xs font-semibold text-slate-200 mb-1">{t.ipFadeSliders}</div>

            {/* Top Fade */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span>{t.ipFadeTop}</span>
                </span>
                <span className="font-mono text-sky-400">{fadeTop}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="2"
                value={fadeTop}
                onChange={(e) => onUpdate('fadeTop', parseInt(e.target.value) || 0)}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            {/* Bottom Fade */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  <span>{t.ipFadeBottomEdge}</span>
                </span>
                <span className="font-mono text-indigo-400">{fadeBottom}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="2"
                value={fadeBottom}
                onChange={(e) => onUpdate('fadeBottom', parseInt(e.target.value) || 0)}
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>

            {/* Right Fade */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{t.ipFadeRight}</span>
                </span>
                <span className="font-mono text-emerald-400">{fadeRight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="2"
                value={fadeRight}
                onChange={(e) => onUpdate('fadeRight', parseInt(e.target.value) || 0)}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Left Fade */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>{t.ipFadeLeft}</span>
                </span>
                <span className="font-mono text-amber-400">{fadeLeft}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="2"
                value={fadeLeft}
                onChange={(e) => onUpdate('fadeLeft', parseInt(e.target.value) || 0)}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Radial Vignette */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>{t.ipFadeRadialFeather}</span>
                </span>
                <span className="font-mono text-purple-400">{fadeRadial}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="2"
                value={fadeRadial}
                onChange={(e) => onUpdate('fadeRadial', parseInt(e.target.value) || 0)}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: CORNER ROUNDING & CLIPPING */}
      {activeTab === 'corners' && (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Crop className="w-3.5 h-3.5" />
              <span>{t.ipCornersTitle}</span>
            </div>
            {(rTL > 0 || rTR > 0 || rBR > 0 || rBL > 0) && (
              <button
                type="button"
                onClick={handleResetCorners}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.ipSharpCorners}</span>
              </button>
            )}
          </div>

          {/* Quick Corner Presets */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleResetCorners}
              className={`p-2 rounded-xl border transition text-center ${
                rTL === 0 && rTR === 0 && rBR === 0 && rBL === 0
                  ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                  : 'bg-[#0B132B] border-slate-700/70 text-slate-300 hover:text-white'
              }`}
            >
              {t.ipSharpSquare}
            </button>

            <button
              type="button"
              onClick={() => handleAllCornersChange(24)}
              className={`p-2 rounded-xl border transition text-center ${
                rTL === 24 && rTR === 24 && rBR === 24 && rBL === 24
                  ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                  : 'bg-[#0B132B] border-slate-700/70 text-slate-300 hover:text-white'
              }`}
            >
              {t.ipSoftCard}
            </button>

            <button
              type="button"
              onClick={() => handleAllCornersChange(maxRadius)}
              className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition text-center"
            >
              {t.ipCircle}
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdate('clipCornerTL', 36);
                onUpdate('clipCornerTR', 36);
                onUpdate('clipCornerBR', 0);
                onUpdate('clipCornerBL', 0);
              }}
              className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition text-center"
            >
              {t.ipTopRounded}
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdate('clipCornerTL', 0);
                onUpdate('clipCornerTR', 0);
                onUpdate('clipCornerBR', 36);
                onUpdate('clipCornerBL', 36);
              }}
              className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition text-center"
            >
              {t.ipBottomRounded}
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdate('clipCornerTL', 40);
                onUpdate('clipCornerTR', 0);
                onUpdate('clipCornerBR', 40);
                onUpdate('clipCornerBL', 0);
              }}
              className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition text-center"
            >
              {t.ipDiagonal}
            </button>
          </div>

          {/* All Corners Slider */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{t.ipAllCorners}</span>
              <span className="font-mono text-sky-400">{rTL}px</span>
            </div>
            <input
              type="range"
              min="0"
              max={maxRadius}
              value={rTL}
              onChange={(e) => handleAllCornersChange(parseInt(e.target.value) || 0)}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Individual 4-Corner Custom Inputs */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300">{t.ipPerCorner}</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0B132B] p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{t.ipTopRight}</span>
                  <span className="font-mono text-sky-400">{rTR}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxRadius}
                  value={rTR}
                  onChange={(e) => onUpdate('clipCornerTR', parseInt(e.target.value) || 0)}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="bg-[#0B132B] p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{t.ipTopLeft}</span>
                  <span className="font-mono text-sky-400">{rTL}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxRadius}
                  value={rTL}
                  onChange={(e) => onUpdate('clipCornerTL', parseInt(e.target.value) || 0)}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="bg-[#0B132B] p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{t.ipBottomRight}</span>
                  <span className="font-mono text-sky-400">{rBR}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxRadius}
                  value={rBR}
                  onChange={(e) => onUpdate('clipCornerBR', parseInt(e.target.value) || 0)}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="bg-[#0B132B] p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>{t.ipBottomLeft}</span>
                  <span className="font-mono text-sky-400">{rBL}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxRadius}
                  value={rBL}
                  onChange={(e) => onUpdate('clipCornerBL', parseInt(e.target.value) || 0)}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: SELECTION OUTLINE & STROKE */}
      {activeTab === 'style' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Hide Selection Bounding Box / Controls Outline */}
          <div className="bg-[#0B132B] p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                {hasBorders ? <Eye className="w-4 h-4 text-sky-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
                <span>{t.ipSelectionBox}</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdate('hasBorders', !hasBorders)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  hasBorders
                    ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                    : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                {hasBorders ? t.ipSelectionVisible : t.ipSelectionHidden}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              {hasBorders
                ? t.ipSelectionVisibleDesc
                : t.ipSelectionHiddenDesc}
            </p>
          </div>

          {/* Stroke / Border Width */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>{t.ipBorderWidth}</span>
              <span className="font-mono text-sky-400">{properties.strokeWidth ?? 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={properties.strokeWidth ?? 0}
              onChange={(e) => onUpdate('strokeWidth', parseInt(e.target.value) || 0)}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Stroke Color */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t.ipBorderColor}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={properties.stroke || '#38BDF8'}
                onChange={(e) => {
                  onUpdate('stroke', e.target.value);
                  if (!properties.strokeWidth) onUpdate('strokeWidth', 2);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                value={properties.stroke || '#38BDF8'}
                onChange={(e) => onUpdate('stroke', e.target.value)}
                className="flex-1 bg-[#0B132B] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Quick Border Colors */}
          <div className="flex items-center gap-1.5">
            {['#FFFFFF', '#000000', '#0284C7', '#38BDF8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onUpdate('stroke', c);
                  if (!properties.strokeWidth) onUpdate('strokeWidth', 2);
                }}
                className="w-6 h-6 rounded-full border border-slate-600 shadow-sm transition hover:scale-110"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: FILTERS & ADJUSTMENTS */}
      {activeTab === 'filters' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Flip buttons */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">{t.ipFlipTitle}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onApplyFilter('flipX')}
                className="flex items-center justify-center gap-1.5 p-2 bg-[#0B132B] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 transition"
              >
                <FlipHorizontal className="w-4 h-4 text-sky-400" />
                <span>{t.ipFlipH}</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyFilter('flipY')}
                className="flex items-center justify-center gap-1.5 p-2 bg-[#0B132B] hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 transition"
              >
                <FlipVertical className="w-4 h-4 text-sky-400" />
                <span>{t.ipFlipV}</span>
              </button>
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>{t.ipOpacityLabel}</span>
              <span className="font-mono text-sky-400">{Math.round((properties.opacity ?? 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={properties.opacity ?? 1}
              onChange={(e) => onUpdate('opacity', parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Image Quick Filters */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.ipFiltersTitle}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => onApplyFilter('grayscale')}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition text-center"
              >
                {t.ipGrayscale}
              </button>
              <button
                type="button"
                onClick={() => onApplyFilter('sepia')}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition text-center"
              >
                {t.ipSepia}
              </button>
              <button
                type="button"
                onClick={() => onApplyFilter('invert')}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition text-center"
              >
                {t.ipInvert}
              </button>
              <button
                type="button"
                onClick={() => onApplyFilter('brightness', 0.15)}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition text-center"
              >
                {t.ipBrightness}
              </button>
              <button
                type="button"
                onClick={() => onApplyFilter('contrast', 0.2)}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition text-center"
              >
                {t.ipContrast}
              </button>
              <button
                type="button"
                onClick={() => onApplyFilter('reset')}
                className="p-2 rounded-xl bg-[#0B132B] hover:bg-rose-900/30 border border-rose-800/40 text-rose-300 transition text-center"
              >
                {t.ipResetFilters}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
