import {
  Type,
  ImagePlus,
  Circle,
  Square,
  Star,
  Plus,
  Eye,
  EyeOff,
  LockKeyhole,
  UnlockKeyhole,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from "lucide-react";
import { useRef } from "react";
import type { Layer } from "../core/model";
export function DesignPanel({
  layers,
  selected,
  select,
  add,
  upload,
  change,
  move,
  duplicate,
  remove,
  copyToOther,
  ar,
}: {
  layers: Layer[];
  selected: string | null;
  select: (s: string) => void;
  add: (kind: Layer["kind"], patch?: Partial<Layer>) => void;
  upload: (file: File) => void;
  change: (id: string, p: Partial<Layer>) => void;
  move: (id: string, d: number) => void;
  duplicate: () => void;
  remove: () => void;
  copyToOther: () => void;
  ar: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <section>
      <div className="ps-section-head">
        <span>02 /</span>
        <h2>{ar ? "أضف لمستك" : "Make it yours"}</h2>
      </div>
      <div className="ps-add-row">
        <button onClick={() => add("text")}>
          <Type size={20} />
          {ar ? "كتابة" : "Text"}
          <Plus size={13} />
        </button>
        <button onClick={() => input.current?.click()}>
          <ImagePlus size={20} />
          {ar ? "رفع صورة" : "Upload"}
          <Plus size={13} />
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <div className="ps-shapes">
        {(["circle", "rect", "star"] as const).map((shape, i) => {
          const Icon = [Circle, Square, Star][i];
          return (
            <button
              key={shape}
              aria-label={
                ar
                  ? ["إضافة دائرة", "إضافة مستطيل", "إضافة نجمة"][i]
                  : `Add ${shape}`
              }
              onClick={() =>
                add("shape", { shape, w: 400, h: 400, x: 312, y: 312 })
              }
            >
              <Icon size={19} />
            </button>
          );
        })}
        <span>{ar ? "أشكال أساسية" : "Basic shapes"}</span>
      </div>
      <div className="ps-chip-grid">
        {(["triangle", "diamond", "line"] as const).map((shape, i) => (
          <button
            key={shape}
            onClick={() =>
              add("shape", { shape, w: 400, h: 400, x: 312, y: 312 })
            }
          >
            {ar ? ["مثلث", "معين", "خط"][i] : shape}
          </button>
        ))}
      </div>
      <div className="ps-subhead">
        <h3>{ar ? "الطبقات" : "Layers"}</h3>
        <small>{String(layers.length).padStart(2, "0")}</small>
      </div>
      <div className="ps-layers">
        {[...layers].reverse().map((l) => (
          <div
            key={l.id}
            className={`ps-layer ${selected === l.id ? "active" : ""}`}
          >
            <button className="ps-layer-main" onClick={() => select(l.id)}>
              <span>
                {l.kind === "text" ? (
                  <Type size={17} />
                ) : l.kind === "image" ? (
                  <ImagePlus size={17} />
                ) : (
                  <Circle size={17} />
                )}
              </span>
              <b>{l.name}</b>
            </button>
            <button
              aria-label={ar ? "إظهار أو إخفاء الطبقة" : "Toggle visibility"}
              aria-pressed={l.visible}
              onClick={() => change(l.id, { visible: !l.visible })}
            >
              {l.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              aria-label={ar ? "قفل الطبقة" : "Lock layer"}
              aria-pressed={l.locked}
              onClick={() => change(l.id, { locked: !l.locked })}
            >
              {l.locked ? (
                <LockKeyhole size={14} />
              ) : (
                <UnlockKeyhole size={14} />
              )}
            </button>
          </div>
        ))}
        {!layers.length && (
          <p className="ps-empty">
            {ar
              ? "صفحة جديدة لأفكارك. أضف نصًا أو صورة."
              : "A fresh canvas. Add some text or an image."}
          </p>
        )}
      </div>
      <button
        className="ps-full-button ps-copy-part"
        disabled={!layers.length}
        onClick={copyToOther}
      >
        <Copy size={13} />
        {ar ? "نسخ التصميم للجزء المقابل" : "Copy to opposite panel"}
      </button>
      <div className="ps-layer-actions">
        <button
          disabled={!selected}
          title={ar ? "للأمام" : "Bring forward"}
          onClick={() => selected && move(selected, 1)}
        >
          <ArrowUp size={16} />
        </button>
        <button
          disabled={!selected}
          title={ar ? "للخلف" : "Send backward"}
          onClick={() => selected && move(selected, -1)}
        >
          <ArrowDown size={16} />
        </button>
        <button
          disabled={!selected}
          title={ar ? "تكرار" : "Duplicate"}
          onClick={duplicate}
        >
          <Copy size={16} />
        </button>
        <button
          disabled={!selected}
          title={ar ? "حذف" : "Delete"}
          onClick={remove}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </section>
  );
}
