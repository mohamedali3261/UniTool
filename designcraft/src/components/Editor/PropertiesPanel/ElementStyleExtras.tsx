import { useDcLang } from '../../../hooks/useDcLang';
import type { ActiveObjectProperties } from '../../../types';
import { elementKind, BLEND_MODES } from '../../../utils/elementStyle';
export function ElementStyleExtras({
  properties: p,
  onUpdate,
}: {
  properties: ActiveObjectProperties;
  onUpdate: (key: string, value: any) => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === 'ar',
    kind = elementKind(p.type);
  const style = (value: Record<string, any>) => onUpdate('objectStyle', value);
  const label = (a: string, e: string) => (ar ? a : e);
  return (
    <section className="dc-element-extras" data-style-kind={kind}>
      <h4>
        {kind === 'text'
          ? label('لمسات النص', 'Text finishing')
          : kind === 'image'
            ? label('دمج الصورة وظلالها', 'Image blending & shadows')
            : kind === 'group'
              ? label('تنسيق المجموعة', 'Group styling')
              : kind === 'line'
                ? label('تنسيق الخط والمسار', 'Line & path styling')
                : kind === 'shape'
                  ? label('حدود الشكل وتأثيراته', 'Shape edges & effects')
                  : label('تأثيرات العنصر', 'Object effects')}
      </h4>
      {kind === 'group' && (
        <>
          <p>
            {label(
              'تغيير اللون يشمل العناصر القابلة للتلوين داخل المجموعة، وليس الصور.',
              'Recolor paintable children, not raster images.',
            )}
          </p>
          <label>
            {label('لون عناصر المجموعة', 'Group elements color')}
            <input
              type="color"
              aria-label={label('لون عناصر المجموعة', 'Group elements color')}
              defaultValue="#0284c7"
              onChange={(e) => onUpdate('groupColor', e.target.value)}
            />
          </label>
        </>
      )}
      {kind === 'text' && (
        <>
          <div className="dc-crop-presets">
            {[
              [
                label('عنوان قوي', 'Bold headline'),
                {
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  charSpacing: 0,
                },
              ],
              [
                label('فقرة مريحة', 'Readable paragraph'),
                {
                  fontSize: 28,
                  fontWeight: 400,
                  lineHeight: 1.65,
                  charSpacing: 0,
                },
              ],
              [
                label('تسمية صغيرة', 'Small caption'),
                {
                  fontSize: 18,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  charSpacing: 60,
                },
              ],
            ].map(([name, value]) => (
              <button
                type="button"
                key={String(name)}
                onClick={() => style(value as Record<string, any>)}
              >
                {String(name)}
              </button>
            ))}
          </div>
          <label>
            {label('سمك حدود الحروف', 'Text outline width')}
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={p.strokeWidth || 0}
              onChange={(e) =>
                style({
                  strokeWidth: Number(e.target.value),
                  stroke: p.stroke || '#ffffff',
                  paintFirst: 'stroke',
                })
              }
            />
          </label>
        </>
      )}
      {['line', 'shape'].includes(kind) && (
        <>
          <div className="dc-crop-presets">
            {[
              [label('متصل', 'Solid'), null],
              [label('متقطع', 'Dashed'), [10, 6]],
              [label('نقاط', 'Dotted'), [1, 5]],
            ].map(([name, dash]) => (
              <button
                type="button"
                key={String(name)}
                aria-pressed={
                  JSON.stringify(p.strokeDashArray || null) ===
                  JSON.stringify(dash)
                }
                onClick={() =>
                  style({
                    strokeDashArray: dash,
                    strokeWidth: p.strokeWidth || 2,
                    stroke: p.stroke || '#334155',
                    strokeLineCap:
                      Array.isArray(dash) && dash[0] === 1 ? 'round' : 'butt',
                  })
                }
              >
                {String(name)}
              </button>
            ))}
          </div>
          <label>
            {label('سُمك ثابت عند التكبير', 'Keep border weight when scaling')}
            <input
              type="checkbox"
              checked={!!p.strokeUniform}
              onChange={(e) => style({ strokeUniform: e.target.checked })}
            />
          </label>
        </>
      )}
      {kind === 'line' && (
        <label>
          {label('نهاية الخط', 'Line cap')}
          <select
            aria-label={label('نهاية الخط', 'Line cap')}
            value={p.strokeLineCap || 'butt'}
            onChange={(e) => style({ strokeLineCap: e.target.value })}
          >
            <option value="butt">{label('مستقيمة', 'Flat')}</option>
            <option value="round">{label('دائرية', 'Round')}</option>
            <option value="square">{label('مربعة', 'Square')}</option>
          </select>
        </label>
      )}
      {p.type !== 'activeSelection' && (
        <>
          <label>
            {label('مزج الألوان', 'Blend mode')}
            <select
              aria-label={label('مزج الألوان', 'Blend mode')}
              value={p.globalCompositeOperation || 'source-over'}
              onChange={(e) =>
                style({ globalCompositeOperation: e.target.value })
              }
            >
              {BLEND_MODES.map((mode, i) => (
                <option key={mode} value={mode}>
                  {ar
                    ? ['عادي', 'ضرب', 'إضاءة', 'تراكب', 'تغميق', 'تفتيح'][i]
                    : mode}
                </option>
              ))}
            </select>
          </label>
          <div className="dc-crop-presets">
            <button
              type="button"
              onClick={() =>
                style({
                  shadow: {
                    color: 'rgba(0,0,0,0.22)',
                    blur: 18,
                    offsetX: 0,
                    offsetY: 6,
                  },
                })
              }
            >
              {label('ظل ناعم', 'Soft shadow')}
            </button>
            <button
              type="button"
              onClick={() =>
                style({
                  shadow: {
                    color: 'rgba(0,0,0,0.4)',
                    blur: 0,
                    offsetX: 6,
                    offsetY: 6,
                  },
                })
              }
            >
              {label('ظل حاد', 'Hard shadow')}
            </button>
            <button type="button" onClick={() => style({ shadow: null })}>
              {label('إزالة الظل', 'Remove shadow')}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
