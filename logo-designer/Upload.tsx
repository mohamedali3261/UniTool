/** صور مضمنة فقط؛ لا تحميل تنفيذي أو روابط خارجية. */
import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useDesigner } from "./state";
import { imageCanvas, removeBackground, traceRuns } from "./image-tools";
export default function Upload() {
  const s = useDesigner(),
    input = useRef<HTMLInputElement>(null),
    [image, setImage] = useState(""),
    [original, setOriginal] = useState(""),
    [busy, setBusy] = useState(false),
    [tolerance, setTolerance] = useState(55),
    [error, setError] = useState("");
  async function read(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 12 * 1024 * 1024
    ) {
      setError(
        s.t(
          "ارفع PNG أو JPG أو WebP بحد 12 ميجا.",
          "Use PNG, JPG or WebP up to 12MB.",
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const c = await imageCanvas(url);
      const normalized = c.toDataURL("image/png");
      setImage(normalized);
      setOriginal(normalized);
    } catch {
      setError(s.t("تعذّر قراءة الصورة.", "Unable to read this image."));
    } finally {
      setBusy(false);
    }
  }
  async function process(vector = false) {
    if (!image) return;
    setBusy(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 0));
      const c = await imageCanvas(
          vector ? image : original,
          vector ? 128 : 1024,
        ),
        ctx = c.getContext("2d")!,
        data = ctx.getImageData(0, 0, c.width, c.height);
      if (vector) {
        const paths = traceRuns(data.data, c.width, c.height);
        if (paths.length > 100) throw new Error();
        s.add([
          {
            kind: "vector",
            name: s.t("رسم متجهي محوّل", "Traced vector"),
            paths,
            w: 250,
            h: (250 * c.height) / c.width,
            recolor: false,
          },
        ]);
        s.setNotice(
          s.t(
            "تم التحويل إلى مسارات متجهة مبسطة؛ النتيجة تعتمد على وضوح الصورة.",
            "Converted to simplified vector paths; quality depends on the source.",
          ),
        );
      } else {
        data.data.set(
          removeBackground(data.data, c.width, c.height, tolerance),
        );
        ctx.putImageData(data, 0, 0);
        setImage(c.toDataURL("image/png"));
      }
    } catch {
      setError(
        s.t(
          "الصورة معقدة أو تعذّر تحويلها؛ جرّب رسم أبسط.",
          "This image is too complex or could not be processed. Try a simpler mark.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ld-section">
      <p className="ld-eyebrow">GIVE AN OLD MARK NEW LIFE</p>
      <h2>{s.t("من صورة… لفكرة جديدة.", "A fresh start for an old mark.")}</h2>
      <input
        ref={input}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          void read(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <button
        className="ld-dropzone"
        disabled={busy}
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void read(e.dataTransfer.files[0]);
        }}
      >
        <UploadCloud size={32} />
        <strong>
          {s.t("اسحب صورة أو اختار ملف", "Drop an image or choose a file")}
        </strong>
        <small>PNG · JPG · WEBP / 12 MB</small>
      </button>
      <p>
        {s.t(
          "معالجة محلية. إزالة الخلفية للون متصل بالحواف، والتحويل المتجهي للرسومات البسيطة؛ مش بديل تتبّع احترافي للصور الفوتوغرافية.",
          "Processed locally. Background removal targets edge-connected colors; tracing suits simple graphics, not photographic detail.",
        )}
      </p>
      {image && (
        <>
          <div className="ld-upload-preview">
            <img src={image} alt={s.t("معاينة الصورة", "Image preview")} />
          </div>
          <label className="ld-field">
            {s.t("حساسية إزالة الخلفية", "Background tolerance")}
            <input
              type="range"
              min="0"
              max="220"
              value={tolerance}
              onChange={(e) => setTolerance(+e.target.value)}
            />
          </label>
          <button
            className="ld-secondary"
            disabled={busy}
            onClick={() => void process()}
          >
            {s.t("إزالة الخلفية", "Remove background")}
          </button>
          <button
            className="ld-secondary"
            disabled={busy}
            onClick={() => {
              setImage(original);
            }}
          >
            {s.t("استعادة الصورة", "Reset image")}
          </button>
          <button
            className="ld-primary ld-full"
            disabled={busy}
            onClick={() =>
              s.add([
                {
                  kind: "image",
                  asset: image,
                  name: s.t("صورة مرفوعة", "Uploaded image"),
                  w: 260,
                  h: 260,
                },
              ])
            }
          >
            {s.t("إضافة للوحة", "Add to canvas")}
          </button>
          <button
            className="ld-secondary"
            disabled={busy}
            onClick={() => void process(true)}
          >
            {s.t("تحويل مبسّط إلى Vector وإضافة", "Trace simple vector & add")}
          </button>
        </>
      )}
      {busy && <p role="status">{s.t("جاري المعالجة…", "Processing…")}</p>}
      {error && (
        <p role="alert" className="ld-error">
          {error}
        </p>
      )}
    </section>
  );
}
