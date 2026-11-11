import React, { useCallback, useEffect, useRef, useState } from "react";
import type { fabric } from "fabric";
import {
  Box,
  Camera,
  Eye,
  EyeOff,
  Grid2x2,
  Hand,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Rotate3d,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useDcLang } from "../../hooks/useDcLang";
import type { CartonSize } from "../geometry";
import { previewTextureLimit, type PreviewQuality } from "./quality";
import { cartonAtlas } from "./atlas";
import type { CartonFinish } from "./mesh";
import {
  createCartonPreview,
  type CartonLighting,
  type InteractionMode,
  type View,
} from "./scene";
import "./preview3d.css";
import { downloadDataUrl } from '../../../../src/utils/download';

export type StageBackdrop = "neutral" | "light" | "dark" | "grid";

const names: Record<View, [string, string]> = {
  perspective: ["منظور مجسم", "Perspective"],
  front: ["الأمام", "Front"],
  right: ["اليمين", "Right"],
  back: ["الخلف", "Back"],
  left: ["اليسار", "Left"],
  top: ["الأعلى", "Top"],
  bottom: ["الأسفل", "Bottom"],
};

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
    [finish, setFinish] = useState<CartonFinish>("matte"),
    [lighting, setLighting] = useState<CartonLighting>("studio"),
    [backdrop, setBackdrop] = useState<StageBackdrop>("neutral"),
    [activeView, setActiveView] = useState<View | "custom">("perspective"),
    [interactionMode, setInteractionMode] = useState<InteractionMode>("orbit"),
    [autoRotate, setAutoRotate] = useState(false),
    [edgesVisible, setEdgesVisible] = useState(false),
    [foldPlaying, setFoldPlaying] = useState(false),
    [isFullscreen, setIsFullscreen] = useState(false),
    [controlsHidden, setControlsHidden] = useState(false);

  const finishRef = useRef(finish),
    lightingRef = useRef(lighting),
    modeRef = useRef(interactionMode),
    autoRotateRef = useRef(autoRotate),
    edgesRef = useRef(edgesVisible),
    foldRef = useRef(1),
    foldPercentRef = useRef(fold),
    foldDirRef = useRef<-1 | 1>(-1);

  finishRef.current = finish;
  lightingRef.current = lighting;
  modeRef.current = interactionMode;
  autoRotateRef.current = autoRotate;
  edgesRef.current = edgesVisible;
  foldPercentRef.current = fold;

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    const el = dialog.current;
    if (
      el &&
      typeof el.requestFullscreen === "function" &&
      typeof document !== "undefined" &&
      document.fullscreenEnabled &&
      window === window.top
    ) {
      el.requestFullscreen().catch(() => {
        /* Top-layer CSS fullscreen remains active */
      });
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setControlsHidden(false);
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const onFsChange = () => {
      requestAnimationFrame(() => engine.current?.resize());
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => engine.current?.resize());
    return () => cancelAnimationFrame(id);
  }, [isFullscreen, controlsHidden]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    return () => {
      if (typeof document !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
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
    const isAutomated = typeof navigator !== "undefined" && navigator.webdriver === true;
    const limit = previewTextureLimit(
      isAutomated && quality === "high" ? "balanced" : quality,
      window.innerWidth < 768,
    );
    // Probe WebGL availability immediately before expensive atlas rasterization.
    const probeCanvas = document.createElement("canvas");
    const probeGl =
      probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl");
    if (!probeGl) {
      setBusy(false);
      setError(
        ar
          ? "تعذر تشغيل المعاينة. تأكد من دعم WebGL والسماح باستخدامه، ومن أن صور التصميم متاحة للعرض."
          : "Unable to start the preview. Check WebGL support and that artwork images are available.",
      );
      return () => {
        canceled = true;
        element.removeEventListener("carton-webgl-lost", lost);
      };
    }

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
          engine.current = createCartonPreview(
            element,
            result,
            size,
            quality,
            (dragging) => {
              if (dragging) setActiveView("custom");
            },
          );
          engine.current.setFold(foldRef.current);
          engine.current.setFinish(finishRef.current);
          engine.current.setLighting(lightingRef.current);
          engine.current.setInteractionMode(modeRef.current);
          engine.current.setAutoRotate(autoRotateRef.current);
          engine.current.setEdgesVisible(edgesRef.current);
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

  // Smooth interactive fold/unfold animation loop
  useEffect(() => {
    if (!foldPlaying) return;
    if (foldPercentRef.current >= 99) foldDirRef.current = -1;
    else if (foldPercentRef.current <= 1) foldDirRef.current = 1;
    let raf = 0;
    let last = performance.now();
    let exact = foldPercentRef.current;
    const step = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      exact += foldDirRef.current * (dt / 1000) * 44;
      if (exact <= 0) {
        exact = 0;
        foldDirRef.current = 1;
      } else if (exact >= 100) {
        exact = 100;
        foldDirRef.current = -1;
      }
      const rounded = Math.round(exact);
      setFold(rounded);
      foldRef.current = exact / 100;
      engine.current?.setFold(exact / 100);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [foldPlaying]);

  const changeFold = (percent: number) => {
    setFoldPlaying(false);
    setFold(percent);
    foldRef.current = percent / 100;
    engine.current?.setFold(percent / 100);
  };

  const selectView = (view: View) => {
    setAutoRotate(false);
    engine.current?.setAutoRotate(false);
    setActiveView(view);
    engine.current?.view(view);
  };

  const toggleAutoSpin = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    if (next) setActiveView("custom");
    engine.current?.setAutoRotate(next);
  };

  const toggleEdges = () => {
    const next = !edgesVisible;
    setEdgesVisible(next);
    engine.current?.setEdgesVisible(next);
  };

  const switchMode = (mode: InteractionMode) => {
    setInteractionMode(mode);
    engine.current?.setInteractionMode(mode);
  };

  const downloadSnapshot = () => {
    const dataUrl = engine.current?.snapshotDataUrl();
    if (!dataUrl) return;
    downloadDataUrl(dataUrl, `carton-3d-${size.height}x${size.width}x${size.depth}.png`);
  };

  const onDialogKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (e.key === "Escape" && isFullscreen) {
      e.preventDefault();
      e.stopPropagation();
      exitFullscreen();
      return;
    }
    if (
      (e.key === "f" || e.key === "F") &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      toggleFullscreen();
    } else if (
      (e.key === "h" || e.key === "H") &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      setControlsHidden((v) => !v);
    }
  };

  return (
    <dialog
      ref={dialog}
      className={`carton-3d-dialog${isFullscreen ? " is-fullscreen" : ""}${controlsHidden ? " is-immersive" : ""}`}
      aria-labelledby="carton-3d-title"
      dir={ar ? "rtl" : "ltr"}
      data-fullscreen={isFullscreen ? "true" : "false"}
      onKeyDown={onDialogKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        if (isFullscreen) {
          exitFullscreen();
          return;
        }
        onClose();
      }}
    >
      <header className="carton-3d-header">
        <div className="carton-3d-heading">
          <h2 id="carton-3d-title">
            <Box size={18} />
            {ar ? "معاينة العلبة ثلاثية الأبعاد" : "3D carton preview"}
          </h2>
          <p dir="ltr">
            {size.height} × {size.width} × {size.depth} mm
          </p>
        </div>

        <div className="carton-3d-header-actions">
          <button
            type="button"
            className="carton-3d-icon-action"
            disabled={busy || !!error}
            onClick={downloadSnapshot}
            aria-label={ar ? "حفظ لقطة PNG" : "Save PNG snapshot"}
            title={ar ? "حفظ صورة PNG للمعاينة" : "Save 3D PNG snapshot"}
          >
            <Camera size={15} />
            <span className="carton-3d-action-text">
              {ar ? "لقطة PNG" : "PNG"}
            </span>
          </button>

          <button
            type="button"
            className="carton-3d-icon-action"
            aria-pressed={controlsHidden}
            onClick={() => setControlsHidden((v) => !v)}
            aria-label={
              controlsHidden
                ? ar
                  ? "إظهار أدوات التحكم"
                  : "Show controls"
                : ar
                  ? "إخفاء أدوات التحكم"
                  : "Hide controls"
            }
            title={
              controlsHidden
                ? ar
                  ? "إظهار أدوات التحكم (H)"
                  : "Show controls (H)"
                : ar
                  ? "إخفاء الأدوات لعرض كامل (H)"
                  : "Hide controls (H)"
            }
          >
            {controlsHidden ? <Eye size={15} /> : <EyeOff size={15} />}
            <span className="carton-3d-action-text">
              {controlsHidden
                ? ar
                  ? "إظهار الأدوات"
                  : "Show tools"
                : ar
                  ? "إخفاء الأدوات"
                  : "Hide tools"}
            </span>
          </button>

          <button
            type="button"
            className="carton-3d-icon-action carton-3d-fullscreen-btn"
            data-testid="carton-3d-fullscreen-toggle"
            aria-pressed={isFullscreen}
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen
                ? ar
                  ? "تصغير الشاشة"
                  : "Exit fullscreen"
                : ar
                  ? "ملء الشاشة"
                  : "Fullscreen preview"
            }
            title={
              isFullscreen
                ? ar
                  ? "تصغير الشاشة (Esc / F)"
                  : "Exit fullscreen (Esc / F)"
                : ar
                  ? "معاينة بملء الشاشة (F)"
                  : "Fullscreen preview (F)"
            }
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="carton-3d-action-text">
              {isFullscreen
                ? ar
                  ? "تصغير الشاشة"
                  : "Exit full"
                : ar
                  ? "ملء الشاشة"
                  : "Fullscreen"}
            </span>
          </button>

          <button
            type="button"
            className="carton-3d-close-btn"
            aria-label={ar ? "إغلاق المعاينة" : "Close preview"}
            onClick={() => {
              if (isFullscreen) exitFullscreen();
              onClose();
            }}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className="carton-3d-stage-shell" data-backdrop={backdrop}>
        <div
          className="carton-3d-stage"
          ref={host}
          data-testid="carton-3d-stage"
          data-ready={!busy && !error}
          data-fold={fold}
          data-quality={quality}
          data-lighting={lighting}
          data-backdrop={backdrop}
          data-edges={edgesVisible ? "true" : "false"}
          data-autorotate={autoRotate ? "true" : "false"}
        >
          {busy && (
            <div className="carton-3d-status" role="status">
              {ar
                ? "جاري تجميع العلبة من تصميمك…"
                : "Assembling your carton artwork…"}
            </div>
          )}
          {error && (
            <div className="carton-3d-status is-error" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => setRevision((v) => v + 1)}>
                {ar ? "إعادة التحميل" : "Reload preview"}
              </button>
            </div>
          )}
        </div>

        {!busy && !error && (
          <div
            className="carton-3d-hud"
            role="toolbar"
            aria-label={ar ? "أدوات التحريك السريع" : "Quick stage tools"}
          >
            <div className="carton-3d-hud-group">
              <button
                type="button"
                aria-pressed={interactionMode === "orbit"}
                onClick={() => switchMode("orbit")}
                aria-label={ar ? "وضع التدوير الحر" : "Orbit mode"}
                title={ar ? "تدوير حر 360°" : "360° Orbit"}
              >
                <Rotate3d size={14} />
                <span>{ar ? "تدوير" : "Orbit"}</span>
              </button>
              <button
                type="button"
                aria-pressed={interactionMode === "pan"}
                onClick={() => switchMode("pan")}
                aria-label={ar ? "وضع تحريك الكاميرا" : "Pan mode"}
                title={ar ? "تحريك الكاميرا" : "Pan camera"}
              >
                <Hand size={14} />
                <span>{ar ? "تحريك" : "Pan"}</span>
              </button>
            </div>

            <div className="carton-3d-hud-group">
              <button
                type="button"
                onClick={() => engine.current?.zoomBy(0.82)}
                aria-label={ar ? "تكبير المعاينة" : "Zoom in"}
                title={ar ? "تكبير (+)" : "Zoom in (+)"}
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => engine.current?.zoomBy(1.22)}
                aria-label={ar ? "تصغير المعاينة" : "Zoom out"}
                title={ar ? "تصغير (-)" : "Zoom out (-)"}
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                aria-pressed={autoRotate}
                onClick={toggleAutoSpin}
                aria-label={ar ? "دوران تلقائي 360°" : "Auto-rotate 360°"}
                title={ar ? "عرض دائري تلقائي 360°" : "360° Turntable"}
              >
                <RotateCw size={14} />
                <span>{ar ? "دوران تلقائي" : "Spin"}</span>
              </button>
              <button
                type="button"
                aria-pressed={foldPlaying}
                onClick={() => setFoldPlaying((v) => !v)}
                aria-label={ar ? "تشغيل حركة الطي" : "Animate folding"}
                title={
                  ar
                    ? "محاكاة طي وفرد العلبة تلقائياً"
                    : "Animate carton fold & unfold"
                }
              >
                {foldPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{ar ? "حركة الطي" : "Fold"}</span>
              </button>
              <button
                type="button"
                aria-pressed={edgesVisible}
                onClick={toggleEdges}
                aria-label={ar ? "إظهار خطوط الحواف والطي" : "Show fold edges"}
                title={ar ? "إظهار حدود القطع والطي" : "Inspect panel edges"}
              >
                <Grid2x2 size={14} />
                <span>{ar ? "الحواف" : "Edges"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {!controlsHidden && (
        <div className="carton-3d-controls">
          <div className="carton-3d-quality">
            <label>
              <span>{ar ? "وضوح المعاينة" : "Preview clarity"}</span>
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
              <span>{ar ? "ملمس الورق" : "Paper finish"}</span>
              <select
                aria-label={ar ? "خامة العلبة" : "Carton finish"}
                value={finish}
                disabled={busy || !!error}
                onChange={(e) => {
                  const next = e.target.value as CartonFinish;
                  setFinish(next);
                  engine.current?.setFinish(next);
                }}
              >
                <option value="matte">{ar ? "مطفي" : "Matte"}</option>
                <option value="satin">
                  {ar ? "ساتان · لمعان خفيف" : "Satin · soft sheen"}
                </option>
                <option value="glossy">
                  {ar ? "لامع فاخر · UV" : "Glossy UV"}
                </option>
                <option value="kraft">
                  {ar ? "كرتون كرافت طبيعي" : "Natural Kraft"}
                </option>
              </select>
            </label>

            <label>
              <span>{ar ? "إضاءة الاستوديو" : "Studio lighting"}</span>
              <select
                aria-label={ar ? "إضاءة المعاينة" : "Preview lighting"}
                value={lighting}
                disabled={busy || !!error}
                onChange={(e) => {
                  const next = e.target.value as CartonLighting;
                  setLighting(next);
                  engine.current?.setLighting(next);
                }}
              >
                <option value="studio">
                  {ar ? "متوازنة · استوديو" : "Balanced studio"}
                </option>
                <option value="warm">
                  {ar ? "دافئة فاخرة" : "Warm luxury"}
                </option>
                <option value="daylight">
                  {ar ? "نهارية ساطعة" : "Bright daylight"}
                </option>
                <option value="dramatic">
                  {ar ? "تباين درامي" : "Dramatic rim"}
                </option>
              </select>
            </label>

            <label>
              <span>{ar ? "خلفية العرض" : "Stage backdrop"}</span>
              <select
                aria-label={ar ? "خلفية المعاينة" : "Stage backdrop"}
                value={backdrop}
                onChange={(e) => setBackdrop(e.target.value as StageBackdrop)}
              >
                <option value="neutral">{ar ? "محايدة" : "Neutral"}</option>
                <option value="light">{ar ? "فاتحة نقية" : "Pure light"}</option>
                <option value="dark">{ar ? "داكنة فاخرة" : "Studio dark"}</option>
                <option value="grid">
                  {ar ? "شبكة شفافة" : "Checkerboard"}
                </option>
              </select>
            </label>
          </div>

          <div
            className="carton-3d-views"
            role="group"
            aria-label={ar ? "اتجاه المعاينة" : "Preview direction"}
          >
            {(Object.keys(names) as View[]).map((view) => (
              <button
                type="button"
                key={view}
                aria-pressed={activeView === view}
                disabled={busy || !!error}
                onClick={() => selectView(view)}
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
              <span>{ar ? "تجميع العلبة" : "Assembly"}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={fold}
                disabled={busy || !!error}
                aria-label={
                  ar ? "درجة تجميع العلبة" : "Carton assembly progress"
                }
                onChange={(e) => changeFold(Number(e.target.value))}
              />
              <output>{fold}%</output>
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
              onClick={() => {
                setAutoRotate(false);
                engine.current?.setAutoRotate(false);
                setActiveView("perspective");
                engine.current?.view("perspective");
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
