import { useEffect, useRef, useState } from "react";
import {
  Search,
  ScanText,
  Copy,
  Download,
  Check,
  AlertTriangle,
  X,
  FileText,
} from "lucide-react";
import type { PdfDoc } from "../../core/pdf";
import { extractPage, saveBlob } from "../../core/pdf";
import { recognizePage } from "../../core/ocr";
import { fullTextMatch } from "../../core/text";
import type {
  PageState,
  PageText,
  OCRResult,
  Translate,
} from "../../core/types";
export function TextPanel({
  doc,
  page,
  pages,
  onSelect,
  extracted,
  onExtract,
  query,
  setQuery,
  t,
  notice,
}: {
  doc: PdfDoc;
  page: PageState;
  pages: PageState[];
  onSelect: (id: string) => void;
  extracted?: PageText;
  onExtract: (source: number, value: PageText) => void;
  query: string;
  setQuery: (s: string) => void;
  t: Translate;
  notice: (s: string) => void;
}) {
  const [mode, setMode] = useState<"source" | "lines">("lines"),
    [ocrResults, setOcrResults] = useState<Record<string, OCRResult>>({}),
    [showOCR, setShowOCR] = useState(false),
    [layout, setLayout] = useState<"auto" | "block" | "sparse">("auto"),
    [progress, setProgress] = useState<number | null>(null),
    [status, setStatus] = useState(""),
    [searching, setSearching] = useState(false),
    [found, setFound] = useState<string[] | null>(null);
  const job = useRef<ReturnType<typeof recognizePage> | null>(null),
    generation = useRef(0),
    scan = useRef(0);
  const ocr = ocrResults[page.id],
    value = showOCR && ocr ? ocr.text : extracted?.[mode] || "";
  useEffect(() => {
    let dead = false;
    setShowOCR(false);
    setFound(null);
    setProgress(null);
    job.current?.cancel();
    job.current = null;
    generation.current++;
    scan.current++;
    setSearching(false);
    if (!extracted)
      void extractPage(doc, page.source)
        .then((v) => {
          if (!dead) onExtract(page.source, v);
        })
        .catch(() => {
          if (!dead)
            notice(
              t(
                "تعذر استخراج النص. جرّب OCR أو ملفًا آخر.",
                "Text extraction failed. Try OCR or another PDF.",
              ),
            );
        });
    return () => {
      dead = true;
    };
  }, [doc, page.source, page.id, page.rotation]);
  useEffect(
    () => () => {
      generation.current++;
      scan.current++;
      job.current?.cancel();
    },
    [],
  );
  const start = async () => {
    const token = ++generation.current;
    setProgress(0);
    setStatus(t("تجهيز القراءة المحلية…", "Preparing local recognition…"));
    const active = recognizePage(
      doc,
      page.source,
      (_, p) => {
        if (token === generation.current) {
          setProgress(Math.round(p * 100));
          setStatus(t("قراءة الصورة…", "Recognizing image…"));
        }
      },
      layout,
      page.rotation,
    );
    job.current = active;
    try {
      const result = await active.promise;
      if (token !== generation.current) return;
      setOcrResults((v) => ({ ...v, [page.id]: result }));
      setShowOCR(true);
    } catch {
      if (token === generation.current)
        notice(
          t(
            "تعذر OCR. قد تكون الذاكرة غير كافية؛ جرّب صفحة أصغر.",
            "OCR failed. Memory may be insufficient; try a smaller page.",
          ),
        );
    } finally {
      if (token === generation.current) {
        setProgress(null);
        job.current = null;
      }
    }
  };
  return (
    <section className="ps-text-panel">
      <header>
        <span>
          <FileText size={16} />
          <b>{t("النص والقراءة", "Text & reading")}</b>
        </span>
        <small>AR / EN</small>
      </header>
      <div className="ps-search">
        <Search size={15} />
        <input
          aria-label={t("البحث في المستند", "Search document")}
          placeholder={t(
            "ابحث بالعربي أو الإنجليزي…",
            "Search Arabic or English…",
          )}
          value={query}
          maxLength={200}
          onChange={(e) => {
            setQuery(e.target.value);
            setFound(null);
            scan.current++;
            setSearching(false);
          }}
        />
        {query && (
          <button
            aria-label={t("مسح البحث", "Clear search")}
            onClick={() => {
              setQuery("");
              setFound(null);
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>
      {query && (
        <div className="ps-search-results">
          <span>
            {fullTextMatch(value, query)
              ? t("موجود بالصفحة الحالية", "Found on this page")
              : t(
                  "غير موجود بالنص المقروء الحالي",
                  "Not found in current text",
                )}
          </span>
          <button
            className="ps-text-action"
            disabled={searching}
            onClick={async () => {
              const token = ++scan.current;
              setSearching(true);
              const matches: string[] = [];
              try {
                for (const p of pages) {
                  if (token !== scan.current) return;
                  const result = await extractPage(doc, p.source);
                  if (token !== scan.current) return;
                  onExtract(p.source, result);
                  if (fullTextMatch(result[mode], query)) matches.push(p.id);
                }
                if (token === scan.current) setFound(matches);
              } catch {
                notice(t("البحث لم يكتمل.", "Search could not complete."));
              } finally {
                if (token === scan.current) setSearching(false);
              }
            }}
          >
            {searching
              ? t("جاري البحث…", "Searching…")
              : t("بحث بكل الصفحات", "Search all pages")}
          </button>
          {found && (
            <div>
              {found.length ? (
                found.map((id) => (
                  <button
                    key={id}
                    className="ps-page-match"
                    onClick={() => onSelect(id)}
                  >
                    {t("صفحة ", "Page ") +
                      (pages.findIndex((p) => p.id === id) + 1)}
                  </button>
                ))
              ) : (
                <p>
                  {t(
                    "لا توجد نتائج في طبقة النص الأصلي. OCR للصفحة الحالية فقط.",
                    "No matches in native text. OCR is current-page only.",
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      <div className="ps-text-source">
        <span
          className={
            "ps-source-badge " +
            (extracted?.warnings.includes("encoding") ? "warning" : "")
          }
        >
          {showOCR && ocr
            ? "OCR"
            : extracted?.characters
              ? t("نص أصلي مستخرج", "Native PDF text")
              : t("لا توجد طبقة نص مقروءة", "No readable text layer")}
        </span>
        <small>
          {value.length} {t("حرف", "characters")}
        </small>
      </div>
      {!showOCR && (
        <label className="ps-order-label">
          {t("ترتيب القراءة", "Reading order")}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="source">
              {t("ترتيب الملف (الأصل)", "File order (original)")}
            </option>
            <option value="lines">
              {t("ترتيب السطور بالموقع", "Position-based lines")}
            </option>
          </select>
        </label>
      )}
      {extracted?.warnings.length > 0 && (
        <div className="ps-warning">
          <AlertTriangle size={14} />
          <span>
            {extracted.warnings.includes("no-text")
              ? t(
                  "غالبًا صفحة مصوّرة. جرّب قراءة الصورة بالأسفل.",
                  "Likely a scanned page. Try OCR below.",
                )
              : extracted.warnings.includes("encoding")
                ? t(
                    "رموز مفقودة أو ترميز خط غير صالح: النص المستخرج قد يكون ناقصًا. جرّب OCR وراجعه مقابل الأصل.",
                    "Missing glyphs or invalid font mappings: extracted text may be incomplete. Try OCR and verify against the page.",
                  )
                : t(
                    "راجع النص مقابل الأصل: الأعمدة قد تؤثران على الترتيب. لا نعكس حروف العربي تلقائيًا.",
                    "Compare with the original: encoding or columns may affect order. Arabic characters are never blindly reversed.",
                  )}
          </span>
        </div>
      )}
      {showOCR && ocr ? (
        <>
          <div className="ps-ocr-confidence">
            {t("ثقة المحرك", "Engine confidence")}: {ocr.confidence.toFixed(1)}%{" "}
            <span>
              {t(
                "ليست نسبة دقة — قد يسقط سطر كامل",
                "Not measured accuracy — entire lines can be missed",
              )}
            </span>
          </div>
          <textarea
            className="ps-extracted-text"
            dir="auto"
            aria-label={t("مراجعة نص OCR", "Review OCR text")}
            value={ocr.text}
            onChange={(e) =>
              setOcrResults((v) => ({
                ...v,
                [page.id]: {
                  ...ocr,
                  text: e.target.value.slice(0, 1_000_000),
                  reviewed: false,
                },
              }))
            }
          />
          <label className="ps-reviewed">
            <input
              type="checkbox"
              checked={ocr.reviewed}
              onChange={(e) =>
                setOcrResults((v) => ({
                  ...v,
                  [page.id]: { ...ocr, reviewed: e.target.checked },
                }))
              }
            />
            {t(
              "راجعت النص مقابل الصورة",
              "I reviewed the text against the image",
            )}
          </label>
        </>
      ) : (
        <textarea
          className="ps-extracted-text"
          dir="auto"
          aria-label={t("النص المستخرج", "Extracted text")}
          value={value}
          readOnly
          placeholder={t("النص الأصلي هيظهر هنا.", "Native text appears here.")}
        />
      )}
      <div className="ps-text-buttons">
        <button
          className="ps-button"
          disabled={!value}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              notice(t("اتنسخ النص.", "Text copied."));
            } catch {
              notice(
                t(
                  "النسخ غير متاح. استخدم تنزيل TXT.",
                  "Clipboard unavailable. Use TXT download.",
                ),
              );
            }
          }}
        >
          <Copy size={13} />
          {t("نسخ", "Copy")}
        </button>
        <button
          className="ps-button"
          disabled={!value}
          onClick={() =>
            saveBlob(
              new Blob(["\uFEFF" + value], {
                type: "text/plain;charset=utf-8",
              }),
              `page-${pages.findIndex((p) => p.id === page.id) + 1}${showOCR ? "-ocr-review" : ""}.txt`,
            )
          }
        >
          <Download size={13} />
          TXT
        </button>
      </div>
      <div className="ps-ocr-card">
        <div>
          <ScanText size={18} />
          <b>{t("اقرأ الصفحة المصوّرة", "Read a scanned page")}</b>
          <span>OCR</span>
        </div>
        <p>
          {t(
            "عربي وإنجليزي على جهازك، بدون رفع. راجع الأسماء والأرقام والتشكيل. النتائج لا تُضاف كطبقة بحث في PDF.",
            "Arabic and English on your device, no uploads. Review names, numbers and diacritics. Results are not embedded as a searchable PDF layer.",
          )}
        </p>
        <label className="ps-order-label">
          {t("تخطيط الصورة", "Image layout")}
          <select
            aria-label={t("تخطيط OCR", "OCR layout")}
            value={layout}
            disabled={progress !== null}
            onChange={(e) => setLayout(e.target.value as typeof layout)}
          >
            <option value="auto">
              {t("تلقائي / أعمدة", "Auto / columns")}
            </option>
            <option value="block">
              {t("فقرة / سطور موحدة", "Single block / lines")}
            </option>
            <option value="sparse">{t("نصوص متفرقة", "Sparse text")}</option>
          </select>
        </label>
        {progress !== null ? (
          <>
            <progress value={progress} max={100} />
            <small>
              {status} {progress}%
            </small>
            <button
              className="ps-button"
              onClick={() => {
                generation.current++;
                job.current?.cancel();
                job.current = null;
                setProgress(null);
              }}
            >
              {t("إلغاء القراءة", "Cancel OCR")}
            </button>
          </>
        ) : (
          <button className="ps-button" onClick={start}>
            <ScanText size={14} />
            {t("قراءة الصفحة بـ OCR", "Run OCR on this page")}
          </button>
        )}
        {ocr && (
          <button
            className="ps-text-action"
            onClick={() => setShowOCR(!showOCR)}
          >
            {showOCR
              ? t("عرض النص الأصلي", "Show native text")
              : t("عرض نتيجة OCR السابقة", "Show previous OCR result")}
          </button>
        )}
      </div>
      <p className="ps-hint">
        {t(
          "البحث يتجاهل التشكيل والتطويل وأشكال الألف والياء. تظليل البحث داخل المقاطع فقط؛ العبارة الممتدة لأكثر من مقطع تظهر نتيجتها في لوحة النص.",
          "Search ignores diacritics, tatweel and common alef/ya variants. On-page highlights match individual runs; cross-run phrases appear in the text results.",
        )}
      </p>
    </section>
  );
}
