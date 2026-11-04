import { useState } from 'react';
import {
  Move,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Link,
  Unlink,
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';
import type { ActiveObjectProperties } from '../../../types';
export function TransformProperties({
  properties: p,
  onUpdate,
}: {
  properties: ActiveObjectProperties;
  onUpdate: (key: string, value: any) => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === 'ar';
  const [linked, setLinked] = useState(true);
  const apply = (patch: Record<string, number | boolean>) =>
    onUpdate('transform', patch);
  const size = (key: 'width' | 'height', n: number) => {
    if (!Number.isFinite(n) || n < 1) return;
    const patch: Record<string, number> = { [key]: n };
    if (linked) {
      if (key === 'width') patch.height = (n * p.height) / Math.max(1, p.width);
      else patch.width = (n * p.width) / Math.max(1, p.height);
    }
    apply(patch);
  };
  return (
    <details className="dc-transform">
      <summary>
        <Move size={15} />
        {ar ? 'المقاس والموضع والدوران' : 'Size, position & rotation'}
      </summary>
      <fieldset
        disabled={!!(p.lockMovementX || p.lockMovementY || p.lockRotation)}
      >
        <div className="dc-crop-edges">
          {(
            [
              ['left', ar ? 'الموضع X' : 'Position X'],
              ['top', ar ? 'الموضع Y' : 'Position Y'],
              ['width', ar ? 'العرض' : 'Width'],
              ['height', ar ? 'الارتفاع' : 'Height'],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={key === 'width' || key === 'height' ? 1 : undefined}
                step="1"
                value={Math.round(p[key])}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  if (key === 'width' || key === 'height') size(key, n);
                  else apply({ [key]: n });
                }}
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={linked}
          onClick={() => setLinked((v) => !v)}
        >
          {linked ? <Link size={14} /> : <Unlink size={14} />}{' '}
          {ar ? 'الحفاظ على النسبة' : 'Keep aspect ratio'}
        </button>
        <label className="dc-transform-angle">
          {ar ? 'الدوران' : 'Rotation'}
          <input
            type="number"
            value={Math.round(p.angle)}
            step="1"
            onChange={(e) => apply({ angle: Number(e.target.value) || 0 })}
          />
        </label>
        <div className="dc-crop-presets">
          {[
            { angle: -90, Icon: RotateCcw },
            { angle: 90, Icon: RotateCw },
          ].map(({ angle, Icon }) => (
            <button
              key={angle}
              type="button"
              aria-label={(ar ? 'تدوير ' : 'Rotate ') + angle + '°'}
              onClick={() => apply({ angle: (p.angle + angle) % 360 })}
            >
              <Icon size={15} />
              {angle}°
            </button>
          ))}
          <button type="button" onClick={() => apply({ angle: 0 })}>
            {ar ? 'بدون دوران' : 'Reset angle'}
          </button>
        </div>
        <div className="dc-crop-presets">
          <button
            type="button"
            aria-pressed={!!p.flipX}
            onClick={() => apply({ flipX: !p.flipX })}
          >
            <FlipHorizontal size={15} />
            {ar ? 'عكس أفقي' : 'Flip horizontally'}
          </button>
          <button
            type="button"
            aria-pressed={!!p.flipY}
            onClick={() => apply({ flipY: !p.flipY })}
          >
            <FlipVertical size={15} />
            {ar ? 'عكس رأسي' : 'Flip vertically'}
          </button>
        </div>
        <label>
          {ar ? 'الشفافية' : 'Opacity'} {Math.round(p.opacity * 100)}%
          <input
            type="range"
            min="0"
            max="100"
            value={p.opacity * 100}
            onChange={(e) => apply({ opacity: Number(e.target.value) / 100 })}
          />
        </label>
      </fieldset>
    </details>
  );
}
