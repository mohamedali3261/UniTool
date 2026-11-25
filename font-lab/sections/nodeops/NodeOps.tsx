/**
 * القسم ٤ — عمليات النقاط.
 * محاذاة وتوزيع وتنعيم وتثبيت على الشبكة وإدراج/حذف نقاط — كلها تعمل على
 * النقاط المحددة فعلياً في المسرح، وهي نفس الدوال المُختبرة في core/outline.
 */
import { useState } from 'react';
import {
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Waves, Grid2x2, Plus, Minus, Unlink2,
} from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { parseNodeKey } from '../../core/geometry';
import {
  alignPoints, deletePoints, distributePoints, insertPoint, smoothContours, snapPoints, toggleClosed,
} from '../../core/outline';
import { glyphState } from '../../core/project';
import { ActionButton, Field, NumberField, PanelCard, Slider, EmptyHint } from '../../ui/controls';

export function NodeOps() {
  const { state, dispatch, font, ar } = useFontLab();
  const [grid, setGrid] = useState(25);
  const [strength, setStrength] = useState(60);
  const entry = font && state.selection.glyph ? font.glyphs.get(state.selection.glyph) : null;
  const current = entry ? glyphState(state.doc, entry) : null;
  const selected = new Set(state.selection.nodes);
  const hasSelection = selected.size > 0;
  const firstKey = state.selection.nodes[0];

  const apply = (contours: import('../../core/fontEngine').GlyphContour[], labelAr: string, labelEn: string) => {
    if (!entry) return;
    dispatch({ type: 'contours', name: entry.name, contours, labelAr, labelEn });
  };

  return (
    <PanelCard
      title={ar ? 'عمليات النقاط' : 'Node operations'}
      subtitle={
        hasSelection
          ? ar
            ? `${selected.size} نقطة محددة`
            : `${selected.size} nodes selected`
          : ar
            ? 'حدد نقاطاً أولاً'
            : 'Select nodes first'
      }
      icon={<Grid2x2 size={15} />}
    >
      {!current ? (
        <EmptyHint>{ar ? 'اختر حرفاً من الرف.' : 'Pick a glyph from the rail.'}</EmptyHint>
      ) : (
        <>
          <div className="fl-nodeops-group">
            <small>{ar ? 'محاذاة أفقية' : 'Align horizontally'}</small>
            <div className="fl-op-row">
              <ActionButton disabled={!hasSelection} title="left" onClick={() => apply(alignPoints(current.contours, selected, 'x', 'min'), 'محاذاة يسار', 'Align left')} icon={<AlignHorizontalJustifyStart size={14} />} />
              <ActionButton disabled={!hasSelection} title="center" onClick={() => apply(alignPoints(current.contours, selected, 'x', 'center'), 'توسيط أفقي', 'Align center')} icon={<AlignHorizontalJustifyCenter size={14} />} />
              <ActionButton disabled={!hasSelection} title="right" onClick={() => apply(alignPoints(current.contours, selected, 'x', 'max'), 'محاذاة يمين', 'Align right')} icon={<AlignHorizontalJustifyEnd size={14} />} />
            </div>
          </div>

          <div className="fl-nodeops-group">
            <small>{ar ? 'محاذاة رأسية' : 'Align vertically'}</small>
            <div className="fl-op-row">
              <ActionButton disabled={!hasSelection} title="top" onClick={() => apply(alignPoints(current.contours, selected, 'y', 'max'), 'محاذاة أعلى', 'Align top')} icon={<AlignVerticalJustifyStart size={14} />} />
              <ActionButton disabled={!hasSelection} title="middle" onClick={() => apply(alignPoints(current.contours, selected, 'y', 'center'), 'توسيط رأسي', 'Align middle')} icon={<AlignVerticalJustifyCenter size={14} />} />
              <ActionButton disabled={!hasSelection} title="bottom" onClick={() => apply(alignPoints(current.contours, selected, 'y', 'min'), 'محاذاة أسفل', 'Align bottom')} icon={<AlignVerticalJustifyEnd size={14} />} />
            </div>
          </div>

          <div className="fl-nodeops-group">
            <small>{ar ? 'توزيع وتنعيم' : 'Distribute & smooth'}</small>
            <div className="fl-op-row">
              <ActionButton
                disabled={selected.size < 3}
                icon={<AlignHorizontalDistributeCenter size={14} />}
                onClick={() => apply(distributePoints(current.contours, selected, 'x'), 'توزيع أفقي', 'Distribute horizontally')}
              >
                x
              </ActionButton>
              <ActionButton
                disabled={selected.size < 3}
                icon={<AlignVerticalDistributeCenter size={14} />}
                onClick={() => apply(distributePoints(current.contours, selected, 'y'), 'توزيع رأسي', 'Distribute vertically')}
              >
                y
              </ActionButton>
              <ActionButton
                icon={<Waves size={14} />}
                onClick={() => apply(smoothContours(current.contours, selected, strength / 100), 'تنعيم المنحنى', 'Smoothed curve')}
              >
                {ar ? 'تنعيم' : 'Smooth'}
              </ActionButton>
            </div>
            <Field label={ar ? 'قوة التنعيم' : 'Smoothing strength'} hint={`${strength}%`}>
              <Slider ariaLabel={ar ? 'قوة التنعيم' : 'Smoothing strength'} min={10} max={95} value={strength} onChange={setStrength} />
            </Field>
          </div>

          <div className="fl-nodeops-group">
            <small>{ar ? 'شبكة ونقاط' : 'Grid & nodes'}</small>
            <div className="fl-grid-row">
              <NumberField ariaLabel={ar ? 'حجم الشبكة' : 'Grid size'} value={grid} min={1} max={200} onChange={setGrid} />
              <ActionButton
                icon={<Grid2x2 size={14} />}
                onClick={() => apply(snapPoints(current.contours, selected, grid), 'تثبيت على الشبكة', 'Snapped to grid')}
              >
                {ar ? 'تثبيت' : 'Snap'}
              </ActionButton>
            </div>
            <div className="fl-op-row">
              <ActionButton
                icon={<Plus size={14} />}
                onClick={() => {
                  const parsed = firstKey ? parseNodeKey(firstKey) : { contourIndex: 0, pointIndex: 0 };
                  apply(insertPoint(current.contours, parsed.contourIndex, parsed.pointIndex), 'إدراج نقطة', 'Inserted node');
                }}
              >
                {ar ? 'إدراج نقطة' : 'Insert node'}
              </ActionButton>
              <ActionButton
                icon={<Minus size={14} />}
                disabled={!hasSelection}
                tone="danger"
                onClick={() => {
                  apply(deletePoints(current.contours, selected), 'حذف نقاط', 'Deleted nodes');
                  dispatch({ type: 'selectNodes', nodes: [] });
                }}
              >
                {ar ? 'حذف المحدد' : 'Delete selected'}
              </ActionButton>
              <ActionButton
                icon={<Unlink2 size={14} />}
                onClick={() => apply(toggleClosed(current.contours, state.selection.contour ?? 0), 'فتح/غلق المسار', 'Toggled contour')}
              >
                {ar ? 'فتح/غلق المسار' : 'Open/close path'}
              </ActionButton>
            </div>
          </div>
        </>
      )}
    </PanelCard>
  );
}
