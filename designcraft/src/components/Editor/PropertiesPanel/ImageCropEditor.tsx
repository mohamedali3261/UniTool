import { useEffect, useRef, useState } from 'react';
import { Crop, RotateCcw, Check } from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';
import {
  normalizeCrop,
  ratioCrop,
  moveCrop,
  type CropInsets,
} from '../../../utils/imageCrop';
import type { ActiveObjectProperties } from '../../../types';
export function ImageCropEditor({
  properties: p,
  onApply,
}: {
  properties: ActiveObjectProperties;
  onApply: (crop: CropInsets) => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === 'ar',
    w = p.imageWidth || p.width / (p.scaleX || 1),
    h = p.imageHeight || p.height / (p.scaleY || 1);
  const locked = !!(p.lockMovementX || p.lockMovementY || p.lockRotation);
  const [draft, setDraft] = useState(() => normalizeCrop(w, h, p));
  const preview = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; crop: CropInsets } | null>(null);
  useEffect(() => {
    setDraft(normalizeCrop(w, h, p));
    drag.current = null;
  }, [
    w,
    h,
    p.src,
    p.left,
    p.top,
    p.cropTop,
    p.cropBottom,
    p.cropLeft,
    p.cropRight,
  ]);
  const update = (key: keyof CropInsets, value: number) =>
    setDraft((d) => normalizeCrop(w, h, { ...d, [key]: value }));
  return (
    <details className="dc-crop-editor" open>
      <summary>
        <Crop size={16} />
        {ar ? 'قص الصورة' : 'Crop image'}
        <span>{ar ? 'بدون فقد الأصل' : 'Non-destructive'}</span>
      </summary>
      <fieldset className="dc-crop-body" disabled={locked}>
        <p>
          {ar
            ? 'اختار نسبة أو عدّل الحواف، واسحب منطقة القص. التغيير يُطبّق عند التأكيد فقط.'
            : 'Choose a ratio or adjust edges, then drag the crop. Changes apply only when confirmed.'}
        </p>
        <div
          className="dc-crop-presets"
          aria-label={ar ? 'نسب القص' : 'Crop ratios'}
        >
          {[
            ['1:1', 1],
            ['4:3', 4 / 3],
            ['3:4', 3 / 4],
            ['16:9', 16 / 9],
            ['9:16', 9 / 16],
          ].map(([label, ratio]) => (
            <button
              type="button"
              key={label}
              onClick={() => setDraft(ratioCrop(w, h, Number(ratio)))}
            >
              {label}
            </button>
          ))}
        </div>
        {p.src && (
          <div
            ref={preview}
            className="dc-crop-preview"
            style={{
              aspectRatio: w / h,
              width: `min(100%, ${(160 * w) / h}px)`,
            }}
            dir="ltr"
          >
            <img
              src={p.src}
              alt={ar ? 'معاينة قص الصورة' : 'Image crop preview'}
              draggable={false}
            />
            <div
              className="dc-crop-region"
              role="group"
              tabIndex={locked ? -1 : 0}
              aria-label={
                ar
                  ? 'منطقة القص؛ اسحب أو استخدم الأسهم للتحريك'
                  : 'Crop region; drag or use arrow keys to move'
              }
              style={{
                left: (draft.cropLeft / w) * 100 + '%',
                top: (draft.cropTop / h) * 100 + '%',
                width: ((w - draft.cropLeft - draft.cropRight) / w) * 100 + '%',
                height:
                  ((h - draft.cropTop - draft.cropBottom) / h) * 100 + '%',
              }}
              onPointerDown={(e) => {
                if (locked) return;
                e.preventDefault();
                e.currentTarget.focus();
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { x: e.clientX, y: e.clientY, crop: draft };
              }}
              onPointerMove={(e) => {
                const d = drag.current,
                  b = preview.current?.getBoundingClientRect();
                if (d && b)
                  setDraft(
                    moveCrop(
                      w,
                      h,
                      d.crop,
                      ((e.clientX - d.x) * w) / b.width,
                      ((e.clientY - d.y) * h) / b.height,
                    ),
                  );
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              onKeyDown={(e) => {
                if (locked) return;
                const step = e.shiftKey ? 10 : 1;
                if (
                  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  setDraft((d) =>
                    moveCrop(
                      w,
                      h,
                      d,
                      e.key === 'ArrowLeft'
                        ? -step
                        : e.key === 'ArrowRight'
                          ? step
                          : 0,
                      e.key === 'ArrowUp'
                        ? -step
                        : e.key === 'ArrowDown'
                          ? step
                          : 0,
                    ),
                  );
                }
              }}
            >
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
        <div className="dc-crop-edges">
          {(
            [
              ['cropTop', ar ? 'أعلى' : 'Top', h],
              ['cropBottom', ar ? 'أسفل' : 'Bottom', h],
              ['cropLeft', ar ? 'يسار' : 'Left', w],
              ['cropRight', ar ? 'يمين' : 'Right', w],
            ] as const
          ).map(([key, label, dimension]) => (
            <label key={key}>
              {label} %
              <input
                type="number"
                min="0"
                max="99.9"
                step="0.5"
                value={Number(((draft[key] / dimension) * 100).toFixed(1))}
                onChange={(e) =>
                  update(key, (Number(e.target.value) / 100) * dimension)
                }
              />
            </label>
          ))}
        </div>
        <output dir="ltr">
          {Math.round(w - draft.cropLeft - draft.cropRight)} ×{' '}
          {Math.round(h - draft.cropTop - draft.cropBottom)} px
        </output>
        <div className="dc-crop-actions">
          <button
            type="button"
            className="dc-primary"
            onClick={() => onApply(draft)}
          >
            <Check size={14} />
            {ar ? 'تطبيق القص' : 'Apply crop'}
          </button>
          <button
            type="button"
            onClick={() => setDraft(normalizeCrop(w, h, p))}
          >
            {ar ? 'إلغاء التعديل' : 'Cancel changes'}
          </button>
          <button
            type="button"
            aria-label={ar ? 'استعادة الصورة كاملة' : 'Restore full image'}
            title={ar ? 'استعادة الصورة كاملة' : 'Restore full image'}
            onClick={() => {
              const full = normalizeCrop(w, h, {});
              setDraft(full);
              onApply(full);
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </fieldset>
    </details>
  );
}
