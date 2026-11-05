import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BoxPreview } from "./BoxPreview";
import type { CardSource } from "./preview3d/cardRenderer";
import type { createCardRenderer } from "./preview3d/cardRenderer";
const Context = createContext<
  | ((source: CardSource, signal: AbortSignal) => Promise<string | undefined>)
  | null
>(null);
export function CardPhotoProvider({ children }: { children: ReactNode }) {
  const service = useRef<Promise<ReturnType<typeof createCardRenderer>> | null>(
    null,
  );
  useEffect(
    () => () => {
      void service.current
        ?.then((renderer) => renderer.dispose())
        .catch(() => {});
    },
    [],
  );
  const request = useCallback(
    async (source: CardSource, signal: AbortSignal) => {
      if (signal.aborted) return;
      service.current ??= import("./preview3d/cardRenderer").then((m) =>
        m.createCardRenderer(),
      );
      return (await service.current).render(source, signal);
    },
    [],
  );
  return <Context.Provider value={request}>{children}</Context.Provider>;
}
export function CardPhoto({
  source,
  thumbnail,
}: {
  source: CardSource;
  thumbnail?: string;
}) {
  const render = useContext(Context),
    host = useRef<HTMLDivElement>(null),
    [url, setUrl] = useState("");
  useEffect(() => {
    const controller = new AbortController(),
      element = host.current;
    if (!element || !render) return;
    let started = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();
        void render(source, controller.signal)
          .then((url) => {
            if (url && !controller.signal.aborted) setUrl(url);
          })
          .catch(() => {});
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => {
      controller.abort();
      observer.disconnect();
    };
  }, [source.key, render]);
  return (
    <div ref={host} className="packaging-card-photo" data-photo-ready={!!url}>
      {url ? (
        <img src={url} alt="" loading="lazy" />
      ) : thumbnail ? (
        <img src={thumbnail} alt="" />
      ) : (
        <BoxPreview size={source.size} />
      )}
    </div>
  );
}
