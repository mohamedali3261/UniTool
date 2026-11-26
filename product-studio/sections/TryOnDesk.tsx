import { useEffect, useRef, useState } from "react";
import { Upload, RotateCcw, Eye, ScanLine, UserRound } from "lucide-react";
import type { Project } from "../core/model";
import {
  defaultTryOn,
  models,
  renderTryOn,
  validQuad,
  type Point,
  type TryOnSettings,
} from "../core/tryOn";
import { rasterFile } from "../core/artwork";
export function TryOnDesk({
  project,
  patch,
  ar,
  notify,
}: {
  project: Project;
  patch: (p: Partial<Project>) => void;
  ar: boolean;
  notify: (s: string) => void;
}) {
  const t = project.tryOn,
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [compare, setCompare] = useState(false),
    [guides, setGuides] = useState(true),
    [editMask, setEditMask] = useState(false),
    [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null),
    svg = useRef<SVGSVGElement>(null),
    drag = useRef<{
      index: number;
      mask: boolean;
      start: Point;
      points: Point[];
    } | null>(null);
  useEffect(() => {
    let active = true;
    setBusy(true);
    const timer = setTimeout(() => {
      renderTryOn(project, 960, compare)
        .then((c) => {
          if (active) {
            setUrl(c.toDataURL("image/jpeg", 0.94));
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(String(e));
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 90);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [project, compare]);
  function update(p: Partial<TryOnSettings>) {
    patch({ tryOn: { ...t, ...p } });
  }
  function point(e: React.PointerEvent) {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      svg.current!.getScreenCTM()!.inverse(),
    );
    return {
      x: Math.max(0, Math.min(1, p.x / 750)),
      y: Math.max(0, Math.min(1, p.y / 1000)),
    };
  }
  function down(e: React.PointerEvent, index: number) {
    if (compare) return;
    e.preventDefault();
    drag.current = {
      index,
      mask: editMask,
      start: point(e),
      points: (editMask ? t.mask : t.quad).map((p) => ({ ...p })),
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function resize(scale: number) {
    const center = t.quad.reduce(
      (a, p) => ({ x: a.x + p.x / 4, y: a.y + p.y / 4 }),
      { x: 0, y: 0 },
    );
    const q = t.quad.map((p) => ({
      x: center.x + (p.x - center.x) * scale,
      y: center.y + (p.y - center.y) * scale,
    }));
    if (validQuad(q)) update({ quad: q });
  }
  return (
    <section className="ps-tryon">
      <div className="ps-tryon-preview">
        <div className="ps-tryon-badges">
          <span>{ar ? "معاينة شخص 2D" : "2D ON-PERSON PREVIEW"}</span>
          <span>
            {busy ? "…" : compare ? (ar ? "الأصل" : "ORIGINAL") : "LIVE"}
          </span>
        </div>
        <svg
          ref={svg}
          viewBox="0 0 750 1000"
          aria-label={
            ar ? "معاينة التصميم على شخص" : "On-person design preview"
          }
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const p = point(e);
            let points = d.points.map((q) => ({ ...q }));
            if (d.index >= 0) points[d.index] = p;
            else {
              const dx = Math.max(
                  -Math.min(...points.map((q) => q.x)),
                  Math.min(
                    1 - Math.max(...points.map((q) => q.x)),
                    p.x - d.start.x,
                  ),
                ),
                dy = Math.max(
                  -Math.min(...points.map((q) => q.y)),
                  Math.min(
                    1 - Math.max(...points.map((q) => q.y)),
                    p.y - d.start.y,
                  ),
                );
              points = points.map((q) => ({ x: q.x + dx, y: q.y + dy }));
            }
            if (d.mask) update({ mask: points });
            else if (validQuad(points)) update({ quad: points });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {url && <image href={url} width="750" height="1000" />}
          {guides && !compare && (
            <g>
              <polygon
                points={(editMask ? t.mask : t.quad)
                  .map((p) => `${p.x * 750},${p.y * 1000}`)
                  .join(" ")}
                fill={editMask ? "#dc9a3318" : "transparent"}
                stroke={editMask ? "#efb25f" : "#8ccab1"}
                strokeWidth="2"
                strokeDasharray="5 5"
                style={{ cursor: "move" }}
                onPointerDown={(e) => down(e, -1)}
              />
              {(editMask ? t.mask : t.quad).map((p, i) => (
                <circle
                  key={i}
                  cx={p.x * 750}
                  cy={p.y * 1000}
                  r={editMask ? 6 : 9}
                  fill={editMask ? "#efb25f" : "#8ccab1"}
                  stroke="#fff"
                  strokeWidth="2"
                  aria-label={`${ar ? "نقطة" : "Point"} ${i + 1}`}
                  style={{ cursor: "crosshair" }}
                  onPointerDown={(e) => down(e, i)}
                />
              ))}
            </g>
          )}
        </svg>
        {error && <p role="alert">{error}</p>}
        <small>
          {compare
            ? ar
              ? "الصورة قبل تطبيق التصميم"
              : "Original photograph"
            : ar
              ? "اسحب الإطار أو زواياه لضبط موضع الطباعة"
              : "Drag the frame or its corners to place the print"}
        </small>
      </div>
      <div className="ps-tryon-controls">
        <div className="ps-section-head">
          <UserRound size={17} />
          <h2>{ar ? "جرّب تصميمك على شخص" : "Put your design on a person"}</h2>
        </div>
        <p>
          {ar
            ? "الصور الجاهزة لتيشيرت أمامي. تُطبّق رسومات الوجه الأمامي مع الاحتفاظ بظلال الصورة، وليس تغيير قصة الملابس أو محاكاة المقاس."
            : "Ready-made photos show front-facing T-shirts. Front artwork follows the photo’s shading; this does not change garment shape or predict fit."}
        </p>
        <div className="ps-model-picks">
          {(["man"] as const).map((source) => (
            <button
              key={source}
              className={t.source === source ? "active" : ""}
              aria-pressed={t.source === source}
              onClick={() => {
                patch({ product: "tee", tryOn: defaultTryOn(source) });
                setCompare(false);
              }}
            >
              <img src={models[source].url} alt="" />
              <span>{models[source][ar ? "ar" : "en"]}</span>
            </button>
          ))}
        </div>
        <small>
          {ar
            ? "صور العرض الجاهزة مولّدة بالذكاء الاصطناعي."
            : "Included model photographs are AI-generated."}
        </small>
        <button
          className="ps-full-button"
          onClick={() => file.current?.click()}
        >
          <Upload size={15} />
          {ar ? "رفع صورة شخص" : "Upload a person photo"}
        </button>
        <input
          ref={file}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              const photo = await rasterFile(f);
              update({ source: "custom", photo });
              setEditMask(true);
              setGuides(true);
              setCompare(false);
              notify(
                ar
                  ? "اضبط حدود الملابس وزوايا الطباعة لتناسب صورتك."
                  : "Adjust the garment mask and print corners to match your photo.",
              );
            } catch (e) {
              notify(String(e instanceof Error ? e.message : e));
            }
          }}
        />
        <div className="ps-tryon-toolrow">
          <button aria-pressed={compare} onClick={() => setCompare(!compare)}>
            <Eye size={14} />
            {ar ? "قبل / بعد" : "Before / after"}
          </button>
          <button aria-pressed={guides} onClick={() => setGuides(!guides)}>
            <ScanLine size={14} />
            {ar ? "الأدلة" : "Guides"}
          </button>
        </div>
        <label className="ps-check">
          <input
            type="checkbox"
            checked={editMask}
            onChange={(e) => {
              setEditMask(e.target.checked);
              setGuides(true);
            }}
          />
          {ar ? "تعديل حدود تلوين الملابس" : "Edit garment color mask"}
        </label>
        <label className="ps-check">
          <input
            type="checkbox"
            checked={t.tint}
            onChange={(e) => update({ tint: e.target.checked })}
          />
          {ar ? "تطبيق لون القطعة" : "Apply garment color"}
        </label>
        <label>
          {ar ? "قوة التلوين" : "Color strength"}
          <input
            aria-label={ar ? "قوة التلوين" : "Color strength"}
            type="range"
            min="0"
            max="1"
            step=".01"
            value={t.strength}
            onChange={(e) => update({ strength: +e.target.value })}
          />
        </label>
        <div className="ps-tryon-toolrow">
          <button onClick={() => resize(0.93)}>
            {ar ? "تصغير الرسم" : "Smaller print"}
          </button>
          <button onClick={() => resize(1.07)}>
            {ar ? "تكبير الرسم" : "Larger print"}
          </button>
        </div>
        <button
          className="ps-full-button"
          onClick={() => {
            const d = defaultTryOn();
            update({ quad: d.quad, mask: d.mask });
          }}
        >
          <RotateCcw size={14} />
          {ar ? "إعادة ضبط الموضع" : "Reset placement"}
        </button>
        {project.product !== "tee" && t.source !== "custom" && (
          <p className="ps-tryon-warning">
            {ar
              ? "هذه صورة تيشيرت، وليست معاينة لقصة المنتج المحدد. اختر صورة ملابس مطابقة أو حوّل المنتج إلى تيشيرت."
              : "This photograph shows a T-shirt, not the selected garment cut. Upload a matching garment photo or select a T-shirt."}
            <button onClick={() => patch({ product: "tee" })}>
              {ar ? "اختيار تيشيرت" : "Use T-shirt"}
            </button>
          </p>
        )}
        <p className="ps-tryon-note">
          {ar
            ? "لأفضل نتيجة: صورة أمامية واضحة، ملابس سادة فاتحة وأيدٍ لا تغطي التصميم. استخدم صورًا تملك حق استخدامها. الصور تُعالج محليًا ولا تُرفع لسيرفر."
            : "Best results: a clear front-facing photo, light plain clothing and no hands covering the print. Use photos you have permission to use. Processing stays in your browser."}
        </p>
      </div>
    </section>
  );
}
