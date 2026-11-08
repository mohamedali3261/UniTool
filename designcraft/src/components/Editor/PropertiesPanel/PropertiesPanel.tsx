import {ElementStyleExtras} from './ElementStyleExtras';
import {elementKind} from '../../../utils/elementStyle';
import './properties-panel.css';
import React from 'react';
import { ActiveObjectProperties } from '../../../types';
import { TextProperties } from './TextProperties';
import { ShapeProperties } from './ShapeProperties';
import { ImageProperties } from './ImageProperties';
import { AlignProperties } from './AlignProperties';
import { CanvasProperties } from './CanvasProperties';
import type { CartonSize } from '../../../packaging/geometry';
import type { PackagingUnit } from '../../../packaging/units';
import { X, ChevronLeft, Type, Image as ImageIcon, Shapes, Layers, Palette } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface PropertiesPanelProps {
  onStartCrop: () => void;
  activeProperties: ActiveObjectProperties | null;
  canvasWidth: number;
  canvasHeight: number;
  isPackaging?: boolean;
  packagingSize?: CartonSize | null;
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
  onResizeCarton?: (next: CartonSize) => void;
  onOpenCartonResizeModal?: (unit: PackagingUnit) => void;
  onSetBackgroundColor: (color: string) => void;
  onSetBackgroundGradient: (stops: string[]) => void;
  onDeselect: () => void;
  onClosePanel?: () => void;
  onResetTextFormatting?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeProperties, onStartCrop,
  canvasWidth,
  canvasHeight,
  isPackaging,
  packagingSize,
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
  onResizeCarton,
  onOpenCartonResizeModal,
  onSetBackgroundColor,
  onSetBackgroundGradient,
  onDeselect,
  onClosePanel, onResetTextFormatting
}) => {
  const { t, lang } = useDcLang();
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
    activeProperties?.type === 'path' || activeProperties?.type === 'ellipse' || activeProperties?.type === 'polyline';
  const isGroupOrIcon = activeProperties?.type === 'group' || activeProperties?.type === 'activeSelection';

  const isLocked = !!(
    activeProperties?.lockMovementX ||
    activeProperties?.lockMovementY ||
    activeProperties?.lockRotation
  );

  // Type-aware header badge: icon + color per selection kind
  const heading = (() => {
    if (isText) return { Icon: Type, cls: 'bg-sky-500/15 text-sky-300' };
    if (isImage) return { Icon: ImageIcon, cls: 'bg-emerald-500/15 text-emerald-300' };
    if (isShape) return { Icon: Shapes, cls: 'bg-amber-500/15 text-amber-300' };
    if (isGroupOrIcon) return { Icon: Layers, cls: 'bg-violet-500/15 text-violet-300' };
    if (activeProperties) return { Icon: Shapes, cls: 'bg-amber-500/15 text-amber-300' };
    return { Icon: Palette, cls: 'bg-sky-500/15 text-sky-300' };
  })();

  return (
    <aside
      id="editor-properties-panel"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="w-full max-w-full min-w-0 md:w-64 lg:w-72 dc-properties bg-[#101a30] md:border-l border-slate-700/70 flex flex-col h-full shrink-0 select-none z-20"
    >
      {/* Panel Header */}
      <div className="min-h-14 py-2 px-3 border-b border-slate-700/70 flex items-center justify-between bg-[#0B132B] shrink-0">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md ${heading.cls}`}>
            <heading.Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">
              {activeProperties ? `${t.propsElement} · ${{text:lang==='ar'?'نص':'Text',image:lang==='ar'?'صورة':'Image',line:lang==='ar'?'خط':'Line',group:lang==='ar'?'مجموعة':'Group',shape:lang==='ar'?'شكل':'Shape',object:lang==='ar'?'عنصر':'Object'}[elementKind(activeProperties.type)]}` : t.propsCanvas}
            </h3>
            <p dir="ltr" className="text-[9px] text-slate-400 font-mono leading-none">
              {activeProperties ? (isText ? (lang === 'ar' ? 'نص قابل للتعديل' : 'Editable text') : isImage ? (lang === 'ar' ? 'صورة' : 'Image') : isGroupOrIcon ? (lang === 'ar' ? 'مجموعة عناصر' : 'Object group') : (lang === 'ar' ? 'شكل' : 'Shape')) : `${Math.round(canvasWidth)} × ${Math.round(canvasHeight)} px`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeProperties && (
            <button
              type="button"
              onClick={onDeselect}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
              title={t.propsDeselect}
              aria-label={t.propsDeselect}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {onClosePanel && (
            <button
              type="button"
              onClick={onClosePanel}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
              title={t.propsCollapse}
              aria-label={t.propsCollapse}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div className="properties-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-4">
        <p className="rounded-xl border border-slate-600/50 bg-slate-900/60 p-2.5 text-xs leading-relaxed text-slate-300">{activeProperties ? (lang === 'ar' ? 'عدّل مظهر العنصر هنا. تغييراتك قابلة للتراجع باستخدام Ctrl + Z.' : 'Style the selected object here. Undo changes with Ctrl + Z.') : (lang === 'ar' ? 'حدد عنصرًا لتعديل مظهره، أو اضبط مقاس اللوحة وخلفيتها أدناه.' : 'Select an object to style it, or adjust the canvas size and background below.')}</p>
        {activeProperties && <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onDuplicate} className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-xs text-white">{lang === 'ar' ? 'تكرار العنصر' : 'Duplicate object'}</button>
          <button type="button" aria-pressed={isLocked} onClick={onToggleLock} className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-xs text-white">{isLocked ? (lang === 'ar' ? 'إلغاء القفل' : 'Unlock object') : (lang === 'ar' ? 'قفل العنصر' : 'Lock object')}</button>
        </div>}
        {/* If an active object is selected */}
        {activeProperties ? (
          <>
            {/* 1. Context Specific Editor */}
            {isText && (
              <TextProperties
                properties={activeProperties}
                onUpdate={onUpdateProperty}
                onResetFormatting={onResetTextFormatting}
              />
            )}

            {isShape && (
              <ShapeProperties
                properties={activeProperties}
                onUpdate={onUpdateProperty}
              />
            )}

            {isImage && <section className="dc-element-extras" aria-label={lang === 'ar' ? 'قص الصورة' : 'Crop image'}>
              <h4>{lang === 'ar' ? 'قص الصورة' : 'Crop image'}</h4>
              <button type="button" className="dc-start-crop" disabled={isLocked} onClick={onStartCrop}>{lang === 'ar' ? 'قص الصورة' : 'Crop image'}</button>
            </section>}
            {isImage && (
              <ImageProperties
                properties={activeProperties}
                onUpdate={onUpdateProperty}
                onApplyFilter={onApplyImageFilter}
              />
            )}

            <ElementStyleExtras properties={activeProperties} onUpdate={onUpdateProperty}/>

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
            isPackaging={isPackaging}
            packagingSize={packagingSize}
            backgroundColor={backgroundColor}
            onResizeCanvas={onResizeCanvas}
            onResizeCarton={onResizeCarton}
            onOpenCartonResizeModal={onOpenCartonResizeModal}
            onSetBackgroundColor={onSetBackgroundColor}
            onSetBackgroundGradient={onSetBackgroundGradient}
          />
        )}
      </div>
    </aside>
  );
};
