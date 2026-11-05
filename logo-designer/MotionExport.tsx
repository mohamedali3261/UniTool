import { useEffect, useRef, useState } from "react";
import { Download, Film } from "lucide-react";
import { useDesigner } from "./state";
import { motionPresets, motionSettings } from "./motion";
import {
  exportMotionGif,
  exportMotionVideo,
  exportMotionWebP,
  webpSupported,
  motionOutputSize,
  videoFormat,
} from "./motion-export";
import { download, safeName } from "./export-tools";
import "./motion.css";
export default function MotionExport() {
  const s = useDesigner(),
    [format, setFormat] = useState("gif"),
    [size, setSize] = useState(512),
    [quality, setQuality] = useState("balanced"),
    [repeats, setRepeats] = useState(1),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [message, setMessage] = useState("");
  const abort = useRef<AbortController | null>(null),
    mounted = useRef(true),
    video = videoFormat(),
    settings = motionSettings(s.doc);
  const webp = webpSupported(),
    dims = motionOutputSize(s.doc, size),
    fps = quality === "light" ? 10 : format === "video" ? 24 : 20;
  const options = {
    fps: fps as 10 | 20 | 24,
    repeats,
    quality: quality === "high" ? 0.95 : quality === "light" ? 0.6 : 0.8,
    videoBitrate:
      quality === "high"
        ? 8_000_000
        : quality === "light"
          ? 1_000_000
          : 4_000_000,
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  async function run() {
    if (abort.current) return;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setMessage("");
    setProgress(0);
    try {
      const report = (n: number) => {
        if (mounted.current) setProgress(n);
      };
      const result =
        format === "gif"
          ? {
              blob: await exportMotionGif(
                s.doc,
                Math.min(size, 512),
                controller.signal,
                report,
                options,
              ),
              extension: "gif",
            }
          : format === "webp"
            ? {
                blob: await exportMotionWebP(
                  s.doc,
                  size,
                  controller.signal,
                  report,
                  options,
                ),
                extension: "webp",
              }
            : await exportMotionVideo(
                s.doc,
                size,
                controller.signal,
                report,
                options,
              );
      controller.signal.throwIfAborted();
      download(
        result.blob,
        `${safeName(s.doc.name)}-animated.${result.extension}`,
      );
      if (mounted.current)
        setMessage(
          s.t("تم تجهيز الشعار المتحرك وتنزيله.", "Animated logo downloaded."),
        );
    } catch (error) {
      if (mounted.current)
        setMessage(
          controller.signal.aborted
            ? s.t("تم إلغاء التصدير.", "Export cancelled.")
            : s.t(
                "تعذّر التصدير. جرّب مقاس أصغر ومتصفح حديث، واترك الصفحة ظاهرة أثناء الفيديو.",
                "Export failed. Try a smaller size and a current browser; keep this tab visible during video recording.",
              ) + (error instanceof Error ? ` (${error.message})` : ""),
        );
    } finally {
      abort.current = null;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section
      className="ld-motion-export"
      aria-label={s.t("تصدير شعار متحرك", "Animated logo export")}
    >
      <div className="ld-motion-label">
        <Film size={18} />
        <strong>{s.t("شعارك، في حركة.", "Your mark, in motion.")}</strong>
      </div>
      <p>
        {motionPresets.find((p) => p.id === settings.preset)?.[s.lang]} ·{" "}
        {settings.duration}s
      </p>
      <fieldset disabled={busy}>
        <label className="ld-field">
          {s.t("صيغة الحركة", "Animation format")}
          <select
            aria-label={s.t("صيغة الحركة", "Animation format")}
            value={format}
            onChange={(e) => {
              setFormat(e.target.value);
              setSize(512);
            }}
          >
            <option value="gif">GIF</option>
            <option value="webp" disabled={!webp}>
              {s.t("WebP متحرك", "Animated WebP")}
            </option>
            <option value="video" disabled={!video}>
              {s.t("فيديو", "Video")} ·{" "}
              {video?.extension.toUpperCase() ||
                s.t("غير مدعوم", "Unavailable")}
            </option>
          </select>
        </label>
        <label className="ld-field">
          {s.t("جودة التصدير", "Export quality")}
          <select
            aria-label={s.t("جودة التصدير", "Export quality")}
            value={quality}
            onChange={(e) => {
              setQuality(e.target.value);
              setSize(
                e.target.value === "light"
                  ? 256
                  : e.target.value === "high" && format !== "gif"
                    ? 1024
                    : 512,
              );
            }}
          >
            <option value="light">
              {s.t("خفيف للمشاركة", "Lightweight sharing")}
            </option>
            <option value="balanced">{s.t("متوازن", "Balanced")}</option>
            <option value="high">{s.t("أعلى جودة", "High quality")}</option>
          </select>
        </label>
        {format === "video" && (
          <label className="ld-field">
            {s.t("تكرار الحركة في الفيديو", "Video repeat count")}
            <select
              aria-label={s.t("تكرار الحركة في الفيديو", "Video repeat count")}
              value={repeats}
              onChange={(e) => setRepeats(Number(e.target.value))}
            >
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="ld-field">
          {s.t("أطول ضلع", "Longest edge")}
          <select
            aria-label={s.t("مقاس الحركة", "Animation size")}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          >
            {(format === "gif" ? [256, 384, 512] : [256, 512, 768, 1024]).map(
              (n) => (
                <option key={n} value={n}>
                  {n}px
                </option>
              ),
            )}
          </select>
        </label>
        <p
          className="ld-motion-export-summary"
          aria-label={s.t("مواصفات الملف", "File specifications")}
          dir="ltr"
        >
          {dims.width} × {dims.height}px ·{" "}
          {settings.duration * (format === "video" ? repeats : 1)}s ·{" "}
          {format === "video" ? "≤ " : ""}
          {fps} fps ·{" "}
          {format === "gif"
            ? "GIF"
            : format === "webp"
              ? "Animated WebP"
              : video?.extension.toUpperCase()}
        </p>
        <p>
          {format === "gif"
            ? s.t(
                "حلقة متكررة · حتى 20 إطار/ثانية · يحافظ على خلفية التصميم أو الشفافية. ألوان GIF محدودة، والشفافية حادة الحواف.",
                "Looping · up to 20 fps · preserves your background or transparency. GIF has limited colors and hard-edged transparency.",
              )
            : format === "webp"
              ? s.t(
                  "WebP متحرك بحلقة متكررة وشفافية ناعمة. الجودة تتحكم في ضغط كل إطار.",
                  "Animated WebP with looping and smooth transparency. Quality controls per-frame compression.",
                )
              : s.t(
                  "تكرار حسب اختيارك · حتى 24 إطار/ثانية · الصيغة المتاحة يحددها المتصفح. الخلفية الشفافة تصبح بيضاء. اترك الصفحة ظاهرة أثناء التسجيل.",
                  "Your chosen repeat count · up to 24 fps · format depends on your browser. Transparent backgrounds become white. Keep this tab visible while recording.",
                )}
        </p>
        {!video && (
          <p role="status">
            {s.t(
              "الفيديو غير مدعوم هنا؛ GIF متاح. جرّب متصفح Chrome أو Edge أو Safari حديث.",
              "Video recording is unavailable here; GIF still works. Try a current Chrome, Edge or Safari.",
            )}
          </p>
        )}
        <button
          className="ld-primary ld-full"
          disabled={
            !s.doc.nodes.some((n) => !n.hidden) ||
            (format === "video" && !video) ||
            (format === "webp" && !webp)
          }
          onClick={() => void run()}
        >
          <Download size={17} />
          {s.t("تنزيل الشعار المتحرك", "Download animated logo")}
        </button>
      </fieldset>
      {busy && (
        <div className="ld-motion-progress">
          <progress
            aria-label={s.t("تقدم التصدير", "Export progress")}
            value={progress}
            max="1"
          />
          <span role="status">
            {s.t("جاري التصدير…", "Exporting…")} {Math.round(progress * 100)}%
          </span>
          <button
            className="ld-secondary"
            onClick={() => abort.current?.abort()}
          >
            {s.t("إلغاء التصدير", "Cancel export")}
          </button>
        </div>
      )}
      <p role="status">{message}</p>
      <p>
        {s.t(
          "للرجوع للتعديل احتفظ أيضًا بنسخة JSON من التصدير العادي. GIF وWebP والفيديو ملفات عرض وليست طبقات قابلة للتحرير.",
          "Also save a JSON backup from the standard export to edit later. GIF, WebP and video are playback files, not editable layers.",
        )}
      </p>
    </section>
  );
}
