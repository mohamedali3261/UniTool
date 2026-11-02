import { useRef, useState } from "react";
import { Upload, FileText, ArrowLeft, LockKeyhole } from "lucide-react";
import type { Translate } from "../../core/types";
export function UploadCard({
  load,
  loading,
  t,
}: {
  load: (f: File) => void;
  loading: boolean;
  t: Translate;
}) {
  const input = useRef<HTMLInputElement>(null),
    [over, setOver] = useState(false);
  return (
    <section
      className={"ps-upload " + (over ? "is-over" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!loading && e.dataTransfer.files[0]) load(e.dataTransfer.files[0]);
      }}
    >
      <div className="ps-paper-stack" aria-hidden="true">
        <i />
        <i />
        <div>
          <FileText size={32} />
          <b>PDF</b>
          <span />
          <span />
          <em>أ ب ت</em>
        </div>
      </div>
      <small>YOUR NEXT CLEAR CHAPTER.</small>
      <h2>
        {t("افتح الملف. وسيب الباقي علينا.", "Open a file. Find your flow.")}
      </h2>
      <p>
        {t(
          "اسحب مستندك هنا، أو اختاره من جهازك.",
          "Drop your document here, or choose it from your device.",
        )}
      </p>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        aria-label={t("فتح ملف PDF", "Open PDF file")}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) load(f);
        }}
        hidden
      />
      <button
        className="ps-button primary"
        disabled={loading}
        onClick={() => input.current?.click()}
      >
        <Upload size={17} />
        {loading
          ? t("بنجهّز مستندك…", "Preparing your document…")
          : t("اختار ملف PDF", "Choose a PDF")}
        <ArrowLeft size={15} />
      </button>
      <div className="ps-upload-meta">
        <span>PDF · 25 MB · {t("حتى 100 صفحة", "up to 100 pages")}</span>
        <span>
          <LockKeyhole size={11} />
          {t("بدون رفع أو حساب", "No uploads. No account.")}
        </span>
      </div>
    </section>
  );
}
