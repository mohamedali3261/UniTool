import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive,
  CheckCircle2,
  Download,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ensureExtension,
  formatDownloadBytes,
  subscribeDownloadPopup,
  triggerManualRedownload,
  type DownloadPopupEntry,
} from '../utils/downloadPopupBus';
import '../styles/download-popup.css';

const BATCH_WINDOW_MS = 650;

function pickFileIcon(ext: string) {
  const upper = ext.toUpperCase();
  if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG', 'BMP'].includes(upper)) return FileImage;
  if (['MP4', 'WEBM', 'MOV', 'MKV', 'AVI'].includes(upper)) return Film;
  if (['MP3', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC'].includes(upper)) return FileAudio;
  if (['ZIP', 'RAR', '7Z'].includes(upper)) return Archive;
  if (['XLSX', 'XLS', 'CSV'].includes(upper)) return FileSpreadsheet;
  return FileText;
}

export function DownloadPopupModal({ lang = 'ar' }: { lang?: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const [items, setItems] = useState<DownloadPopupEntry[]>([]);
  const [customName, setCustomName] = useState('');
  const [progress, setProgress] = useState(35);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastOpenedAtRef = useRef<number>(0);

  useEffect(() => {
    return subscribeDownloadPopup((entry) => {
      const now = Date.now();
      setItems((prev) => {
        if (prev.length > 0 && now - lastOpenedAtRef.current <= BATCH_WINDOW_MS) {
          lastOpenedAtRef.current = now;
          return [...prev, entry];
        }
        lastOpenedAtRef.current = now;
        setCustomName(entry.filename);
        return [entry];
      });
      setProgress(38);
      window.setTimeout(() => setProgress(100), 90);
    });
  }, []);

  const primary = items[0] || null;

  useEffect(() => {
    if (!primary || items.length !== 1 || !primary.isImage) {
      setPreviewSrc(null);
      return;
    }
    if (primary.blob) {
      const url = URL.createObjectURL(primary.blob);
      setPreviewSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    if (primary.fallbackHref.startsWith('data:image/')) {
      setPreviewSrc(primary.fallbackHref);
      return;
    }
    setPreviewSrc(null);
  }, [primary, items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setItems([]);
      }
    };
    const onOutsidePointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (cardRef.current && target && !cardRef.current.contains(target)) {
        setItems([]);
      }
    };
    document.addEventListener('keydown', onKey);
    const attachTimer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onOutsidePointer);
    }, 160);
    return () => {
      window.clearTimeout(attachTimer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutsidePointer);
    };
  }, [items.length]);

  const totalBatchBytes = useMemo(() => {
    let sum = 0;
    let known = false;
    for (const item of items) {
      if (item.sizeBytes != null) {
        sum += item.sizeBytes;
        known = true;
      }
    }
    return known ? sum : null;
  }, [items]);

  if (items.length === 0 || !primary || typeof document === 'undefined') {
    return null;
  }

  const isBatch = items.length > 1;
  const IconComp = pickFileIcon(primary.ext);
  const canRedownload = Boolean(primary.blob || primary.fallbackHref);
  const editedNameChanged =
    !isBatch &&
    customName.trim() !== '' &&
    ensureExtension(customName, primary.ext) !== primary.filename;

  const handleClose = () => setItems([]);

  const handleRedownload = () => {
    if (isBatch) {
      items.forEach((item, index) => {
        window.setTimeout(() => triggerManualRedownload(item), index * 140);
      });
      return;
    }
    triggerManualRedownload(primary, customName);
  };

  return createPortal(
    <aside
      data-testid="unitool-download-popup"
      aria-live="polite"
      dir={ar ? 'rtl' : 'ltr'}
      className="ut-dl-popup-layer"
    >
      <div ref={cardRef} className="ut-dl-popup-card">
        <div className="ut-dl-popup-top">
          <div className="ut-dl-popup-status">
            <span className="ut-dl-popup-badge">
              <CheckCircle2 size={22} />
            </span>
            <div className="ut-dl-popup-titles">
              <span className="ut-dl-popup-eyebrow">
                <Sparkles size={11} />
                {ar ? 'مركز التحميل · UniTool' : 'UniTool · Download Center'}
              </span>
              <h3>
                {isBatch
                  ? ar
                    ? `تم تجهيز وتنزيل ${items.length} ملفات بنجاح`
                    : `${items.length} files prepared & downloading`
                  : ar
                    ? 'تم تجهيز ملفك وبدأ التحميل بنجاح'
                    : 'Your file is ready & downloading'}
              </h3>
              <p>
                {ar
                  ? 'تمت المعالجة محلياً داخل متصفحك بخصوصية تامة دون رفع بياناتك.'
                  : 'Processed locally inside your browser with full privacy.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ut-dl-popup-close"
            onClick={handleClose}
            aria-label={ar ? 'إغلاق نافذة التحميل' : 'Close download popup'}
          >
            <X size={16} />
          </button>
        </div>

        <div className="ut-dl-progress-wrap">
          <div className="ut-dl-progress-track">
            <div className="ut-dl-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="ut-dl-body">
          {!isBatch ? (
            <>
              <div className="ut-dl-file-box">
                <div className="ut-dl-thumb" data-theme-art>
                  {previewSrc ? (
                    <img src={previewSrc} alt="" />
                  ) : (
                    <IconComp size={24} />
                  )}
                </div>

                <div className="ut-dl-file-meta">
                  <div className="ut-dl-file-name" dir="ltr" title={primary.filename}>
                    {ensureExtension(customName || primary.filename, primary.ext)}
                  </div>
                  <div className="ut-dl-pills">
                    <span className="ut-dl-pill">{primary.ext}</span>
                    {primary.sizeBytes != null && (
                      <span className="ut-dl-pill ut-dl-pill--muted" dir="ltr">
                        {formatDownloadBytes(primary.sizeBytes)}
                      </span>
                    )}
                    <span className="ut-dl-pill ut-dl-pill--muted">
                      <ShieldCheck size={11} />
                      {ar ? 'آمن 100%' : 'Local'}
                    </span>
                  </div>
                </div>
              </div>

              {canRedownload && (
                <div className="ut-dl-rename-field">
                  <label htmlFor="ut-dl-rename-input">
                    {ar
                      ? 'تعديل اسم الملف وحفظ نسخة جديدة (اختياري)'
                      : 'Rename file & save another copy (optional)'}
                  </label>
                  <input
                    id="ut-dl-rename-input"
                    dir="ltr"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="ut-dl-pills">
                <span className="ut-dl-pill">
                  {items.length} {ar ? 'ملفات' : 'files'}
                </span>
                {totalBatchBytes != null && (
                  <span className="ut-dl-pill ut-dl-pill--muted" dir="ltr">
                    {formatDownloadBytes(totalBatchBytes)}
                  </span>
                )}
              </div>

              <div className="ut-dl-batch-list">
                {items.map((item) => {
                  const RowIcon = pickFileIcon(item.ext);
                  return (
                    <div key={item.id} className="ut-dl-batch-row">
                      <div className="ut-dl-batch-row__info">
                        <RowIcon size={15} />
                        <strong dir="ltr" title={item.filename}>
                          {item.filename}
                        </strong>
                      </div>
                      {(item.blob || item.fallbackHref) && (
                        <button
                          type="button"
                          onClick={() => triggerManualRedownload(item)}
                        >
                          {ar ? 'تحميل' : 'Save'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="ut-dl-footer">
          {canRedownload && (
            <button
              type="button"
              data-testid="unitool-download-again-btn"
              className="ut-dl-btn-primary"
              onClick={handleRedownload}
            >
              <Download size={15} />
              <span>
                {isBatch
                  ? ar
                    ? 'إعادة تحميل الكل'
                    : 'Download all again'
                  : editedNameChanged
                    ? ar
                      ? 'حفظ بالاسم الجديد'
                      : 'Save with new name'
                    : ar
                      ? 'إعادة التحميل'
                      : 'Download again'}
              </span>
            </button>
          )}
          <button
            type="button"
            data-testid="unitool-download-close-btn"
            className="ut-dl-btn-secondary"
            onClick={handleClose}
          >
            <span>{ar ? 'متابعة العمل' : 'Continue working'}</span>
          </button>
        </div>
      </div>
    </aside>,
    document.body,
  );
}
