import React from 'react';
import { ActiveObjectProperties } from '../../../types';
import { TextProperties } from './TextProperties';
import { ShapeProperties } from './ShapeProperties';
import { ImageProperties } from './ImageProperties';
import { AlignProperties } from './AlignProperties';
import { CanvasProperties } from './CanvasProperties';
import { Sliders, Sparkles, X, ChevronLeft } from 'lucide-react';

interface PropertiesPanelProps {
  activeProperties: ActiveObjectProperties | null;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  onUpdateProperty: (key: string, value: any) => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onApplyImageFilter: (filterType: string, value?: any) => void;
  onResizeCanvas: (w: number, h: number) => void;
  onSetBackgroundColor: (color: string) => void;
  onSetBackgroundGradient: (stops: string[]) => void;
  onDeselect: () => void;
  onClosePanel?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeProperties,
  canvasWidth,
  canvasHeight,
  backgroundColor,
  onUpdateProperty,
  onAlign,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onToggleLock,
  onApplyImageFilter,
  onResizeCanvas,
  onSetBackgroundColor,
  onSetBackgroundGradient,
  onDeselect,
  onClosePanel
}) => {
  const isText =
    activeProperties?.type === 'textbox' ||
    activeProperties?.type === 'text' ||
    activeProperties?.type === 'i-text';
  const isImage = activeProperties?.type === 'image';
  const isShape =
    activeProperties?.type === 'rect' ||
    activeProperties?.type === 'circle' ||
    activeProperties?.type === 'triangle' ||
    activeProperties?.type === 'polygon' ||
    activeProperties?.type === 'line' ||
    activeProperties?.type === 'path';
  const isGroupOrIcon = activeProperties?.type === 'group' || activeProperties?.type === 'activeSelection';
  const isKnownType = isText || isImage || isShape || isGroupOrIcon;

  const isLocked = !!(
    activeProperties?.lockMovementX ||
    activeProperties?.lockMovementY ||
    activeProperties?.lockRotation
  );

  return (
    <aside
      id="editor-properties-panel"
      className="w-full md:w-56 lg:w-60 bg-[#1C2541] md:border-r border-slate-700/70 flex flex-col h-full shrink-0 select-none z-20"
    >
      {/* Panel Header */}
      <div className="h-10 px-3 border-b border-slate-700/70 flex items-center justify-between bg-[#0B132B] shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-sky-500/15 text-sky-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">
              {activeProperties ? 'خصائص العنصر' : 'خصائص الكانفاس'}
            </h3>
            <p className="text-[9px] text-slate-400 font-mono leading-none">
              {activeProperties ? activeProperties.type.toUpperCase() : `${canvasWidth} × ${canvasHeight} PX`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeProperties && (
            <button
              type="button"
              onClick={onDeselect}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
              title="إلغاء التحديد"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {onClosePanel && (
            <button
              type="button"
              onClick={onClosePanel}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
              title="طي لوحة الخصائص"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* If an active object is selected */}
        {activeProperties ? (
          <>
            {/* 1. Context Specific Editor */}
            {isText && (
              <TextProperties
                properties={activeProperties}
                onUpdate={onUpdateProperty}
              />
            )}

            {isShape && (
              <ShapeProperties
                properties={activeProperties}
                onUpdate={onUpdateProperty}
              />
            )}

            {isImage && (
              <ImageProperties
                properties={activeProperties}
                onUpdate={onUpdateProperty}
                onApplyFilter={onApplyImageFilter}
              />
            )}

            {(isGroupOrIcon || !isKnownType) && (
              <ShapeProperties
                properties={activeProperties}
                onUpdate={onUpdateProperty}
              />
            )}

            {/* 2. Global Alignment & Ordering Tools */}
            <AlignProperties
              onAlign={onAlign}
              onBringForward={onBringForward}
              onSendBackward={onSendBackward}
              onBringToFront={onBringToFront}
              onSendToBack={onSendToBack}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onToggleLock={onToggleLock}
              isLocked={isLocked}
            />
          </>
        ) : (
          /* 3. Global Canvas Properties (Size & Background) */
          <CanvasProperties
            width={canvasWidth}
            height={canvasHeight}
            backgroundColor={backgroundColor}
            onResizeCanvas={onResizeCanvas}
            onSetBackgroundColor={onSetBackgroundColor}
            onSetBackgroundGradient={onSetBackgroundGradient}
          />
        )}
      </div>
    </aside>
  );
};
