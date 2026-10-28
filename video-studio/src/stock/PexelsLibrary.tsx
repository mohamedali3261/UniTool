import { useEvent } from "../hooks/useEvent";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Image,
  Film,
  ExternalLink,
  X,
  RefreshCw,
  CheckCircle2,
  CloudDownload,
} from "lucide-react";
import { StudioSelect } from "../components/StudioSelect";
import type { Asset } from "../types";
import { downloadStock } from "./download";
import { useStockSearch } from "./useStockSearch";
import { StockCard } from "./StockCard";
import { StockPreview } from "./StockPreview";
import {
  stockKey,
  type StockItem,
  type StockOrientation,
  type StockQuality,
  type StockSearch,
} from "./types";
import "./styles.css";
const RECENTS_KEY = "unitool-studio-stock-recent";
function readRecents(): string[] {
  try {
    const data = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(data)
      ? data.filter((v) => typeof v === "string" && v.length <= 100).slice(0, 5)
      : [];
  } catch {
    return [];
  }
}
type Job = { key: string; progress: number | null };
export default function PexelsLibrary({
  assets,
  onImported,
  suspended,
}: {
  assets: Asset[];
  onImported: (asset: Asset) => void;
  suspended: boolean;
}) {
  const [params, setParams] = useState<StockSearch>({
    kind: "image",
    query: "",
    orientation: "all",
  });
  const [draft, setDraft] = useState("");
  const [quality, setQuality] = useState<StockQuality>("hd");
  const [recents, setRecents] = useState(readRecents);
  const [preview, setPreview] = useState<StockItem | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("");
  const [importError, setImportError] = useState("");
  const download = useRef<AbortController>(null);
  const search = useStockSearch(params);
  useEffect(() => () => download.current?.abort(), []);
  useEffect(() => {
    if (suspended) setPreview(null);
  }, [suspended]);
  const submit = (query: string) => {
    const trimmed = query.trim().slice(0, 100);
    setDraft(trimmed);
    setParams((p) => ({ ...p, query: trimmed }));
    if (trimmed) {
      const recent = [trimmed, ...recents.filter((q) => q !== trimmed)].slice(
        0,
        5,
      );
      setRecents(recent);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(recent));
      } catch {
        /* Storage is optional. */
      }
    }
  };
  const existing = (item: StockItem) =>
    assets.find(
      (asset) =>
        asset.type === item.kind &&
        asset.source?.provider === "pexels" &&
        asset.source.id === item.id &&
        asset.source.quality === quality,
    );
  const showPreview = useEvent((item: StockItem) => {
    if (!suspended) setPreview(item);
  });
  const add = useEvent(async (item: StockItem) => {
    if (download.current || suspended) return;
    setImportError("");
    setMessage("");
    const cached = existing(item);
    if (cached) {
      onImported(cached);
      setMessage("أضيفت نسخة من ملفك المحلي للخط الزمني.");
      return;
    }
    const controller = new AbortController();
    download.current = controller;
    const key = stockKey(item);
    setJob({ key, progress: null });
    // Bound React progress updates even when the CDN sends tiny chunks.
    let lastUpdate = 0;
    try {
      const asset = await downloadStock(
        item,
        quality,
        controller.signal,
        (progress) => {
          const now = performance.now();
          if (now - lastUpdate > 100 || progress === 1) {
            lastUpdate = now;
            setJob({ key, progress });
          }
        },
      );
      if (controller.signal.aborted) {
        URL.revokeObjectURL(asset.url);
        return;
      }
      onImported(asset);
      setMessage("تمت الإضافة للخط الزمني — جاهز للتعديل والحفظ والتصدير.");
    } catch (e) {
      if (!controller.signal.aborted) setImportError((e as Error).message);
      else setMessage("تم إلغاء التنزيل؛ لم يتغير مشروعك.");
    } finally {
      if (download.current === controller) {
        download.current = null;
        setJob(null);
      }
    }
  });
  return (
    <section className="stock-library" aria-label="مكتبة Pexels">
      <div className="stock-intro">
        <div>
          <b>لحكايتك… لقطة جديدة.</b>
          <p>صور وفيديوهات من مبدعين حول العالم</p>
        </div>
        <a
          className="pexels-mark"
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Photos and videos provided by Pexels"
        >
          Pexels <ExternalLink size={12} />
        </a>
      </div>
      <div
        className="studio-segmented stock-kinds"
        role="group"
        aria-label="نوع الوسائط"
      >
        <button
          aria-pressed={params.kind === "image"}
          onClick={() => setParams((p) => ({ ...p, kind: "image" }))}
        >
          <Image size={16} />
          صور
        </button>
        <button
          aria-pressed={params.kind === "video"}
          onClick={() => setParams((p) => ({ ...p, kind: "video" }))}
        >
          <Film size={16} />
          فيديوهات
        </button>
      </div>
      <form
        className="stock-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <Search size={17} />
        <input
          aria-label="ابحث في Pexels"
          placeholder="طبيعة، مدينة، قهوة…"
          value={draft}
          maxLength={100}
          onChange={(e) => setDraft(e.target.value)}
        />
        {draft && (
          <button
            type="button"
            aria-label="مسح البحث"
            onClick={() => submit("")}
          >
            <X size={15} />
          </button>
        )}
        <button
          className="stock-search-submit"
          type="submit"
          aria-label="بحث في المكتبة"
        >
          <Search size={18} />
        </button>
      </form>
      <div className="stock-filters">
        <label className="field-label">
          اتجاه اللقطة
          <StudioSelect
            label="اتجاه لقطة Pexels"
            value={params.orientation}
            onValueChange={(orientation) =>
              setParams((p) => ({
                ...p,
                orientation: orientation as StockOrientation,
              }))
            }
            options={[
              { value: "all", label: "كل المقاسات" },
              { value: "landscape", label: "أفقي" },
              { value: "portrait", label: "رأسي" },
              { value: "square", label: "مربع" },
            ]}
          />
        </label>
        <label className="field-label">
          جودة الإضافة
          <StudioSelect
            label="جودة إضافة Pexels"
            disabled={Boolean(job)}
            value={quality}
            onValueChange={(value) => setQuality(value as StockQuality)}
            options={[
              {
                value: "hd",
                label: "HD • أخف",
                description: "حتى 1280 بكسل إن توفّر",
              },
              {
                value: "fullhd",
                label: "Full HD",
                description: "حتى 1920 بكسل إن توفّر",
              },
            ]}
          />
        </label>
      </div>
      <div
        className="stock-suggestions"
        aria-label={recents.length ? "عمليات البحث الأخيرة" : "اقتراحات البحث"}
      >
        {(recents.length ? recents : ["طبيعة", "بحر", "مدينة", "قهوة"]).map(
          (term) => (
            <button key={term} onClick={() => submit(term)}>
              {term}
            </button>
          ),
        )}
        {recents.length > 0 && (
          <button
            aria-label="مسح سجل بحث Pexels"
            onClick={() => {
              setRecents([]);
              try {
                localStorage.removeItem(RECENTS_KEY);
              } catch {}
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="stock-results-heading">
        <b>{params.query ? `نتائج «${params.query}»` : "مختارات لك"}</b>
        <span>{search.items.length} لقطة</span>
      </div>
      {search.translatedQuery &&
        search.translatedQuery !== params.query.toLowerCase() && (
          <p className="stock-translated">
            صيغة البحث بالإنجليزية:{" "}
            <span dir="ltr">{search.translatedQuery}</span>
          </p>
        )}
      {job && (
        <div className="stock-download" role="status">
          <div>
            <CloudDownload size={17} />
            <span>
              {job.progress === 1
                ? "جاري تجهيز الملف…"
                : `جاري التنزيل${job.progress !== null ? ` ${Math.round(job.progress * 100)}%` : "…"}`}
            </span>
            <button
              onClick={() => download.current?.abort()}
              aria-label="إلغاء تنزيل Pexels"
            >
              <X size={17} />
            </button>
          </div>
          <progress
            aria-label="تقدم تنزيل Pexels"
            max={1}
            {...(job.progress !== null ? { value: job.progress } : {})}
          />
        </div>
      )}
      {message && (
        <p className="stock-message" role="status">
          <CheckCircle2 size={16} />
          {message}
          <button
            aria-label="إخفاء رسالة Pexels"
            onClick={() => setMessage("")}
          >
            <X size={14} />
          </button>
        </p>
      )}
      {importError && (
        <p className="stock-error" role="alert">
          {importError}
          <button
            onClick={() => setImportError("")}
            aria-label="إخفاء خطأ التنزيل"
          >
            <X size={14} />
          </button>
        </p>
      )}
      <div className="stock-grid" aria-busy={search.loading}>
        {search.items.map((item) => (
          <StockCard
            key={stockKey(item)}
            item={item}
            onPreview={showPreview}
            onAdd={add}
            disabled={Boolean(job) || suspended}
            imported={Boolean(existing(item))}
          />
        ))}
        {search.loading &&
          Array.from({ length: search.items.length ? 2 : 6 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              className="stock-skeleton"
              aria-hidden="true"
            />
          ))}
      </div>
      {search.loading && (
        <p className="stock-state" role="status">
          جاري البحث في Pexels…
        </p>
      )}
      {search.error && (
        <div className="stock-error" role="alert">
          <p>{search.error}</p>
          <button className="secondary" onClick={search.retry}>
            <RefreshCw size={15} />
            أعد المحاولة
          </button>
        </div>
      )}
      {!search.loading && !search.error && !search.items.length && (
        <div className="stock-empty">
          <Search size={28} />
          <b>مفيش نتائج لسه</b>
          <p>جرّب كلمة أبسط، أو ابحث بالإنجليزية، أو غيّر اتجاه اللقطة.</p>
        </div>
      )}
      {!search.loading && !search.error && search.hasMore && (
        <button className="secondary stock-load-more" onClick={search.loadMore}>
          عرض لقطات أكثر
        </button>
      )}
      {!search.loading && search.page === 6 && (
        <p className="stock-state">جرّب بحثًا أدق للوصول للقطات أخرى.</p>
      )}
      <p className="stock-privacy">
        البحث يتطلب الإنترنت ويرسل كلمات البحث فقط إلى Pexels. ملفاتك الشخصية لا
        تُرفع. بعد الإضافة، التحرير محلي.{" "}
        <a
          href="https://www.pexels.com/license/"
          target="_blank"
          rel="noopener noreferrer"
        >
          شروط الاستخدام والترخيص ↗
        </a>
      </p>
      {preview && (
        <StockPreview
          key={stockKey(preview)}
          item={preview}
          quality={quality}
          onClose={() => setPreview(null)}
          onAdd={() => void add(preview)}
          disabled={Boolean(job) || suspended}
          progress={job?.progress ?? null}
          isImporting={job?.key === stockKey(preview)}
          onCancel={() => download.current?.abort()}
          imported={Boolean(existing(preview))}
        />
      )}
    </section>
  );
}
