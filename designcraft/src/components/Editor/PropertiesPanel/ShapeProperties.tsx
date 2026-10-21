import React from 'react';
import { ActiveObjectProperties } from '../../../types';
import { ColorPickerPopover } from '../../Common/ColorPickerPopover';
import { useDcLang } from '../../../hooks/useDcLang';
import { Droplet, Frame, Origami } from 'lucide-react';

interface ShapePropertiesProps {
  properties: ActiveObjectProperties;
  onUpdate: (key: string, value: any) => void;
}

const PropCard: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}> = ({ icon, iconBg, title, children }) => (
  <div className="rounded-2xl bg-[#0B132B]/80 border border-slate-800 shadow-xs overflow-hidden">
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-800/80 bg-white/[0.02]">
      <span className={`shrink-0 p-1 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</span>
      <h4 className="text-[10px] font-bold text-slate-200 truncate">{title}</h4>
    </div>
    <div className="p-2.5 space-y-2.5">{children}</div>
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

export const ShapeProperties: React.FC<ShapePropertiesProps> = ({ properties, onUpdate }) => {
  const { t } = useDcLang();
  const isRect = properties.type === 'rect';

  return (
    <div className="space-y-2.5">
      {/* 1. Fill & stroke colors */}
      <PropCard
        title={t.spColorsTitle}
        icon={<Droplet className="w-3 h-3 text-emerald-300" />}
        iconBg="bg-emerald-500/15"
      >
        <ColorPickerPopover
          label={t.spFill}
          color={properties.fill || '#0284C7'}
          onChange={(color) => onUpdate('fill', color)}
          allowTransparent={true}
        />

        <ColorPickerPopover
          label={t.spStroke}
          color={properties.stroke || '#38BDF8'}
          onChange={(color) => onUpdate('stroke', color)}
          allowTransparent={true}
        />
      </PropCard>

      {/* 2. Corners & stroke width (rect-capable shapes) */}
      <PropCard
        title={t.spAdjustTitle}
        icon={<Frame className="w-3 h-3 text-sky-300" />}
        iconBg="bg-sky-500/15"
      >
        <SliderRow
          label={t.spStrokeWidth}
          value={`${properties.strokeWidth || 0} px`}
          value_={properties.strokeWidth || 0}
          min={0}
          max={30}
          step={1}
          onChange={(v) => onUpdate('strokeWidth', Math.round(v))}
        />

        {isRect && (
          <SliderRow
            label={t.spCornerRadius}
            value={`${properties.rx || 0} px`}
            value_={properties.rx || 0}
            min={0}
            max={120}
            step={2}
            onChange={(v) => {
              const val = Math.round(v);
              onUpdate('rx', val);
              onUpdate('ry', val);
            }}
          />
        )}
      </PropCard>

      {/* 3. Opacity */}
      <PropCard
        title={t.spOpacity}
        icon={<Origami className="w-3 h-3 text-violet-300" />}
        iconBg="bg-violet-500/15"
      >
        <SliderRow
          label={t.spOpacity}
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
