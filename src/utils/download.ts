/**
 * Safari-safe file saving.
 *
 * Safari (macOS + iOS) is much stricter than Chromium/Firefox about programmatic
 * downloads. The behaviours handled here are the ones that made tool download
 * buttons look "dead" in Safari:
 *
 * 1. `URL.revokeObjectURL(url)` immediately after `anchor.click()` cancels the
 *    transfer in WebKit — the blob is gone before the download starts. We keep
 *    the blob URL alive for a while (`revokeDownloadUrl`) and `installDownloadGuard()`
 *    neutralises the eager revokes that are spread across the app/studios.
 * 2. A detached anchor is ignored by WebKit: the element must be in the document.
 *    We append it, style it off-screen and remove it only after the download had
 *    time to start.
 * 3. iOS/old WebKit ignores the `download` attribute for `blob:`/`data:` URLs and
 *    opens the file instead. We fall back to a new tab so the file is at least
 *    reachable through Share → Save to Files.
 * 4. `data:` URLs are size-limited in Safari, so we convert them to a Blob first.
 * 5. Filenames with slashes, control characters or trailing dots break the save
 *    dialog, so every name goes through `sanitizeFilename` first.
 */

/** How long a blob URL used by a download stays alive (WebKit needs a head start). */
export const DOWNLOAD_URL_TTL_MS = 60_000;
/** How long the anchor stays in the DOM after `click()`. */
export const ANCHOR_LINGER_MS = 4_000;

let installed = false;
const downloadedAt = new Map<string, number>();

export interface DownloadOptions {
  /** Open the file in a tab instead of using the `download` attribute. */
  forceTab?: boolean;
  /** Do not notify the site-wide download popup (used by the popup itself). */
  silent?: boolean;
}

export interface DownloadResult {
  ok: boolean;
  method: 'download' | 'tab';
  filename: string;
  error?: string;
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u200b-\u200d\u2028\u2029\ufeff]/g;
const FORBIDDEN_FILENAME_CHARS = /[/\\?%*:|"<>]/g;

function browserNavigator(): Navigator | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator;
}

/** True for Safari/WebKit (including iOS, and iOS in-app browsers) — never Chrome/Edge/Firefox. */
export function isSafariBrowser(): boolean {
  const nav = browserNavigator();
  if (!nav) return false;
  const ua = nav.userAgent || '';
  if (!ua) return false;
  // CriOS/FxiOS/EdgiOS/OPiOS and Android Chrome all carry "Safari" in the UA.
  if (/crios|fxios|edgios|edga|opios|opt\/|chrome|chromium|android|samsungbrowser|ucbrowser|yabrowser|duckduck/i.test(ua)) {
    return false;
  }
  return /safari|applewebkit/i.test(ua);
}

/** iPhone / iPad / iPod, including iPadOS which masquerades as macOS. */
export function isIosDevice(): boolean {
  const nav = browserNavigator();
  if (!nav) return false;
  const ua = nav.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  return /macintosh/i.test(ua) && (nav.maxTouchPoints || 0) > 1;
}

/** WebKit builds that cannot honour `a[download]` (old iOS, some in-app webviews). */
function supportsDownloadAttribute(): boolean {
  if (typeof HTMLAnchorElement === 'undefined') return false;
  const probe = document.createElement('a');
  return typeof probe.download !== 'undefined' && 'download' in probe;
}

/**
 * Produces a filename that Safari will actually save: no path separators, no
 * control characters, no trailing dots/spaces, sensible length, never empty.
 */
export function sanitizeFilename(rawName: string, fallbackExt = ''): string {
  let name = String(rawName ?? '')
    .replace(CONTROL_CHARS, '')
    .replace(FORBIDDEN_FILENAME_CHARS, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+/, '')
    .replace(/[.\s]+$/, '');

  if (!name) {
    const ext = fallbackExt.replace(/^\./, '').trim();
    name = ext ? `unitool-file.${ext}` : 'unitool-file';
  }

  // Keep the extension intact when shortening very long names.
  if (name.length > 120) {
    const dot = name.lastIndexOf('.');
    const ext = dot > 0 && name.length - dot <= 10 ? name.slice(dot) : '';
    name = name.slice(0, 120 - ext.length).trim() + ext;
  }

  return name;
}

export function isDataUrl(href: string): boolean {
  return /^data:/i.test(href);
}

/** Converts a `data:` URL to a Blob (Safari caps the length of data URLs). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) throw new Error('Malformed data URL');
  const meta = dataUrl.slice(5, comma);
  const isBase64 = /;base64/i.test(meta);
  // Keep `;charset=…` so Arabic text keeps its encoding, strip only `;base64`.
  const mimeType = meta.replace(/;\s*base64/i, '').trim() || 'application/octet-stream';
  const payload = dataUrl.slice(comma + 1);

  if (!isBase64) {
    const decoded = decodeURIComponent(payload);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i += 1) bytes[i] = decoded.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: mimeType });
  }

  const binary = atob(payload.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

/** Remembers a blob URL as "in use by a download" so the guard defers its revoke. */
export function trackDownloadUrl(url: string): void {
  downloadedAt.set(url, Date.now());
  if (downloadedAt.size <= 64) return;
  const cutoff = Date.now() - DOWNLOAD_URL_TTL_MS;
  for (const [key, at] of downloadedAt) {
    if (at < cutoff) downloadedAt.delete(key);
  }
}

/**
 * Revokes a blob URL, but never while Safari may still be reading it.
 * Pass a custom `delayMs` for URLs that were not used by a download.
 */
