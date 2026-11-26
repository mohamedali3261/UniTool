import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Layer } from "../core/model";
import {
  moveCrop,
  resizeCrop,
  aspectCrop,
  alphaCrop,
  fullCrop,
  type CropRect,
} from "../core/crop";
import { useModalFocus } from "../hooks/useModalFocus";
export function ImageCropDialog({
  item,
  close,
  apply,
  ar,
}: {
  item: Layer;
  close: () => void;
  apply: (crop: CropRect) => void;
  ar: boolean;
}) {
  const [crop, setCrop] = useState<CropRect>(item.crop ?? fullCrop),
    [size, setSize] = useState<{ w: number; h: number } | null>(null),
    [error, setError] = useState("");
  const svg = useRef<SVGSVGElement>(null),
    panel = useRef<HTMLDivElement>(null),
    draft = useRef(crop);
  const drag = useRef<{
    crop: CropRect;
    x: number;
    y: number;
    sx: number;
    sy: number;
    move: boolean;
  } | null>(null);
  const id = useId().replaceAll(":", "");
  const onClose = useCallback(() => close(), [close]);
  useModalFocus(panel, onClose);
  const update = (c: CropRect) => {
    draft.current = c;
    setCrop(c);
  };
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.src = item.src;
    img
      .decode()
      .then(() => {
        if (active) setSize({ w: img.naturalWidth, h: img.naturalHeight });
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, [item.src]);
  function point(e: React.PointerEvent) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      svg.current!.getScreenCTM()!.inverse(),
    );
    return { x: p.x / size!.w, y: p.y / size!.h };
  }
  function begin(
    e: React.PointerEvent<SVGElement>,
    sx: number,
    sy: number,
    move = false,
  ) {
    e.preventDefault();
    e.stopPropagation();
    const p = point(e);
    drag.current = { crop: { ...draft.current }, ...p, sx, sy, move };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  async function trim() {
    try {
      const img = new Image();
      img.src = item.src;
      await img.decode();
      const c = document.createElement("canvas");
      const ratio = Math.min(1, 2048 / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * ratio));
      c.height = Math.max(1, Math.round(img.height * ratio));
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      update(
        alphaCrop(
          c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data,
          c.width,
          c.height,
        ),
      );
      setError("");
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <div className="ps-modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ar ? "قص الصورة بالسحب" : "Interactive image crop"}
        className="ps-crop-modal"
        ref={panel}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{ar ? "قص الصورة بالسحب" : "Crop image"}</h2>
          <button
            aria-label={ar ? "إغلاق القص" : "Close crop"}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <p>
          {ar
            ? "اسحب الإطار لتحريكه أو المقابض لقص الحواف. الأسهم تحرّكه بكسلًا؛ Shift يحرّكه 10 بكسلات. لا يتغير الأصل حتى تؤكد."
            : "Drag the frame to move it, or handles to crop edges. Arrow keys move by 1px; Shift by 10px. Original is unchanged until confirmed."}
        </p>
        {size && (
          <svg
            ref={svg}
            viewBox={`0 0 ${size.w} ${size.h}`}
            style={{ aspectRatio: `${size.w}/${size.h}` }}
            role="application"
            tabIndex={0}
            aria-label={ar ? "منطقة قص الصورة" : "Crop selection area"}
            onKeyDown={(e) => {
              if (
                !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  e.key,
                )
              )
                return;
              e.preventDefault();
              const step = e.shiftKey ? 10 : 1;
              update(
                moveCrop(
                  draft.current,
                  e.key === "ArrowLeft"
                    ? -step / size.w
                    : e.key === "ArrowRight"
                      ? step / size.w
                      : 0,
                  e.key === "ArrowUp"
                    ? -step / size.h
                    : e.key === "ArrowDown"
                      ? step / size.h
                      : 0,
                ),
              );
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const p = point(e);
              update(
                d.move
                  ? moveCrop(d.crop, p.x - d.x, p.y - d.y)
                  : resizeCrop(d.crop, p.x - d.x, p.y - d.y, d.sx, d.sy),
              );
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <defs>
              <clipPath id={id}>
                <rect
                  x={crop.x * size.w}
                  y={crop.y * size.h}
                  width={crop.w * size.w}
                  height={crop.h * size.h}
                />
              </clipPath>
            </defs>
            <image href={item.src} width={size.w} height={size.h} />
            <rect width={size.w} height={size.h} fill="#000a" />
            <image
              href={item.src}
              width={size.w}
              height={size.h}
              clipPath={`url(#${id})`}
              pointerEvents="none"
            />
            <rect
              data-testid="crop-window"
              x={crop.x * size.w}
              y={crop.y * size.h}
              width={crop.w * size.w}
              height={crop.h * size.h}
              fill="transparent"
              stroke="white"
              strokeWidth={Math.max(size.w, size.h) / 350}
              style={{ cursor: "move" }}
              onPointerDown={(e) => begin(e, 0, 0, true)}
            />
            {[-1, 0, 1].flatMap((sx) =>
              [-1, 0, 1]
                .filter((sy) => sx || sy)
                .map((sy) => {
                  const n = Math.max(size.w, size.h) * 0.022;
                  return (
                    <rect
                      key={`${sx}/${sy}`}
                      aria-label={`Crop handle ${sx} ${sy}`}
                      x={(crop.x + ((sx + 1) / 2) * crop.w) * size.w - n / 2}
                      y={(crop.y + ((sy + 1) / 2) * crop.h) * size.h - n / 2}
                      width={n}
                      height={n}
                      fill="#79ac91"
                      stroke="white"
                      strokeWidth={n / 8}
                      style={{
                        cursor:
                          sx === 0
                            ? "ns-resize"
                            : sy === 0
                              ? "ew-resize"
                              : "nwse-resize",
                      }}
                      onPointerDown={(e) => begin(e, sx, sy)}
                    />
                  );
                }),
            )}
          </svg>
        )}
        <output dir="ltr">
          {Math.round(crop.w * 100)}% × {Math.round(crop.h * 100)}%
          {size
            ? ` · ${Math.round(crop.w * size.w)} × ${Math.round(crop.h * size.h)} px`
            : ""}
        </output>
        <div className="ps-chip-grid">
          <button onClick={() => update({ ...fullCrop })}>
            {ar ? "إعادة ضبط القص" : "Reset crop"}
          </button>
          {[1, 4 / 5, 16 / 9].map((r, i) => (
            <button
              key={r}
              disabled={!size}
              onClick={() => update(aspectCrop(size!.w, size!.h, r))}
            >
              {["1:1", "4:5", "16:9"][i]}
            </button>
          ))}
          <button disabled={!size} onClick={trim}>
            {ar ? "تحديد المحتوى غير الشفاف" : "Fit opaque content"}
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        <footer>
          <button onClick={onClose}>{ar ? "إلغاء القص" : "Cancel crop"}</button>
          <button disabled={!size} onClick={() => apply(draft.current)}>
            {ar ? "تطبيق القص" : "Apply crop"}
          </button>
        </footer>
      </div>
    </div>
  );
}
