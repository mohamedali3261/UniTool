import { useEffect, useRef, useState } from "react";
import type { Asset } from "../../../types";
import { videoFrames } from "./mediaFrames";
const cache = new Map<string, string[]>();
// One thumbnail decoder at a time; cancelled/unmounted strips never retain media elements.
let queue: Promise<unknown> = Promise.resolve();
export function ThumbnailStrip({
  asset,
  start,
  end,
}: {
  asset: Asset;
  start: number;
  end: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false),
    [frames, setFrames] = useState<string[]>([]);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(entries.some((e) => e.isIntersecting));
      },
      { rootMargin: "160px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const key = `${asset.url}:${start.toFixed(2)}:${end.toFixed(2)}`;
    const abort = new AbortController();
    if (asset.type === "image") {
      setFrames([asset.url]);
      return;
    }
    if (cache.has(key)) {
      setFrames(cache.get(key)!);
      return;
    }
    queue = queue
      .catch(() => {})
      .then(async () => {
        if (abort.signal.aborted) return;
        try {
          const large =
            (asset.size || 0) > 256 * 1024 * 1024 || asset.duration > 1800;
          const data = await videoFrames(
            asset.url,
            Array.from(
              { length: large ? 1 : 5 },
              (_, i) => start + ((end - start) * i) / 5,
            ),
            abort.signal,
            large ? 160 : 320,
          );
          if (abort.signal.aborted) return;
          cache.set(key, data);
          if (cache.size > 18) cache.delete(cache.keys().next().value!);
          setFrames(data);
        } catch {
          /* Film icon remains as an honest fallback for unsupported codecs. */
        }
      });
    return () => abort.abort();
  }, [asset.url, start, end, visible]);
  return (
    <div
      className="timeline-thumbnails"
      ref={ref}
      aria-label="صور مصغرة للمقطع"
    >
      {frames.map((src, i) => (
        <img src={src} alt="" draggable={false} key={i} />
      ))}
    </div>
  );
}