export function revokeDownloadUrl(url: string, delayMs = DOWNLOAD_URL_TTL_MS): void {
  if (!url.startsWith('blob:') || typeof URL === 'undefined') return;
  const delay = Math.max(0, delayMs);
  if (delay === 0) {
    URL.revokeObjectURL(url);
    return;
  }
  if (typeof window === 'undefined') {
    URL.revokeObjectURL(url);
    return;
  }
  window.setTimeout(() => {
    downloadedAt.delete(url);
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* already revoked */
    }
  }, delay);
}

/**
 * Installs a global guard so the many legacy call sites that revoke a blob URL
 * right after `a.click()` stop cancelling downloads in Safari. Only URLs that
 * were actually used by a `<a download>` click are deferred, so preview URLs are
 * still released immediately.
 */
export function installDownloadGuard(): void {
  if (installed) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  installed = true;

  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    const nativeRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = function guardedRevokeObjectURL(url: string): void {
      const usedAt = downloadedAt.get(url);
      if (usedAt == null) {
        nativeRevoke(url);
        return;
      }
      const remaining = DOWNLOAD_URL_TTL_MS - (Date.now() - usedAt);
      if (remaining <= 0) {
        downloadedAt.delete(url);
        nativeRevoke(url);
        return;
      }
      window.setTimeout(() => {
        downloadedAt.delete(url);
        try {
          nativeRevoke(url);
        } catch {
          /* ignore */
        }
      }, remaining);
    };
  }

  // Mark blob URLs that were handed to the browser as downloads.
  if (typeof HTMLAnchorElement !== 'undefined') {
    const proto = HTMLAnchorElement.prototype;
    const nativeClick = proto.click;
    proto.click = function guardedAnchorClick(this: HTMLAnchorElement) {
      try {
        if (this.hasAttribute('download') || this.download) {
          const href = this.href || this.getAttribute('href') || '';
          if (href.startsWith('blob:')) trackDownloadUrl(href);
        }
      } catch {
        /* never block the native click */
      }
      return nativeClick.apply(this);
    };
  }

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[download]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.href || anchor.getAttribute('href') || '';
      if (href.startsWith('blob:')) trackDownloadUrl(href);
    },
    true,
  );
}

function styleAnchor(anchor: HTMLAnchorElement): void {
  anchor.setAttribute('style', 'position:fixed;top:0;left:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;');
  anchor.setAttribute('aria-hidden', 'true');
  anchor.tabIndex = -1;
}

function openInTab(href: string): boolean {
  try {
    const win = window.open(href, '_blank', 'noopener');
    if (win) return true;
  } catch {
    /* blocked popup */
  }
  return false;
}

/**
 * Saves a URL that already exists (object URL, blob URL, data URL, same-origin URL).
 * The URL is NOT revoked: the caller still owns it.
 */
export function downloadUrl(href: string, filename: string, options: DownloadOptions = {}): DownloadResult {
  const name = sanitizeFilename(filename);
  if (typeof document === 'undefined' || !document.body) {
    return { ok: false, method: 'download', filename: name, error: 'no-document' };
  }

  const forceTab = Boolean(options.forceTab);
  const canDownload = supportsDownloadAttribute();

  // WebKit webviews without `download` support can only open the file.
  if (forceTab || !canDownload) {
    const opened = openInTab(href);
    if (opened) return { ok: true, method: 'tab', filename: name };
    return { ok: false, method: 'tab', filename: name, error: 'popup-blocked' };
  }

  const anchor = document.createElement('a');
  if (options.silent) anchor.dataset.utBypassPopup = 'true';
  anchor.href = href;
  anchor.download = name;
  anchor.rel = 'noopener';
  styleAnchor(anchor);
  document.body.appendChild(anchor);

  // The URL must stay valid until WebKit has started reading it.
  if (href.startsWith('blob:')) trackDownloadUrl(href);

  let ok = true;
  try {
    anchor.click();
  } catch (error) {
    ok = false;
  }

  // Removing the anchor synchronously cancels the download in Safari.
  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
    window.setTimeout(() => anchor.remove(), ANCHOR_LINGER_MS);
  } else {
    anchor.remove();
  }

  if (!ok) {
    // Safari may still refuse; the file is reachable through a new tab.
    if (openInTab(href)) return { ok: true, method: 'tab', filename: name };
    return { ok: false, method: 'download', filename: name, error: 'download-blocked' };
  }

  return { ok: true, method: 'download', filename: name };
}

/** Saves a Blob. The generated object URL is released safely (never too early). */
export function downloadBlob(blob: Blob, filename: string, options: DownloadOptions = {}): DownloadResult {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return { ok: false, method: 'download', filename: sanitizeFilename(filename), error: 'unsupported' };
  }
  const url = URL.createObjectURL(blob);
  const result = downloadUrl(url, filename, options);
  if (!result.ok) {
    URL.revokeObjectURL(url);
    return result;
  }
  // Safe: the guard keeps this URL alive for the whole TTL anyway.
  revokeDownloadUrl(url);
  return result;
}

/** Saves a `data:` URL by converting it to a Blob first (Safari size limits). */
export function downloadDataUrl(dataUrl: string, filename: string, options: DownloadOptions = {}): DownloadResult {
  try {
    return downloadBlob(dataUrlToBlob(dataUrl), filename, options);
  } catch {
    return downloadUrl(dataUrl, filename, options);
  }
}

/** Saves generated text with a UTF-8 BOM so Excel/Notepad/Pages detect the encoding. */
export function downloadText(
  text: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8',
  options: DownloadOptions & { bom?: boolean } = {},
): DownloadResult {
  const body = options.bom ? '\uFEFF' + text : text;
  return downloadBlob(new Blob([body], { type: mimeType }), filename, options);
}

// Installed as soon as any tool imports this module.
installDownloadGuard();
