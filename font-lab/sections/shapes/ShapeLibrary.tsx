/**
 * القسم ٨ — مكتبة الأشكال والعمليات.
 * أشكال جاهزة تُضاف للحرف الحالي، عمليات منطقية (اتحاد/طرح/تقاطع/عكس)،
 * تبسيط المنحنيات وإزالة التكرار مع عدّاد للنتيجة.
 */
import { useState, type ReactNode } from 'react';
import { Shapes, Combine, Scissors, Layers, Wand2, Circle, Square, Triangle, Star, Hexagon, Diamond, Sparkle } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { SHAPE_PRESETS, excludeContours, intersectContours, subtractContours, unionContours, bboxOf } from '../../core/geometry';
import { dedupeContours, nodeStats, simplifyContours } from '../../core/outline';
import { glyphState } from '../../core/project';
import { ActionButton, Field, PanelCard, Slider } from '../../ui/controls';

const ICONS: Record<string, ReactNode> = {
  circle: <Circle size={16} />,
  square: <Square size={16} />,
  triangle: <Triangle size={16} />,
  diamond: <Diamond size={16} />,
  star: <Star size={16} />,
  hexagon: <Hexagon size={16} />,
  blob: <Sparkle size={16} />,
  sparkle: <Wand2 size={16} />,
};

export function ShapeLibrary({ onNotice }: { onNotice: (message: string) => void }) {
  const { state, dispatch, font, ar } = useFontLab();
  const [tolerance, setTolerance] = useState(6);
  const [scale, setScale] = useState(60);
  const entry = font && state.selection.glyph ? font.glyphs.get(state.selection.glyph) : null;
  const current = entry ? glyphState(state.doc, entry) : null;
  const stats = current ? nodeStats(current.contours) : { on: 0, off: 0, total: 0, contours: 0 };

  const mutate = (contours: import('../../core/fontEngine').GlyphContour[], labelAr: string, labelEn: string) => {
    if (!entry) {
      onNotice(ar ? 'اختر حرفاً أولاً من الرف.' : 'Select a glyph first.');
      return;
    }
    dispatch({ type: 'contours', name: entry.name, contours, labelAr, labelEn });
  };

  const addShape = (id: string) => {
    const preset = SHAPE_PRESETS.find((candidate) => candidate.id === id);
    if (!preset) return;
    const upm = state.doc.metrics.unitsPerEm;
    const x1 = upm * 0.08;
    const y1 = upm * 0.08;
    const x2 = x1 + (upm * scale) / 100;
    const y2 = y1 + (upm * scale) / 100;
    const contours = preset.build({ x1, y1, x2, y2 });
    mutate([...(current?.contours ?? []), ...contours], `إضافة شكل ${preset.ar}`, `Added ${preset.en}`);
    onNotice(ar ? `تمت إضافة ${preset.ar}` : `Added ${preset.en}`);
  };

  const box = current ? bboxOf(current.contours.flatMap((contour) => contour.points)) : { x1: 0, y1: 0, x2: 0, y2: 0 };

  return (
    <div className="fl-shapes">
      <PanelCard
        title={ar ? 'أشكال جاهزة' : 'Shape presets'}
        subtitle={ar ? 'تُضاف بداخل صندوق الحرف' : 'Added inside the glyph box'}
        icon={<Shapes size={15} />}
      >
        <div className="fl-shape-grid">
          {SHAPE_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => addShape(preset.id)} disabled={!entry}>
              {ICONS[preset.id] ?? <Shapes size={16} />}
              <span>{ar ? preset.ar : preset.en}</span>
            </button>
          ))}
        </div>
        <Field label={ar ? 'حجم الشكل' : 'Shape size'} hint={`${scale}%`}>
          <Slider ariaLabel={ar ? 'حجم الشكل' : 'Shape size'} min={10} max={95} value={scale} onChange={setScale} />
        </Field>
      </PanelCard>

      <PanelCard title={ar ? 'عمليات منطقية' : 'Boolean ops'} icon={<Combine size={15} />}>
        <p className="fl-hint-note">
          {ar
            ? 'العمليات تعمل بين أول مسارين محددين؛ اختر النقاط من المفتش أولاً.'
            : 'Operations run between the first two contours — select nodes in the inspector first.'}
        </p>
        <div className="fl-op-grid">
          <ActionButton
            icon={<Combine size={14} />}
            disabled={!current || current.contours.length < 2}
            onClick={() => mutate(unionContours([current!.contours]), 'اتحاد المسارات', 'Union')}
          >
            {ar ? 'اتحاد' : 'Union'}
          </ActionButton>
          <ActionButton
            icon={<Scissors size={14} />}
            disabled={!current || current.contours.length < 2}
            onClick={() => mutate(subtractContours(current!.contours, box), 'طرح', 'Subtract')}
          >
            {ar ? 'طرح' : 'Subtract'}
          </ActionButton>
          <ActionButton
            icon={<Layers size={14} />}
            disabled={!current || current.contours.length < 2}
            onClick={() => mutate(intersectContours(current!.contours, box), 'تقاطع', 'Intersect')}
          >
            {ar ? 'تقاطع' : 'Intersect'}
          </ActionButton>
          <ActionButton
            icon={<Wand2 size={14} />}
            disabled={!current || current.contours.length < 2}
            onClick={() => mutate(excludeContours(current!.contours, current!.contours.slice(1)), 'استبعاد', 'Exclude')}
          >
            {ar ? 'استبعاد' : 'Exclude'}
          </ActionButton>
        </div>
      </PanelCard>

      <PanelCard title={ar ? 'تنظيف المنحنيات' : 'Outline cleanup'} icon={<Wand2 size={15} />}>
        <Field label={ar ? 'سماحية التبسيط' : 'Simplification tolerance'} hint={`${tolerance} u`}>
          <Slider ariaLabel={ar ? 'سماحية التبسيط' : 'Simplify tolerance'} min={1} max={40} value={tolerance} onChange={setTolerance} />
        </Field>
        <div className="fl-op-row">
          <ActionButton
            icon={<Wand2 size={14} />}
            disabled={!current}
            onClick={() => {
              if (!current) return;
              const result = simplifyContours(current.contours, tolerance);
              mutate(result.contours, 'تبسيط المنحنى', 'Simplified outline');
              onNotice(ar ? `أُزيل ${result.removed} نقطة` : `Removed ${result.removed} nodes`);
            }}
          >
            {ar ? 'تبسيط' : 'Simplify'}
          </ActionButton>
          <ActionButton
            icon={<Layers size={14} />}
            disabled={!current}
            onClick={() => {
              if (!current) return;
              const result = dedupeContours(current.contours);
              mutate(result.contours, 'إزالة النقاط المكررة', 'Removed duplicates');
              onNotice(ar ? `أُزيل ${result.removed} نقطة مكررة` : `Removed ${result.removed} duplicates`);
            }}
          >
            {ar ? 'إزالة التكرار' : 'Dedupe'}
          </ActionButton>
        </div>
        <div className="fl-cleanup-stats">
          <span><b>{stats.total}</b> {ar ? 'إجمالي النقاط' : 'total nodes'}</span>
          <span><b>{stats.contours}</b> {ar ? 'مسارات' : 'contours'}</span>
        </div>
      </PanelCard>
    </div>
  );
}
