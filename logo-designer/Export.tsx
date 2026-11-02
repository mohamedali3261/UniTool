/** تنزيل فعلي بصيغ متعددة مع تحميل أدوات PDF وZIP عند الطلب. */
import { useState } from "react";
import { Download, PackageCheck } from "lucide-react";
import { useDesigner } from "./state";
import { Modal, NumberField } from "./ui";
import {
  download,
  portableSVG,
  raster,
  kitVariant,
  safeName,
  exportSize,
} from "./export-tools";
export default function Export() {
  const s = useDesigner(),
    [format, setFormat] = useState("png"),
    [width, setWidth] = useState(1600),
    [height, setHeight] = useState(1200),
    [transparent, setTransparent] = useState(!s.doc.background),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run(kit = false) {
    setBusy(true);
    setMessage("");
    try {
      const p = {
          ...s.doc,
          background: transparent ? "" : s.doc.background || "#ffffff",
        },
        name = safeName(p.name);
      if (kit) {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        zip.file("logo.svg", await portableSVG(p));
        const size = exportSize(p, 1600);
        zip.file("logo.png", await raster(p, size.width, size.height));
        zip.file(
          "logo-bw.svg",
          await portableSVG({ ...p, background: "" }, true),
        );
        const square = kitVariant(p, "square");
        zip.file("favicon.png", await raster(square, 64, 64));
        zip.file("profile.png", await raster(square, 512, 512));
        for (const mode of ["horizontal", "vertical"] as const) {
          const variant = kitVariant(p, mode);
          zip.file(`logo-${mode}.svg`, await portableSVG(variant));
        }
        zip.file("project.json", JSON.stringify(p, null, 2));
        zip.file(
          "README.txt",
          "UniTool Logo Designer\nSVG files include bundled fonts. PNGs are raster images. Layout variants are editable SVG compositions; check spacing before publication.\n",
        );
        download(
          await zip.generateAsync({ type: "blob" }),
          name + "-brand-kit.zip",
        );
      } else if (format === "json")
        download(
          new Blob([JSON.stringify(p, null, 2)], { type: "application/json" }),
          name + ".json",
        );
      else if (format === "svg")
        download(
          new Blob([await portableSVG(p)], { type: "image/svg+xml" }),
          name + ".svg",
        );
      else if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const image = await raster(
          { ...p, background: p.background || "#ffffff" },
          width,
          height,
        );
        const data = await image.arrayBuffer();
        const pdf = new jsPDF({
          orientation: width >= height ? "landscape" : "portrait",
          unit: "px",
          format: [width, height],
          hotfixes: ["px_scaling"],
        });
        pdf.addImage(new Uint8Array(data), "PNG", 0, 0, width, height);
        download(pdf.output("blob"), name + ".pdf");
      } else
        download(
          await raster(
            p,
            width,
            height,
            format === "jpg" ? "image/jpeg" : "image/png",
          ),
          `${name}.${format}`,
        );
      setMessage(
        s.t("تم تجهيز الملف وتنزيله.", "Your file is ready and downloaded."),
      );
    } catch (e) {
      console.error(e);
      setMessage(
        s.t(
          "تعذّر التصدير. جرّب أبعاد أصغر أو راجع الصور والخطوط.",
          "Export failed. Try smaller dimensions or check images and fonts.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={s.t("فكرتك، جاهزة للعالم.", "Your mark. Ready for the world.")}
    >
      <div className="ld-export">
        <p>
          {s.t(
            "SVG بخطوط مضمّنة، صور عالية الجودة، ونسخة مشروع قابلة للاسترجاع.",
            "Portable SVG with embedded fonts, high-resolution images and editable project backups.",
          )}
        </p>
        <div className="ld-format-tabs">
          {["png", "svg", "jpg", "pdf", "json"].map((f) => (
            <button
              key={f}
              aria-pressed={format === f}
              onClick={() => setFormat(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        {["png", "jpg", "pdf"].includes(format) && (
          <>
            <div className="ld-chips">
              {[512, 1024, 2048].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    const dims = exportSize(s.doc, size);
                    setWidth(dims.width);
                    setHeight(dims.height);
                  }}
                >
                  {size}px
                </button>
              ))}
            </div>
            <div className="ld-two">
              <NumberField
                label={s.t("عرض التصدير", "Export width")}
                value={width}
                min={32}
                max={4096}
                onChange={setWidth}
              />
              <NumberField
                label={s.t("ارتفاع التصدير", "Export height")}
                value={height}
                min={32}
                max={4096}
                onChange={setHeight}
              />
            </div>
            <p>
              {s.t(
                "للنتيجة الطبيعية اختار مقاس جاهز بنفس نسبة اللوحة. PDF صورة عالية الدقة داخل مستند، مش مسارات متجهة.",
                "Presets preserve the artboard ratio. Custom dimensions stretch to fit. PDF contains a high-resolution raster, not vector outlines.",
              )}
            </p>
          </>
        )}
        {["png", "svg"].includes(format) && (
          <label className="ld-check">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(e) => setTransparent(e.target.checked)}
            />
            {s.t("خلفية شفافة", "Transparent background")}
          </label>
        )}
        <button
          className="ld-primary ld-full"
          disabled={busy}
          onClick={() => void run()}
        >
          <Download size={18} />
          {busy
            ? s.t("جاري تجهيز الملفات…", "Preparing files…")
            : s.t("تنزيل الملف", "Download file")}
        </button>
        <div className="ld-kit">
          <PackageCheck size={28} />
          <h3>{s.t("حزمة العلامة كاملة", "The whole brand kit")}</h3>
          <p>
            SVG · PNG · B&W · Favicon · Profile · Horizontal · Vertical · JSON
          </p>
          <button
            className="ld-secondary"
            disabled={busy}
            onClick={() => void run(true)}
          >
            {s.t("تنزيل حزمة ZIP", "Download ZIP kit")}
          </button>
        </div>
        <p role="status">{message}</p>
      </div>
    </Modal>
  );
}
