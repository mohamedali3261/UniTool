export interface DownloadPopupEntry {
  id: string;
  filename: string;
  ext: string;
  sizeBytes: number | null;
  mimeType: string;
  blob: Blob | null;
  fallbackHref: string;
  isImage: boolean;
  createdAt: number;
}

type Listener = (entry: DownloadPopupEntry) => void;

const listeners = new Set<Listener>();
const blobCache = new Map<string, Blob>();
const MAX_BLOB_CACHE = 40;

declare global {
  interface Window {
    __unitoolDownloadInterceptorInstalled?: boolean;
  }
}

export function formatDownloadBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / 1024 ** idx;
  return `${val >= 10 || idx === 0 ? Math.round(val) : val.toFixed(1)} ${units[idx]}`;
}

function estimateDataUrlInfo(href: string): { sizeBytes: number | null; mimeType: string } {
  if (!href.startsWith('data:')) return { sizeBytes: null, mimeType: '' };
  const comma = href.indexOf(',');
  if (comma === -1) return { sizeBytes: null, mimeType: '' };
  const meta = href.slice(5, comma);
  const mimeType = meta.split(';')[0] || 'application/octet-stream';
  const payload = href.slice(comma + 1);
  if (meta.includes(';base64')) {
    const pad = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    return { sizeBytes: Math.max(0, Math.floor((payload.length * 3) / 4) - pad), mimeType };
  }
  try {
    return { sizeBytes: new Blob([decodeURIComponent(payload)]).size, mimeType };
  } catch {
    return { sizeBytes: payload.length, mimeType };
  }
}

function inferExtension(filename: string, mimeType: string): string {
  const match = filename.trim().match(/\.([a-zA-Z0-9]{1,8})$/);
  if (match) return match[1].toUpperCase();
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('png')) return 'PNG';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG';
  if (mimeType.includes('webp')) return 'WEBP';
  if (mimeType.includes('svg')) return 'SVG';
  if (mimeType.includes('gif')) return 'GIF';
  if (mimeType.includes('zip')) return 'ZIP';
  if (mimeType.includes('mp4')) return 'MP4';
  if (mimeType.includes('webm')) return 'WEBM';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'MP3';
  if (mimeType.includes('wav')) return 'WAV';
  if (mimeType.includes('json')) return 'JSON';
  return 'FILE';
}

function isImageExtOrMime(ext: string, mime: string): boolean {
  if (mime.startsWith('image/')) return true;
  return ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG', 'BMP'].includes(ext.toUpperCase());
}

let lastSig = '';
let lastSigTime = 0;

function notifyAnchorDownload(anchor: HTMLAnchorElement): void {
  if (anchor.dataset.utBypassPopup === 'true') return;
  if (!anchor.hasAttribute('download') && !anchor.download) return;
  const href = anchor.href || anchor.getAttribute('href') || '';
  if (!href || href.startsWith('javascript:')) return;

  const rawName = (anchor.download || anchor.getAttribute('download') || '').trim();
  const sig = `${rawName}|${href.slice(0, 120)}`;
  const now = Date.now();
  if (sig === lastSig && now - lastSigTime < 120) return;
  lastSig = sig;
  lastSigTime = now;

  const cachedBlob = blobCache.get(href) || null;
  const dataInfo = cachedBlob ? null : estimateDataUrlInfo(href);
  const mimeType = cachedBlob?.type || dataInfo?.mimeType || '';
  const sizeBytes = cachedBlob ? cachedBlob.size : dataInfo?.sizeBytes ?? null;
  const ext = inferExtension(rawName, mimeType);
  const fallbackName = `unitool-export.${ext.toLowerCase()}`;
  const filename = rawName || fallbackName;

  const entry: DownloadPopupEntry = {
    id: `dl-${now}-${Math.random().toString(36).slice(2, 7)}`,
    filename,
    ext,
    sizeBytes,
    mimeType,
    blob: cachedBlob,
    fallbackHref: href.startsWith('data:') || !cachedBlob ? href : '',
    isImage: isImageExtOrMime(ext, mimeType),
    createdAt: now,
  };

  listeners.forEach((fn) => {
    try {
      fn(entry);
    } catch {
      /* keep download flow resilient */
    }
  });
}

export function installDownloadPopupInterceptor(): void {
  if (typeof window === 'undefined' || window.__unitoolDownloadInterceptorInstalled) {
    return;
  }
  window.__unitoolDownloadInterceptorInstalled = true;

  // 1. Preserve Blob references across immediate URL.revokeObjectURL calls
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const origCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function patchedCreateObjectURL(obj: Blob | MediaSource): string {
      const url = origCreateObjectURL(obj);
      if (obj instanceof Blob) {
        blobCache.set(url, obj);
        if (blobCache.size > MAX_BLOB_CACHE) {
          const oldestKey = blobCache.keys().next().value;
          if (oldestKey) blobCache.delete(oldestKey);
        }
      }
      return url;
    };
  }

  // 2. Intercept programmatic anchor.click() downloads
  if (typeof HTMLAnchorElement !== 'undefined') {
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedAnchorClick(this: HTMLAnchorElement) {
      try {
        notifyAnchorDownload(this);
      } catch {
        /* never block native download */
      }
      return origClick.apply(this);
    };
  }

  // 3. Intercept direct user clicks on rendered <a download> elements
  document.addEventListener(
    'click',
    (e) => {
      if (e.defaultPrevented) return;
      const target = e.target as Element | null;
      const anchor = target?.closest?.('a[download]') as HTMLAnchorElement | null;
      if (anchor) {
        notifyAnchorDownload(anchor);
      }
    },
    true,
  );
}

export function subscribeDownloadPopup(listener: Listener): () => void {
  installDownloadPopupInterceptor();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function triggerManualRedownload(entry: DownloadPopupEntry, customFilename?: string): void {
  const finalName = ensureExtension(customFilename || entry.filename, entry.ext);
  const a = document.createElement('a');
  a.dataset.utBypassPopup = 'true';
  a.download = finalName;
  a.rel = 'noopener';

  let tempUrl = '';
  if (entry.blob) {
    tempUrl = URL.createObjectURL(entry.blob);
    a.href = tempUrl;
  } else if (entry.fallbackHref) {
    a.href = entry.fallbackHref;
  } else {
    return;
  }

  document.body.appendChild(a);
  a.click();
  a.remove();
  if (tempUrl) {
    setTimeout(() => URL.revokeObjectURL(tempUrl), 4000);
  }
}

export function ensureExtension(rawName: string, ext: string): string {
  const trimmed = rawName.trim();
  const cleanExt = ext.toLowerCase();
  if (!trimmed) return `unitool-file.${cleanExt}`;
  if (!cleanExt || cleanExt === 'file') return trimmed;
  if (trimmed.toLowerCase().endsWith(`.${cleanExt}`)) return trimmed;
  return `${trimmed}.${cleanExt}`;
}
