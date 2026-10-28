import type { StockItem, StockQuality, StockFile } from "./types";
/** Restrict API-provided media to Pexels CDNs; never forward API credentials to these URLs. */
export function isPexelsMediaUrl(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      ["images.pexels.com", "videos.pexels.com", "player.pexels.com"].includes(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}
export function isPexelsPageUrl(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      ["www.pexels.com", "pexels.com"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
export function stockSource(item: StockItem, quality: StockQuality): StockFile {
  const edge = quality === "hd" ? 1280 : 1920;
  if (item.kind === "image" && isPexelsMediaUrl(item.imageUrl)) {
    const url = new URL(item.imageUrl);
    const width = Math.min(
      item.width,
      item.width >= item.height
        ? edge
        : Math.round((edge * item.width) / item.height),
    );
    url.search = new URLSearchParams({
      auto: "compress",
      cs: "tinysrgb",
      fit: "max",
      w: String(width),
    }).toString();
    return {
      url: url.href,
      width,
      height: Math.round((width * item.height) / item.width),
    };
  }
  const files = item.files
    .filter((f) => isPexelsMediaUrl(f.url) && f.width > 0 && f.height > 0)
    .sort((a, b) => a.width * a.height - b.width * b.height);
  const suitable = files.filter((f) => Math.max(f.width, f.height) <= edge);
  const file = suitable.at(-1) || files[0];
  if (!file) throw new Error("لا يوجد ملف MP4 مناسب لهذا الفيديو.");
  return file;
}
