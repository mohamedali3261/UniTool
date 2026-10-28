import { readAsset } from "../lib/media";
import type { Asset } from "../types";
import { stockSource } from "./mediaSource";
import type { StockItem, StockQuality } from "./types";
export const MAX_STOCK_BYTES = 100 * 1024 * 1024;
/** Stream to a bounded local blob. Canvas/export/project files never depend on a remote URL. */
export async function downloadStock(
  item: StockItem,
  quality: StockQuality,
  signal: AbortSignal,
  onProgress: (progress: number | null) => void,
): Promise<Asset> {
  signal.throwIfAborted();
  const source = stockSource(item, quality);
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout>;
  const armTimeout = () => {
    clearTimeout(timer);
    timer = setTimeout(
      () =>
        controller.abort(new DOMException("Download timeout", "TimeoutError")),
      30_000,
    );
  };
  armTimeout();
  try {
    // Intentionally NO Authorization header: the existing key is used only for api.pexels.com.
    const response = await fetch(source.url, {
      signal: controller.signal,
      mode: "cors",
    });
    if (!response.ok)
      throw new Error("تعذّر تنزيل الملف من Pexels. جرّب ملفًا آخر.");
    const length = Number(response.headers.get("Content-Length"));
    if (length > MAX_STOCK_BYTES) {
      await response.body?.cancel();
      throw new Error("الملف أكبر من 100 MB. اختار جودة أخف أو فيديو أقصر.");
    }
    const mime = (response.headers.get("Content-Type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (
      item.kind === "image"
        ? !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
            mime,
          )
        : mime !== "video/mp4"
    ) {
      await response.body?.cancel();
      throw new Error("صيغة الملف غير متوقعة. جرّب نتيجة أخرى.");
    }
    if (!response.body) throw new Error("المتصفح لا يدعم تنزيل هذا الملف.");
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let received = 0;
    onProgress(length > 0 ? 0 : null);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        armTimeout();
        signal.throwIfAborted();
        received += value.byteLength;
        if (received > MAX_STOCK_BYTES)
          throw new Error(
            "الملف أكبر من 100 MB. اختار جودة أخف أو فيديو أقصر.",
          );
        chunks.push(value as Uint8Array<ArrayBuffer>);
        onProgress(length > 0 ? Math.min(0.99, received / length) : null);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    clearTimeout(timer);
    signal.throwIfAborted();
    const extension =
      item.kind === "video"
        ? "mp4"
        : {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/avif": "avif",
          }[mime];
    const file = new File(
      chunks,
      `Pexels-${item.kind}-${item.id}.${extension}`,
      { type: mime },
    );
    const asset = await readAsset(file, signal);
    if (signal.aborted) {
      URL.revokeObjectURL(asset.url);
      signal.throwIfAborted();
    }
    onProgress(1);
    return {
      ...asset,
      source: {
        provider: "pexels",
        id: item.id,
        pageUrl: item.pageUrl,
        author: item.author,
        authorUrl: item.authorUrl,
        quality,
      },
    };
  } catch (e) {
    if (signal.aborted) throw e;
    if (controller.signal.aborted)
      throw new Error(
        "توقف التنزيل بسبب بطء الاتصال. جرّب مجددًا أو اختار جودة أخف.",
      );
    if (e instanceof TypeError)
      throw new Error("تعذّر تنزيل الملف. راجع الإنترنت أو جرّب نتيجة أخرى.");
    throw e;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
