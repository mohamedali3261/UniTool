import { useEffect, useRef, useState } from "react";
import { searchStock } from "./api";
import { stockKey, type StockItem, type StockSearch } from "./types";
export function useStockSearch(params: StockSearch) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [translatedQuery, setTranslatedQuery] = useState("");
  const controller = useRef<AbortController>(null);
  const sequence = useRef(0);
  const busy = useRef(false);
  const failedPage = useRef(1);
  const run = async (nextPage: number, reset: boolean) => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const request = ++sequence.current;
    busy.current = true;
    setLoading(true);
    setError("");
    failedPage.current = nextPage;
    if (reset) {
      setItems([]);
      setPage(0);
      setHasMore(false);
      setTranslatedQuery("");
    }
    try {
      const result = await searchStock(params, nextPage, abort.signal);
      if (abort.signal.aborted || request !== sequence.current) return;
      setItems((previous) =>
        Array.from(
          new Map(
            [...(reset ? [] : previous), ...result.items].map((item) => [
              stockKey(item),
              item,
            ]),
          ).values(),
        ),
      );
      setPage(result.page);
      setHasMore(result.hasMore);
      setTranslatedQuery(result.translatedQuery);
    } catch (e) {
      if (!abort.signal.aborted && request === sequence.current)
        setError((e as Error).message);
    } finally {
      if (request === sequence.current && !abort.signal.aborted) {
        busy.current = false;
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    void run(1, true);
    return () => {
      controller.current?.abort();
      ++sequence.current;
      busy.current = false;
    };
  }, [params.kind, params.query, params.orientation]);
  return {
    items,
    page,
    hasMore,
    loading,
    error,
    translatedQuery,
    loadMore: () => {
      if (!busy.current && hasMore) void run(page + 1, false);
    },
    retry: () => {
      if (!busy.current) void run(failedPage.current, failedPage.current === 1);
    },
  };
}
