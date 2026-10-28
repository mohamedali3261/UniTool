import { StudioSelect } from "../../components/StudioSelect";
import { useStudioSettings } from "../../settings/StudioSettings";
import { useRef, useState, useEffect } from "react";
import { Download, Check, ShieldCheck, X } from "lucide-react";
import { Asset, Project, durationOf, timeLabel } from "../../types";
import { download } from "../../lib/media";
import { exportVideo } from "../../lib/export";
export function ExportDialog({
  project,
  assets,
  onClose,
}: {
  project: Project;
  assets: Asset[];
  onClose: () => void;
}) {
  const { preferences } = useStudioSettings();
  const lightweight = preferences.quality === "light";
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [bitrate, setBitrate] = useState(lightweight ? 2 : 4);
  const [stage, setStage] = useState("");
  const [height, setHeight] = useState(lightweight ? 480 : 720);
  const [progress, setProgress] = useState(-1);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const busy = progress >= 0 && !done;
  async function run() {
    setError("");
    setProgress(0);
    abort.current = new AbortController();
    try {
      const blob = await exportVideo(
        project,
        assets,
        height,
        setProgress,
        abort.current.signal,
        { format, fps, bitrateMbps: bitrate, onStage: setStage },
      );
      setResult(blob);
      setDone(true);
      download(blob, `${project.name}.${format}`);
    } catch (e) {
      setError(
        abort.current?.signal.aborted
          ? "تم إلغاء التصدير"
          : (e as Error).message,
      );
      setProgress(-1);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <div className="field-heading">
          <span className="eyebrow">جاهز للعالم؟</span>
          <button
            aria-label="إغلاق"
            onClick={() => {
              abort.current?.abort();
              onClose();
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="export-icon">{done ? <Check /> : <Download />}</div>
        <h2 id="export-title">
          {done ? "فيديوك بقى جاهز!" : "آخر خطوة… وشارك حكايتك."}
        </h2>
        <p className="muted">
          {project.name} • {timeLabel(durationOf(project))} • {project.ratio}
        </p>
        {!done && (
          <>
            <label className="field-label">
              صيغة الفيديو
              <StudioSelect
                label="صيغة التصدير"
                disabled={busy}
                value={format}
                onValueChange={(v) => setFormat(v as "mp4" | "webm")}
                options={[
                  {
                    value: "mp4",
                    label: "MP4",
                    description: "الأنسب للنشر والمشاركة",
                  },
                  {
                    value: "webm",
                    label: "WebM",
                    description: "تصدير مباشر للويب",
                  },
                ]}
              />
            </label>
            <label className="field-label">
              دقة التصدير
              <StudioSelect
                label="دقة التصدير"
                disabled={busy}
                value={height}
                onValueChange={(v) => setHeight(+v)}
                options={[
                  { value: 480, label: "480p — خفيف وسريع" },
                  { value: 720, label: "720p — جودة ممتازة" },
                  { value: 1080, label: "1080p — Full HD" },
                ]}
              />
            </label>
            <div className="two-fields export-settings">
              <label>
                الإطارات / ثانية
                <StudioSelect
                  label="الإطارات في الثانية"
                  disabled={busy}
                  value={fps}
                  onValueChange={(v) => setFps(+v as 24 | 30 | 60)}
                  options={[24, 30, 60].map((n) => ({
                    value: n,
                    label: `${n} FPS`,
                  }))}
                />
              </label>
              <label>
                جودة الترميز
                <StudioSelect
                  label="جودة الترميز"
                  disabled={busy}
                  value={bitrate}
                  onValueChange={(v) => setBitrate(+v)}
                  options={[
                    { value: 2, label: "اقتصادي · 2 Mbps" },
                    { value: 4, label: "متوازن · 4 Mbps" },
                    { value: 8, label: "عالي · 8 Mbps" },
                  ]}
                />
              </label>
            </div>
            <div className="export-info">
              <b>
                {format.toUpperCase()} · {fps} إطار/ثانية
              </b>
              <p>
                يشمل المقاطع والنصوص والفلاتر والصوت. الدقة المحددة هي ارتفاع
                الفيديو. التصدير بيتم في الوقت الحقيقي — سيب الصفحة مفتوحة لحد
                ما يخلص.
              </p>
              {format === "mp4" && (
                <p>
                  لو المتصفح لا يدعم MP4 مباشرة، بنحوّل الفيديو محليًا إلى H.264
                  + AAC. المحرك (~32 MB) يُحمّل من نفس الموقع عند الحاجة؛
                  التحويل يحتاج وقت وذاكرة إضافية.
                </p>
              )}
            </div>
          </>
        )}
        {busy && (
          <div className="progress-section">
            <div>
              <span>{stage || "بنجهّز فيديوك…"}</span>
              <b>{progress}%</b>
            </div>
            <progress max={100} value={progress} />
            <button
              className="danger-link"
              onClick={() => abort.current?.abort()}
            >
              إلغاء التصدير
            </button>
          </div>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {done ? (
          <button
            className="primary full-width"
            onClick={() =>
              result && download(result, `${project.name}.${format}`)
            }
          >
            <Download size={18} /> تنزيل مرة أخرى
          </button>
        ) : (
          !busy && (
            <button className="primary full-width" onClick={() => void run()}>
              <Download size={18} /> تصدير الفيديو
            </button>
          )
        )}
        <span className="export-private">
          <ShieldCheck size={15} /> على جهازك بالكامل. بدون علامة مائية.
        </span>
      </section>
    </div>
  );
}
