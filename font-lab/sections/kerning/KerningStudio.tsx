/**
 * القسم ٥ — استوديو المسافات (الكرننغ).
 * يقيس الفراغ البصري بين حرفين من نفس المنحنيات الحقيقية، يقترح قيمة، ويعرض
 * معاينة مباشرة للزوج قبل/بعد.
 */
import { useMemo, useState } from 'react';
import { ArrowLeftRight, Wand2, Plus, Trash2, Ruler } from 'lucide-react';
import { useFontLab } from '../../state/FontLabContext';
import { autoPairs, pairGap, suggestKerning } from '../../core/kerning';
import { kerningPairs } from '../../core/project';
import { displayName } from '../../core/naming';
import { contoursToPathData, contoursToRawPathData } from '../../core/outline';
import { glyphState } from '../../core/project';
import { ActionButton, Field, NumberField, PanelCard, EmptyHint } from '../../ui/controls';

export function KerningStudio() {
  const { state, dispatch, font, index, ar } = useFontLab();
  const upm = state.doc.metrics.unitsPerEm;
  const [left, setLeft] = useState<string>('');
  const [right, setRight] = useState<string>('');
  const pairs = useMemo(() => kerningPairs(state.doc), [state.doc]);
  const [notice, setNotice] = useState('');

  const arabic = index
    .filter((entry) => entry.script === 'arabic' && entry.unicode != null)
    .slice(0, 120);
  const leftName = left || arabic[0]?.name || '';
  const rightName = right || arabic[1]?.name || '';

  // in RTL a pair reads right-to-left: the left letter takes its final form and
  // the right letter its initial form, exactly what GSUB would pick mid-word
  const formName = (name: string, form: 'final' | 'initial') => {
    const entry = index.find((candidate) => candidate.name === name);
    const resolved = entry?.forms[form];
    return resolved && font?.glyphs.has(resolved) ? resolved : name;
  };
  const leftShape = font?.glyphs.get(formName(leftName, 'final'));
  const rightShape = font?.glyphs.get(formName(rightName, 'initial'));
  const leftState = leftShape ? glyphState(state.doc, leftShape) : null;
  const rightState = rightShape ? glyphState(state.doc, rightShape) : null;
  const currentKern = state.doc.kerning[`${leftName}|${rightName}`] ?? 0;

  const suggestion = useMemo(() => {
    if (!leftShape || !rightShape || !leftState) return null;
    return suggestKerning({ shape: leftShape, advance: leftState.advanceWidth }, { shape: rightShape }, upm, currentKern);
  }, [leftShape, rightShape, leftState, currentKern, upm]);

  const auto = useMemo(() => {
    if (!font) return [];
    const shapes = index
      .filter((entry) => entry.script === 'arabic' && entry.forms.final)
      .slice(0, 8)
      .map((entry) => font.glyphs.get(entry.name))
      .filter(Boolean) as Array<NonNullable<typeof leftShape>>;
    const rightShapes = index
      .filter((entry) => entry.script === 'arabic')
      .slice(2, 10)
      .map((entry) => font.glyphs.get(entry.name))
      .filter(Boolean) as Array<NonNullable<typeof rightShape>>;
    return autoPairs([...new Set([...shapes, ...rightShapes])], upm, state.doc, 6);
  }, [font, index, upm, state.doc]);

  const gap = leftShape && rightShape && leftState ? pairGap({ shape: leftShape, advance: leftState.advanceWidth }, { shape: rightShape }, currentKern) : 0;

  // frame the two outlines instead of the whole em box, so the pair fills the panel
  const viewBox = useMemo(() => {
    if (!leftShape || !rightShape || !leftState) return { x: 0, y: 0, width: upm, height: upm };
    const offset = leftState.advanceWidth + currentKern;
    const xs = [
      ...leftState.contours.flatMap((contour) => contour.points.map((point) => point.x)),
      ...rightState.contours.flatMap((contour) => contour.points.map((point) => point.x + offset)),
    ];
    const ys = [
      ...leftState.contours.flatMap((contour) => contour.points.map((point) => point.y)),
      ...rightState.contours.flatMap((contour) => contour.points.map((point) => point.y)),
    ];
    if (xs.length === 0) return { x: 0, y: 0, width: upm, height: upm };
    const pad = upm * 0.06;
    const x1 = Math.min(0, Math.min(...xs)) - pad;
    const x2 = Math.max(...xs) + pad;
    const y1 = Math.min(0, Math.min(...ys)) - pad;
    const y2 = Math.max(...ys, upm * 0.4) + pad;
    return { x: x1, y: upm - y2, width: Math.max(1, x2 - x1), height: Math.max(1, y2 - y1) };
  }, [leftShape, rightShape, leftState, currentKern, upm]);

  const setKern = (value: number) => {
    dispatch({ type: 'kerning', left: leftName, right: rightName, value });
  };

  return (
    <div className="fl-kerning">
      <PanelCard
        title={ar ? 'زوج الكرننغ' : 'Kerning pair'}
        subtitle={ar ? 'قياس الفراغ البصري بين حرفين' : 'Measured from the real outlines'}
        icon={<ArrowLeftRight size={15} />}
      >
        <div className="fl-pair-select">
          <select value={leftName} onChange={(event) => setLeft(event.target.value)} aria-label={ar ? 'الحرف الأيسر' : 'Left glyph'}>
            {arabic.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.label} · {displayName(entry, ar ? 'ar' : 'en')} · {entry.unicodeHex}
              </option>
            ))}
          </select>
          <ArrowLeftRight size={14} />
          <select value={rightName} onChange={(event) => setRight(event.target.value)} aria-label={ar ? 'الحرف الأيمن' : 'Right glyph'}>
            {arabic.map((entry) => (
              <option key={entry.name} value={entry.name}>
                {entry.label} · {displayName(entry, ar ? 'ar' : 'en')} · {entry.unicodeHex}
              </option>
            ))}
          </select>
        </div>

        {leftShape && rightShape && leftState && rightState ? (
          <>
            <div className="fl-pair-preview">
              <svg
                viewBox={`0 0 ${Math.max(1, viewBox.width)} ${Math.max(1, viewBox.height)}`}
                aria-hidden="true"
                preserveAspectRatio="xMidYMid meet"
              >
                <line x1={0} y1={viewBox.height} x2={viewBox.width} y2={viewBox.height} className="fl-pair-baseline" />
                <g transform={`translate(${-viewBox.x} ${-viewBox.y})`}>
                  <path d={contoursToRawPathData(leftState.contours)} fill="currentColor" transform={`translate(0 ${upm}) scale(1 -1)`} />
                  <g transform={`translate(${leftState.advanceWidth + currentKern} 0)`}>
                    <path d={contoursToRawPathData(rightState.contours)} fill="currentColor" transform={`translate(0 ${upm}) scale(1 -1)`} />
                  </g>
                </g>
              </svg>
            </div>

            <div className="fl-pair-cap">
              <span>{ar ? 'الأول · شكل نهائي' : 'first · final form'}</span>
              <span>{ar ? 'التالي · شكل ابتدائي' : 'next · initial form'}</span>
            </div>
            <div className="fl-pair-metrics">
              <span><Ruler size={13} /> {ar ? 'الفراغ' : 'Gap'} <b>{gap}</b></span>
              <span>{ar ? 'الحالي' : 'Current'} <b>{currentKern}</b></span>
              <span>{ar ? 'المقترح' : 'Suggested'} <b>{suggestion?.suggested ?? 0}</b></span>
            </div>

            <Field label={ar ? 'قيمة الكرننغ' : 'Kerning value'} hint={`${currentKern} u`}>
              <NumberField ariaLabel={ar ? 'قيمة الكرننغ' : 'Kerning value'} value={currentKern} min={-upm * 0.3} max={upm * 0.3} onChange={setKern} />
            </Field>

            <div className="fl-op-row">
              <ActionButton icon={<Wand2 size={14} />} onClick={() => setKern(suggestion?.suggested ?? 0)}>{ar ? 'تطبيق الاقتراح' : 'Apply suggestion'}</ActionButton>
              <ActionButton onClick={() => setKern(0)}>{ar ? 'تصفير' : 'Reset to 0'}</ActionButton>
            </div>
          </>
        ) : (
          <EmptyHint>{ar ? 'لا يوجد حرفان لهذا الزوج.' : 'Those glyphs are not available.'}</EmptyHint>
        )}
      </PanelCard>

      <PanelCard title={ar ? 'اقتراحات تلقائية' : 'Suggested pairs'} icon={<Wand2 size={15} />}>
        {auto.length === 0 ? (
          <EmptyHint>{ar ? 'المسافات مضبوطة بالفعل في الحروف الأولى.' : 'The top glyphs are already well spaced.'}</EmptyHint>
        ) : (
          <ul className="fl-suggest-list">
            {auto.map((pair) => (
              <li key={`${pair.left}-${pair.right}`}>
                <span className="fl-suggest-chars">{pair.left.replace('uni', 'U+')} / {pair.right.replace('uni', 'U+')}</span>
                <em>{pair.suggested > 0 ? '+' : ''}{pair.suggested}</em>
                <button
                  type="button"
                  onClick={() => {
                    setLeft(pair.left);
                    setRight(pair.right);
                    dispatch({ type: 'kerning', left: pair.left, right: pair.right, value: pair.suggested });
                    setNotice(ar ? 'تم تطبيق الزوج' : 'Pair applied');
                  }}
                >
                  <Plus size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {notice ? <p className="fl-hint-note">{notice}</p> : null}
      </PanelCard>

      <PanelCard title={ar ? 'الأزواج المحفوظة' : 'Saved pairs'} subtitle={`${pairs.length}`} icon={<ArrowLeftRight size={15} />}>
        {pairs.length === 0 ? (
          <EmptyHint>{ar ? 'لم تضبط أي زوج بعد.' : 'No kerning pairs yet.'}</EmptyHint>
        ) : (
          <ul className="fl-pair-list">
            {pairs.map((pair) => (
              <li key={pair.key}>
                <span>{pair.left.replace('uni', 'U+')} ‹› {pair.right.replace('uni', 'U+')}</span>
                <b>{pair.value > 0 ? '+' : ''}{pair.value}</b>
                <button type="button" aria-label={ar ? 'حذف الزوج' : 'Remove pair'} onClick={() => dispatch({ type: 'kerning', left: pair.left, right: pair.right, value: 0 })}>
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}
