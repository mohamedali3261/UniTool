/**
 * القسم ٣ — مفتش الحرف.
 * بيانات الحرف الحالي (الاسم/يونيكود/العرض/الحواشي/الأشكال المتصلة)، عمليات
 * على الشكل (عكس، تكرار، قلب، ترتيب النقاط) وخصائص النقطة المحددة.
 */
import { useMemo } from 'react';
import { FlipHorizontal2, FlipVertical2, Copy, Eraser, MoveHorizontal, MoveVertical, Ruler, Shapes, RotateCcw } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { displayName, FORM_LABELS, unicodeHex } from '../../core/naming';
import { bboxOf, mirrorShape, nodeKey, translate, unionContours } from '../../core/geometry';
import { deletePoints, nodeStats } from '../../core/outline';
import { glyphState } from '../../core/project';
import { ActionButton, Field, NumberField, PanelCard, EmptyHint } from '../../ui/controls';
import type { GlyphContour } from '../../core/fontEngine';

export function Inspector() {
  const { state, dispatch, index, font, ar } = useFontLab();
  const entry = useMemo(() => index.find((item) => item.name === state.selection.glyph) || null, [index, state.selection.glyph]);
  const shape = font && entry ? font.glyphs.get(entry.name) : null;
  const current = shape ? glyphState(state.doc, shape) : null;
  const stats = current ? nodeStats(current.contours) : { on: 0, off: 0, total: 0, contours: 0 };
  const box = current ? bboxOf(current.contours.flatMap((contour) => contour.points)) : { x1: 0, y1: 0, x2: 0, y2: 0 };
  const selectedNodes =
    current?.contours.flatMap((contour, contourIndex) =>
      contour.points
        .map((point, pointIndex) => ({ point, key: nodeKey(contourIndex, pointIndex) }))
        .filter(({ key }) => state.selection.nodes.includes(key)),
    ) ?? [];

  const mutate = (contours: GlyphContour[], labelAr: string, labelEn: string) => {
    if (!entry) return;
    dispatch({ type: 'contours', name: entry.name, contours, labelAr, labelEn });
  };

  const applyTransform = (kind: 'flipX' | 'flipY' | 'dup' | 'clear' | 'round' | 'reset') => {
    if (!entry || !current) return;
    const upm = state.doc.metrics.unitsPerEm;
    switch (kind) {
      case 'flipX':
        mutate(mirrorShape(current.contours, 'y', { x: current.advanceWidth / 2, y: 0 }), 'عكس أفقي', 'Flip horizontal');
        break;
      case 'flipY':
        mutate(mirrorShape(current.contours, 'x', { x: 0, y: upm / 2 }), 'عكس رأسي', 'Flip vertical');
        break;
      case 'dup':
        mutate(
          current.contours.map((contour) => ({
            ...contour,
            points: contour.points.map((point) => ({ ...point, x: point.x + upm * 0.04 })),
          })),
          'تكرار وتزحيف', 'Duplicate and offset',
        );
        break;
      case 'round':
        mutate(
          current.contours.map((contour) => ({ ...contour, points: contour.points.map((point) => ({ ...point, x: Math.round(point.x), y: Math.round(point.y) })) })),
          'تقريب الإحداثيات',
          'Rounded coordinates',
        );
        break;
      case 'clear':
        mutate([], 'مسح الحرف', 'Cleared glyph');
        break;
      case 'reset':
        dispatch({ type: 'resetGlyph', name: entry.name });
        break;
      default:
        break;
    }
  };

  if (!entry) {
    return (
      <PanelCard title={ar ? 'الحرف الحالي' : 'Current glyph'} icon={<Shapes size={15} />}>
        <EmptyHint>{ar ? 'اختر حرفاً من الرف لعرض بياناته وتحريره.' : 'Pick a glyph from the rail to inspect and edit it.'}</EmptyHint>
      </PanelCard>
    );
  }

  return (
    <div className="fl-inspector">
      <PanelCard
        title={ar ? 'الحرف الحالي' : 'Current glyph'}
        subtitle={`${entry.name} · ${entry.points} ${ar ? 'نقطة' : 'points'}`}
        icon={<Shapes size={15} />}
        actions={
          <ActionButton onClick={() => applyTransform('reset')} title={ar ? 'إرجاع الحرف للأصل' : 'Reset to original'} icon={<RotateCcw size={13} />} />
        }
      >
        <div className="fl-glyph-hero">
          <span className="fl-glyph-hero-char" style={{ fontFamily: 'system-ui' }}>{entry.label}</span>
          <div>
            <strong>{displayName(entry, ar ? 'ar' : 'en')}</strong>
            <small>{entry.unicodeHex !== '—' ? unicodeHex(entry.unicode ?? 0) : '—'} · {entry.category}</small>
            <div className="fl-forms">
              {(['isolated', 'initial', 'medial', 'final'] as const).map((form) => (
                <span key={form} className={entry.forms[form] ? 'is-available' : ''} title={entry.forms[form] || (ar ? 'غير موجود في الخط' : 'Not in this font')}>
                  {ar ? FORM_LABELS[form].ar : FORM_LABELS[form].en}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="fl-metrics-grid">
          <Field label={ar ? 'العرض' : 'Advance'}>
            <NumberField
              ariaLabel={ar ? 'عرض الحرف' : 'Advance width'}
              value={current?.advanceWidth ?? 0}
              min={0}
              max={state.doc.metrics.unitsPerEm * 2}
              onChange={(value) => {
                if (!entry) return;
                dispatch({ type: 'contours', name: entry.name, contours: current?.contours ?? [], advance: value, labelAr: 'تعديل العرض', labelEn: 'Advance changed' });
              }}
            />
          </Field>
          <Field label={ar ? 'الحاشية اليسرى' : 'LSB'}>
            <span className="fl-readout">{Math.round(box.x1)}</span>
          </Field>
          <Field label={ar ? 'الحاشية اليمنى' : 'RSB'}>
            <span className="fl-readout">{Math.round((current?.advanceWidth ?? 0) - box.x2)}</span>
          </Field>
          <Field label={ar ? 'العرض المرئي' : 'Ink width'}>
            <span className="fl-readout">{Math.round(box.x2 - box.x1)}</span>
          </Field>
        </div>

        <div className="fl-substats">
          <span><b>{stats.contours}</b> {ar ? 'مسارات' : 'contours'}</span>
          <span><b>{stats.on}</b> {ar ? 'نقاط' : 'on-curve'}</span>
          <span><b>{stats.off}</b> {ar ? 'تحكم' : 'control'}</span>
          <span><b>{Math.round(box.y1)}…{Math.round(box.y2)}</b> y</span>
        </div>

        <div className="fl-op-row">
          <ActionButton onClick={() => applyTransform('flipX')} icon={<FlipHorizontal2 size={14} />}>{ar ? 'عكس أفقي' : 'Flip H'}</ActionButton>
          <ActionButton onClick={() => applyTransform('flipY')} icon={<FlipVertical2 size={14} />}>{ar ? 'عكس رأسي' : 'Flip V'}</ActionButton>
          <ActionButton onClick={() => applyTransform('dup')} icon={<Copy size={14} />}>{ar ? 'تكرار' : 'Duplicate'}</ActionButton>
          <ActionButton onClick={() => applyTransform('round')} icon={<Ruler size={14} />}>{ar ? 'تقريب' : 'Round'}</ActionButton>
          <ActionButton onClick={() => applyTransform('clear')} tone="danger" icon={<Eraser size={14} />}>{ar ? 'مسح' : 'Clear'}</ActionButton>
        </div>
      </PanelCard>

      <PanelCard
        title={ar ? 'النقاط المحددة' : 'Selected nodes'}
        subtitle={`${state.selection.nodes.length} ${ar ? 'نقطة محددة' : 'nodes selected'}`}
        icon={<MoveHorizontal size={15} />}
      >
        {state.selection.nodes.length === 0 || !current ? (
          <EmptyHint>{ar ? 'اسحب لتحديد نقاط، أو استخدم اللاسو. انقر نقاطاً مع Shift للإضافة.' : 'Marquee or lasso to select nodes. Shift-click to add.'}</EmptyHint>
        ) : (
          <div className="fl-node-ops">
            <div className="fl-op-row">
              <ActionButton icon={<MoveHorizontal size={14} />} onClick={() => mutate(translate(current.contours, -10, 0, new Set(state.selection.nodes)), 'نقل يسار', 'Nudge left')}>← 10</ActionButton>
              <ActionButton icon={<MoveHorizontal size={14} />} onClick={() => mutate(translate(current.contours, 10, 0, new Set(state.selection.nodes)), 'نقل يمين', 'Nudge right')}>10 →</ActionButton>
              <ActionButton icon={<MoveVertical size={14} />} onClick={() => mutate(translate(current.contours, 0, 10, new Set(state.selection.nodes)), 'نقل أعلى', 'Nudge up')}>↑ 10</ActionButton>
              <ActionButton icon={<MoveVertical size={14} />} onClick={() => mutate(translate(current.contours, 0, -10, new Set(state.selection.nodes)), 'نقل أسفل', 'Nudge down')}>↓ 10</ActionButton>
            </div>
            <ol className="fl-node-list">
              {selectedNodes.slice(0, 8).map(({ point, key }, index) => (
                <li key={key}>
                  <span>#{index + 1}</span>
                  <em>{point.onCurve ? (ar ? 'على المنحنى' : 'on-curve') : ar ? 'تحكم' : 'control'}</em>
                  <b>x {Math.round(point.x)}</b>
                  <b>y {Math.round(point.y)}</b>
                </li>
              ))}
            </ol>
            <ActionButton
              tone="danger"
              full
              icon={<Eraser size={14} />}
              onClick={() =>
                mutate(deletePoints(current.contours, new Set(state.selection.nodes)), 'حذف نقاط', 'Deleted nodes')
              }
            >
              {ar ? 'حذف النقاط المحددة' : 'Delete selected nodes'}
            </ActionButton>
          </div>
        )}
      </PanelCard>

      <PanelCard title={ar ? 'أدوات سريعة' : 'Quick tools'} icon={<Shapes size={15} />}>
        <div className="fl-op-row">
          <ActionButton
            onClick={() => mutate(unionContours([current.contours, current.contours]), 'دمج المسارات', 'Merged contours')}
            full
          >
            {ar ? 'دمج المسارات المكررة' : 'Merge duplicate contours'}
          </ActionButton>
        </div>
      </PanelCard>
    </div>
  );
}
