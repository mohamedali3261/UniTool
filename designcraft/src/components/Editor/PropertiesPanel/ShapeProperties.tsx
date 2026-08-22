import React from 'react';
import { ActiveObjectProperties } from '../../../types';
import { ColorPickerPopover } from '../../Common/ColorPickerPopover';

interface ShapePropertiesProps {
  properties: ActiveObjectProperties;
  onUpdate: (key: string, value: any) => void;
}

export const ShapeProperties: React.FC<ShapePropertiesProps> = ({ properties, onUpdate }) => {
  const isRect = properties.type === 'rect';

  return (
    <div className="space-y-4">
      {/* Colors: Fill and Stroke */}
      <div className="grid grid-cols-1 gap-3">
        <ColorPickerPopover
          label="لون التعبئة (Fill Color)"
          color={properties.fill || '#0284C7'}
          onChange={(color) => onUpdate('fill', color)}
          allowTransparent={true}
        />

        <ColorPickerPopover
          label="لون الإطار (Border / Stroke)"
          color={properties.stroke || '#38BDF8'}
          onChange={(color) => onUpdate('stroke', color)}
          allowTransparent={true}
        />
      </div>

      {/* Stroke Width Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>سُمك الإطار (Border Width)</span>
          <span className="font-mono text-sky-400">{properties.strokeWidth || 0} px</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={properties.strokeWidth || 0}
          onChange={(e) => onUpdate('strokeWidth', parseInt(e.target.value))}
          className="w-full accent-sky-400 cursor-pointer"
        />
      </div>

      {/* Rounded Corner Radius (if rect) */}
      {isRect && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>استدارة الحواف (Corner Radius)</span>
            <span className="font-mono text-sky-400">{properties.rx || 0} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="2"
            value={properties.rx || 0}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdate('rx', val);
              onUpdate('ry', val);
            }}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>
      )}

      {/* Opacity */}
      <div className="space-y-1.5">
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
  );
};
