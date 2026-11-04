import { useEffect, useRef, useState } from "react";
import type { fabric } from "fabric";
import { X, RotateCcw, Box, Maximize2 } from "lucide-react";
import { useDcLang } from "../../hooks/useDcLang";
import type { CartonSize } from "../geometry";
import { previewTextureLimit, type PreviewQuality } from "./quality";
import { cartonAtlas } from "./atlas";
import { createCartonPreview, type View } from "./scene";
import "./preview3d.css";
export default function Carton3DDialog({
  canvas,
  size,
  width,
  height,
  onClose,
}: {
  canvas: fabric.Canvas;
  size: CartonSize;
  width: number;
  height: number;
  onClose: () => void;
}) {
  const { lang } = useDcLang(),
    ar = lang === "ar",
    dialog = useRef<HTMLDialogElement>(null),
    host = useRef<HTMLDivElement>(null),
    engine = useRef<ReturnType<typeof createCartonPreview> | null>(null);
  const [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [fold, setFold] = useState(100),
    [revision, setRevision] = useState(0);
  const [quality, setQuality] = useState<PreviewQuality>("high"),
    [finish, setFinish] = useState<"matte" | "satin">("matte");
  const finishRef = useRef(finish),
    foldRef = useRef(1);
  finishRef.current = finish;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    let paintFrame: number | undefined;
    let canceled = false,
      atlas: Awaited<ReturnType<typeof cartonAtlas>> | undefined;
    setBusy(true);
    setError("");

    const element = host.current!;
    const lost = () => {
      engine.current?.dispose();
      engine.current = null;
      setError(
        ar
          ? "توقف العرض ثلاثي الأبعاد. اضغط إعادة التحميل للمحاولة من جديد."
          : "The 3D context was lost. Reload the preview to try again.",
      );
    };
    element.addEventListener("carton-webgl-lost", lost);
    const limit = previewTextureLimit(quality, window.innerWidth < 768);
    // Paint the modal/loading state before CPU/GPU texture and studio-light setup.
    void (async () => {
      await new Promise<void>(
        (resolve) =>
          (paintFrame = requestAnimationFrame(() => {
            paintFrame = requestAnimationFrame(() => resolve());
          })),
      );
      if (canceled) return;
      return cartonAtlas(canvas, size, width, height, limit.edge, limit.pixels);
    })()
      .then((result) => {
        if (!result) return;
        atlas = result;
        if (canceled) {
          result.dispose();
          return;
        }
        try {
          engine.current = createCartonPreview(element, result, size, quality);
          engine.current.setFold(foldRef.current);
          engine.current.setFinish(finishRef.current);
          setBusy(false);
        } catch {
          result.dispose();
          atlas = undefined;
          setBusy(false);
          setError(
            ar
              ? "تعذر تشغيل المعاينة. تأكد من دعم WebGL والسماح باستخدامه، ومن أن صور التصميم متاحة للعرض."
              : "Unable to start the preview. Check WebGL support and that artwork images are available.",
          );
        }
      })
      .catch(() => {
        if (!canceled) {
          setBusy(false);
          setError(
            ar
              ? "تعذر قراءة التصميم. تأكد من تطابق مقاس القالب وإتاحة الصور، ثم أعد المحاولة."
              : "Could not read the artwork. Check the carton canvas dimensions and image access, then retry.",
          );
        }
      });
    return () => {
      canceled = true;
      if (paintFrame !== undefined) cancelAnimationFrame(paintFrame);
      element.removeEventListener("carton-webgl-lost", lost);
      engine.current?.dispose();
      engine.current = null;
      atlas?.dispose();
    };
  }, [canvas, size, width, height, revision, ar, quality]);
  const changeFold = (percent: number) => {
    setFold(percent);
    foldRef.current = percent / 100;
    engine.current?.setFold(percent / 100);
  };
  const names: Record<View, [string, string]> = {
    perspective: ["منظور مجسم", "Perspective"],
    front: ["الأمام", "Front"],
    right: ["اليمين", "Right"],
    back: ["الخلف", "Back"],
    left: ["اليسار", "Left"],
    top: ["الأعلى", "Top"],
    bottom: ["الأسفل", "Bottom"],
  };
  return (
    <dialog
      ref={dialog}
      className="carton-3d-dialog"
      aria-labelledby="carton-3d-title"
      dir={ar ? "rtl" : "ltr"}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div>
          <h2 id="carton-3d-title">
            <Box size={20} />
            {ar ? "معاينة العلبة ثلاثية الأبعاد" : "3D carton preview"}
          </h2>
          <p dir="ltr">
            {size.height} × {size.width} × {size.depth} mm
          </p>
        </div>
        <button
          type="button"
          aria-label={ar ? "إغلاق المعاينة" : "Close preview"}
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </header>
      <div
        className="carton-3d-stage"
        ref={host}
        data-testid="carton-3d-stage"
        data-ready={!busy && !error}
        data-fold={fold}
        data-quality={quality}
      >
        {busy && (
          <div className="carton-3d-message" role="status">
            {ar
              ? "جاري تجميع العلبة من تصميمك…"
              : "Assembling your carton artwork…"}
          </div>
        )}
        {error && (
          <div className="carton-3d-message" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRevision((v) => v + 1)}>
              {ar ? "إعادة التحميل" : "Reload preview"}
            </button>
          </div>
        )}
      </div>
      <div className="carton-3d-controls">
        <div className="carton-3d-quality">
          <label>
            {ar ? "وضوح المعاينة" : "Preview clarity"}
            <select
              aria-label={ar ? "جودة المعاينة" : "Preview quality"}
              value={quality}
              onChange={(e) => setQuality(e.target.value as PreviewQuality)}
            >
              <option value="high">
                {ar ? "عالية · حتى 4K" : "High · up to 4K"}
              </option>
              <option value="balanced">
                {ar ? "متوازنة · أخف" : "Balanced · lighter"}
              </option>
            </select>
          </label>
          <label>
            {ar ? "ملمس الورق" : "Paper finish"}
            <select
              aria-label={ar ? "خامة العلبة" : "Carton finish"}
              value={finish}
              disabled={busy || !!error}
              onChange={(e) => {
                const next = e.target.value as "matte" | "satin";
                setFinish(next);
                engine.current?.setFinish(next);
              }}
            >
              <option value="matte">{ar ? "مطفي" : "Matte"}</option>
              <option value="satin">
                {ar ? "ساتان · لمعان خفيف" : "Satin · soft sheen"}
              </option>
            </select>
          </label>
          <span>
            {ar
              ? "الصور الأصلية منخفضة الدقة تظل محدودة التفاصيل."
              : "Low-resolution source images remain limited in detail."}
          </span>
        </div>
        <p>
          {ar
            ? "اسحب لتدوير العلبة بحرية 360° من كل الاتجاهات، بما فيها الأسفل. قرّب بإصبعين أو عجلة الماوس؛ حرّك بزر الماوس الأيمن. الأسهم للتدوير، + و − للتقريب، Home لإعادة المنظور."
            : "Drag to rotate freely through 360°, including underneath. Pinch or wheel to zoom; right-drag to pan. Arrow keys rotate, + and − zoom, Home resets the view."}
        </p>
        <div
          className="carton-3d-views"
          role="group"
          aria-label={ar ? "اتجاه المعاينة" : "Preview direction"}
        >
          {(Object.keys(names) as View[]).map((view) => (
            <button
              type="button"
              key={view}
              disabled={busy || !!error}
              onClick={() => engine.current?.view(view)}
            >
              {names[view][ar ? 0 : 1]}
            </button>
          ))}
        </div>
        <div className="carton-3d-fold">
          <button
            type="button"
            disabled={busy || !!error}
            onClick={() => changeFold(0)}
          >
            {ar ? "فرد القالب" : "Unfold net"}
          </button>
          <label>
            {ar ? "تجميع العلبة" : "Assembly"} <output>{fold}%</output>
            <input
              type="range"
              min="0"
              max="100"
              value={fold}
              disabled={busy || !!error}
              aria-label={ar ? "درجة تجميع العلبة" : "Carton assembly progress"}
              onChange={(e) => changeFold(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            disabled={busy || !!error}
            onClick={() => changeFold(100)}
          >
            {ar ? "تجميع كامل" : "Assemble carton"}
          </button>
          <button
            type="button"
            disabled={busy || !!error}
            aria-label={ar ? "إعادة المنظور" : "Reset view"}
            onClick={() => engine.current?.view()}
          >
            <RotateCcw size={16} />
            <Maximize2 size={15} />
          </button>
        </div>
        <small>
          {ar
            ? "المقاسات والأوجه والألسنة مأخوذة من القالب الحالي، والطباعة من تصميمك بدون خطوط القص. سُمك العرض 0.35 مم تقريبي؛ حركة الطي ليست محاكاة تصادم أو تعويض تصنيع. اللون والإضاءة والخامة قد تختلف عن الطباعة الحقيقية؛ جرّب نموذجًا ورقيًا قبل الإنتاج."
            : "Faces and flaps use the current nominal dieline; artwork excludes cutting guides. Visual board thickness is an approximate 0.35 mm. Folding is not a collision or manufacturing-compensation simulation. Lighting, material, and printed colors may differ: prototype before production."}
        </small>
      </div>
    </dialog>
  );
}
