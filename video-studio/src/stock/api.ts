import { PEXELS_API_KEY } from "../../../designcraft/src/services/pexelsService";
import { localPexelsQuery } from "../../../designcraft/src/services/pexelsQuery";
import { isPexelsMediaUrl, isPexelsPageUrl } from "./mediaSource";
import type { StockItem, StockSearch, StockPage } from "./types";

const cache = new Map<string, { at: number; data: StockPage }>();
export const STOCK_PAGE_SIZE = 12;
export const MAX_STOCK_PAGES = 6;
export class StockApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
/** Small metadata-only, in-memory cache. Neither the key nor files go into localStorage. */
export async function searchStock(
  search: StockSearch,
  page: number,
  signal: AbortSignal,
): Promise<StockPage> {
  signal.throwIfAborted();
  const translatedQuery = localPexelsQuery(search.query);
  const query =
    translatedQuery || (search.orientation === "all" ? "" : "background");
  const path =
    search.kind === "image"
      ? query
        ? "/v1/search"
        : "/v1/curated"
      : query
        ? "/videos/search"
        : "/videos/popular";
  const url = new URL(path, "https://api.pexels.com");
  url.search = new URLSearchParams({
    page: String(page),
    per_page: String(STOCK_PAGE_SIZE),
    ...(query ? { query } : {}),
    ...(search.orientation !== "all"
      ? { orientation: search.orientation }
      : {}),
  }).toString();
  const cached = cache.get(url.href);
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.data;
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Timeout", "TimeoutError")),
    20_000,
  );
  try {
    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
      signal: controller.signal,
    });
    if (!response.ok) {
      const message =
        response.status === 429
          ? "وصلنا لحد طلبات Pexels. انتظر قليلًا ثم أعد المحاولة."
          : [401, 403].includes(response.status)
            ? "تعذّر التحقق من إعداد Pexels المشترك مع المصمم."
            : "مكتبة Pexels غير متاحة حاليًا. جرّب مرة أخرى.";
      throw new StockApiError(message, response.status);
    }
    const data = await response.json();
    const rawItems = search.kind === "image" ? data.photos : data.videos;
    if (!Array.isArray(rawItems))
      throw new StockApiError("استجابة غير متوقعة من Pexels.");
    const items: StockItem[] = rawItems.flatMap((raw): StockItem[] => {
      const thumbnail = search.kind === "image" ? raw.src?.medium : raw.image;
      if (
        !Number.isSafeInteger(raw.id) ||
        raw.id < 1 ||
        !isPexelsMediaUrl(thumbnail) ||
        !(raw.width > 0 && raw.height > 0) ||
        !isPexelsPageUrl(raw.url)
      )
        return [];
      const files = (Array.isArray(raw.video_files) ? raw.video_files : [])
        .filter(
          (f) =>
            f.file_type === "video/mp4" &&
            isPexelsMediaUrl(f.link) &&
            f.width > 0 &&
            f.height > 0,
        )
        .map((f) => ({ url: f.link, width: f.width, height: f.height }));
      if (search.kind === "video" && (!files.length || !(raw.duration > 0)))
        return [];
      const imageUrl = raw.src?.original;
      if (search.kind === "image" && !isPexelsMediaUrl(imageUrl)) return [];
      const authorUrl =
        search.kind === "image" ? raw.photographer_url : raw.user?.url;
      return [
        {
          id: raw.id,
          kind: search.kind,
          title: String(
            raw.alt ||
              `${search.kind === "image" ? "صورة" : "فيديو"} Pexels ${raw.id}`,
          ),
          thumbnail,
          pageUrl: raw.url,
          author: String(raw.photographer || raw.user?.name || "Pexels"),
          authorUrl: isPexelsPageUrl(authorUrl) ? authorUrl : raw.url,
          width: raw.width,
          height: raw.height,
          duration: search.kind === "video" ? raw.duration : 5,
          imageUrl,
          files,
        },
      ];
    });
    signal.throwIfAborted();
    const result = {
      items,
      page,
      translatedQuery,
      hasMore:
        page < MAX_STOCK_PAGES &&
        Boolean(
          data.next_page ||
          (rawItems.length === STOCK_PAGE_SIZE &&
            (!Number.isFinite(data.total_results) ||
              page * STOCK_PAGE_SIZE < data.total_results)),
        ),
    };
    cache.delete(url.href);
    cache.set(url.href, { at: Date.now(), data: result });
    if (cache.size > 24) cache.delete(cache.keys().next().value);
    return result;
  } catch (error) {
    if (signal.aborted) throw error;
    if (controller.signal.aborted)
      throw new StockApiError(
        "البحث استغرق وقتًا أطول من المتوقع. أعد المحاولة.",
      );
    if (error instanceof StockApiError) throw error;
    throw new StockApiError(
      "تعذّر الاتصال بـ Pexels. تأكد من الإنترنت وأعد المحاولة.",
    );
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
