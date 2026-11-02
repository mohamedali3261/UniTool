import { useState } from "react";
import type { Design, Lang } from "../../core/model";
import { designBlob, download } from "../../core/export";
import { tr } from "./sections/shared";
import { Download, Copy } from "lucide-react";
export function ExportBar({
  design,
  lang,
  fontReady,
}: {
  design: Design;
  lang: Lang;
  fontReady: boolean;
}) {
  const [format, setFormat] = useState<"png" | "jpeg" | "svg">("png"),
    [scale, setScale] = useState(1),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run(copy = false) {
    setMessage("");
    setBusy(true);
    try {
      if (copy) {
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined")
          throw Error("CLIPBOARD");
        const work = designBlob(design, "png", scale);
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": work }),
        ]);
      } else {
        const blob = await designBlob(design, format, scale);
        download(blob, `unitool-text.${format === "jpeg" ? "jpg" : format}`);
      }
      setMessage(
        tr(
          lang,
          copy ? "تم نسخ الصورة." : "تم تجهيز الملف وتحميله.",
          copy ? "Image copied." : "File downloaded.",
        ),
      );
    } catch {
      setMessage(
        tr(
          lang,
          "تعذرت العملية. جرّب تنزيل PNG بدل النسخ، وتأكد من السماح بالحافظة.",
          "Operation failed. Try downloading PNG instead of copying and check clipboard permissions.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="export-area">
      <div className="export-row">
        <label>
          <span className="sr-only">
            {tr(lang, "صيغة التصدير", "Export format")}
          </span>
          <select
            aria-label={tr(lang, "صيغة التصدير", "Export format")}
            value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="svg">SVG</option>
          </select>
        </label>
        <label>
          <span className="sr-only">
            {tr(lang, "دقة التصدير", "Export scale")}
          </span>
          <select
            aria-label={tr(lang, "دقة التصدير", "Export scale")}
            value={scale}
            disabled={format === "svg"}
            onChange={(e) => setScale(Number(e.target.value))}
          >
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </label>
        <button
          type="button"
          className="primary"
          disabled={busy || !fontReady || !design.text.trim()}
          onClick={() => run()}
        >
          <Download size={17} />
          {busy
            ? tr(lang, "جارٍ التجهيز…", "Preparing…")
            : tr(lang, "تحميل التصميم", "Download design")}
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={tr(lang, "نسخ التصميم كصورة", "Copy design as image")}
          disabled={busy || !fontReady || !design.text.trim()}
          onClick={() => run(true)}
        >
          <Copy size={18} />
        </button>
      </div>
      {format === "jpeg" && design.background === "transparent" && (
        <p className="hint">
          {tr(
            lang,
            "JPG لا يدعم الشفافية؛ ستُستخدم خلفية بيضاء.",
            "JPG does not support transparency; a white background is used.",
          )}
        </p>
      )}
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
      <p className="hint">
        {tr(
          lang,
          "PNG للشفافية، وSVG بخط مضمّن. النص في SVG قابل للتحديد وليس مسارات. رموز الإيموجي تعتمد على خطوط الجهاز.",
          "PNG supports transparency. SVG embeds the selected font and keeps selectable text, not paths. Emoji appearance depends on device fonts.",
        )}
      </p>
    </div>
  );
}
