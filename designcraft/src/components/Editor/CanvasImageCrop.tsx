import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fabric } from 'fabric';
import { Crop, Trash2, Undo2 } from 'lucide-react';
import { useDcLang } from '../../hooks/useDcLang';
import {
  normalizeCrop,
  moveCrop,
  type CropInsets,
} from '../../utils/imageCrop';
import './canvas-image-crop.css';
type Geometry = {
  matrix: number[];
  width: number;
  height: number;
  left: number;
  top: number;
  scale: number;
};
/** A DOM overlay in the image's actual local coordinate space, including rotation and flips. */
export function CanvasImageCrop({
  canvas,
  request,
  onRequest,
  onApply,
  onDelete,
}: {
  canvas: fabric.Canvas;
  request: number;
  onRequest: () => void;
  onApply: (crop: CropInsets) => void;
  onDelete: () => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === 'ar';
  const [image, setImage] = useState<fabric.Image | null>(null),
    [geometry, setGeometry] = useState<Geometry | null>(null),
    [editing, setEditing] = useState(false),
    [draft, setDraft] = useState<CropInsets>(() => normalizeCrop(1, 1, {}));
  const target = useRef<fabric.Image | null>(null),
    previousRequest = useRef(request),
    frame = useRef<number | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    crop: CropInsets;
    handle: string;
  } | null>(null);
  useEffect(() => {
    const measure = () => {
      frame.current = null;
      const object = canvas.getActiveObject();
      if (
        !object ||
        object.type !== 'image' ||
        object.lockMovementX ||
        object.lockMovementY ||
        object.lockRotation
      ) {
        setImage(null);
        setEditing(false);
        return;
      }
      const img = object as fabric.Image;
      setImage(img);
      if (target.current && target.current !== img) {
        target.current = null;
        setEditing(false);
      }
      const element = canvas.upperCanvasEl,
        rect = element.getBoundingClientRect(),
        viewport = document
          .getElementById('canvas-area-container')
          ?.getBoundingClientRect();
      const m = fabric.util.multiplyTransformMatrices(
        canvas.viewportTransform!,
        img.calcTransformMatrix(),
      );
      const sx = rect.width / canvas.getWidth(),
        sy = rect.height / canvas.getHeight(),
        w = img.width || 1,
        h = img.height || 1;
      const matrix = [
        m[0] * sx,
        m[1] * sy,
        m[2] * sx,
        m[3] * sy,
        rect.left + m[4] * sx,
        rect.top + m[5] * sy,
      ];
      matrix[4] -= (matrix[0] * w + matrix[2] * h) / 2;
      matrix[5] -= (matrix[1] * w + matrix[3] * h) / 2;
      const points = [
        [0, 0],
        [w, 0],
        [w, h],
        [0, h],
      ].map(([x, y]) => ({
        x: matrix[0] * x + matrix[2] * y + matrix[4],
        y: matrix[1] * x + matrix[3] * y + matrix[5],
      }));
      const left = Math.max(
          8,
          Math.min(innerWidth - 112, Math.min(...points.map((p) => p.x))),
        ),
        top = Math.max(
          (viewport?.top || 64) + 6,
          Math.min(innerHeight - 100, Math.min(...points.map((p) => p.y)) - 38),
        );
      const next = {
        matrix,
        width: w,
        height: h,
        left,
        top,
        scale: Math.max(0.01, Math.hypot(matrix[0], matrix[1])),
      };
      setGeometry((old) =>
        old && JSON.stringify(old) === JSON.stringify(next) ? old : next,
      );
    };
    const schedule = () => {
      if (frame.current === null)
        frame.current = requestAnimationFrame(measure);
    };
    canvas.on('after:render', schedule);
    canvas.on('selection:created', schedule);
    canvas.on('selection:updated', schedule);
    canvas.on('selection:cleared', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    const workspace = document.getElementById('canvas-workspace');
    if (workspace) observer.observe(workspace);
    schedule();
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      canvas.off('after:render', schedule);
      canvas.off('selection:created', schedule);
      canvas.off('selection:updated', schedule);
      canvas.off('selection:cleared', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [canvas]);
  useEffect(() => {
    if (previousRequest.current === request) return;
    previousRequest.current = request;
    const obj = canvas.getActiveObject() as fabric.Image;
    if (
      !obj ||
      obj.type !== 'image' ||
      obj.lockMovementX ||
      obj.lockMovementY ||
      obj.lockRotation
    )
      return;
    target.current = obj;
    setDraft(normalizeCrop(obj.width || 1, obj.height || 1, obj as any));
    setEditing(true);
    window.dispatchEvent(new Event('designcraft:focus-crop-image'));
  }, [request, canvas]);
  useEffect(() => {
    if (!editing) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setEditing(false);
        drag.current = null;
      }
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [editing]);
  if (!image || !geometry) return null;
  const g = geometry,
    local = (e: { clientX: number; clientY: number }) => {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        new DOMMatrix(g.matrix).inverse(),
      );
      return { x: p.x, y: p.y };
    };
  const change = (
    dx: number,
    dy: number,
    start: CropInsets,
    handle: string,
  ) => {
    if (handle === 'move') return moveCrop(g.width, g.height, start, dx, dy);
    const next = { ...start };
    if (handle.includes('w'))
      next.cropLeft = Math.max(
        0,
        Math.min(g.width - start.cropRight - 1, start.cropLeft + dx),
      );
    if (handle.includes('e'))
      next.cropRight = Math.max(
        0,
        Math.min(g.width - start.cropLeft - 1, start.cropRight - dx),
      );
    if (handle.includes('n'))
      next.cropTop = Math.max(
        0,
        Math.min(g.height - start.cropBottom - 1, start.cropTop + dy),
      );
    if (handle.includes('s'))
      next.cropBottom = Math.max(
        0,
        Math.min(g.height - start.cropTop - 1, start.cropBottom - dy),
      );
    return normalizeCrop(g.width, g.height, next);
  };
  return createPortal(
    <>
      {editing && (
        <div
          className="dc-canvas-crop"
          data-testid="canvas-image-crop"
          style={
            {
              width: g.width,
              height: g.height,
              transform: `matrix(${g.matrix.join(',')})`,
              '--crop-unit': `${1 / g.scale}px`,
            } as React.CSSProperties
          }
        >
          <img
            src={image.getSrc()}
            draggable={false}
            alt={ar ? 'قص الصورة مباشرة' : 'Crop image directly'}
          />
          <div
            className="dc-canvas-crop-region"
            role="group"
            aria-label={ar ? 'منطقة القص' : 'Crop region'}
            tabIndex={0}
            style={{
              left: draft.cropLeft,
              top: draft.cropTop,
              width: g.width - draft.cropLeft - draft.cropRight,
              height: g.height - draft.cropTop - draft.cropBottom,
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const p = local(e);
              drag.current = {
                ...p,
                crop: draft,
                handle: (e.target as HTMLElement).dataset.cropHandle || 'move',
              };
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const p = local(e),
                d = drag.current;
              setDraft(change(p.x - d.x, p.y - d.y, d.crop, d.handle));
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
            onKeyDown={(e) => {
              if (
                !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                  e.key,
                )
              )
                return;
              e.preventDefault();
              e.stopPropagation();
              const step = e.shiftKey ? 10 : 1;
              setDraft((d) =>
                moveCrop(
                  g.width,
                  g.height,
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
            }}
          >
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
              <button
                type="button"
                key={handle}
                data-crop-handle={handle}
                className={`dc-canvas-crop-handle handle-${handle}`}
                aria-label={(ar ? 'تغيير حافة القص ' : 'Resize crop ') + handle}
                onKeyDown={(e) => {
                  if (
                    ![
                      'ArrowLeft',
                      'ArrowRight',
                      'ArrowUp',
                      'ArrowDown',
                    ].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  e.stopPropagation();
                  const step = e.shiftKey ? 10 : 1;
                  setDraft((d) =>
                    change(
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
                      d,
                      handle,
                    ),
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div
        className="dc-image-actions"
        role="toolbar"
        aria-label={ar ? 'أدوات الصورة' : 'Image actions'}
        style={{ left: g.left, top: g.top }}
      >
        <button
          type="button"
          title={ar ? 'حذف الصورة' : 'Delete image'}
          aria-label={ar ? 'حذف الصورة' : 'Delete image'}
          onClick={() => {
            setEditing(false);
            onDelete();
          }}
        >
          <Trash2 size={15} />
        </button>
        {editing && (
          <button
            type="button"
            title={ar ? 'رجوع بدون تطبيق' : 'Cancel crop'}
            aria-label={ar ? 'رجوع بدون تطبيق' : 'Cancel crop'}
            onClick={() => {
              setEditing(false);
              drag.current = null;
            }}
          >
            <Undo2 size={15} />
          </button>
        )}
        <button
          type="button"
          className={editing ? 'is-cropping' : ''}
          title={
            editing
              ? ar
                ? 'تطبيق القص'
                : 'Apply crop'
              : ar
                ? 'قص الصورة'
                : 'Crop image'
          }
          aria-label={
            editing
              ? ar
                ? 'تطبيق القص'
                : 'Apply crop'
              : ar
                ? 'قص الصورة'
                : 'Crop image'
          }
          onClick={() => {
            if (editing) {
              if (canvas.getActiveObject() === image) onApply(draft);
              setEditing(false);
            } else onRequest();
          }}
        >
          <Crop size={15} />
        </button>
      </div>
    </>,
    document.body,
  );
}
