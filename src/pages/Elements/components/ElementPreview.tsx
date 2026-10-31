import { useEffect, useRef, useState, type RefObject } from "react";
import type { LibraryElement } from "../types";
import { renderElement } from "../lib/render";
export function ElementPreview({
  item,
  time = 1.2,
  color,
  canvasRef,
  onReady,
  live = false,
}: {
  item: LibraryElement;
  time?: number;
  color?: string;
  canvasRef?: RefObject<HTMLCanvasElement>;
  onReady?: () => void;
  live?: boolean;
}) {
  const local = useRef<HTMLCanvasElement>(null),
    ref = canvasRef || local;
  const [visible, setVisible] = useState(false),
    [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin: "0px" },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [item]);
  useEffect(() => {
    if (!visible || !item.svg) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive) setImage(img);
    };
    img.src =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(item.svg);
    return () => {
      alive = false;
      img.onload = null;
    };
  }, [item, visible]);
  useEffect(() => {
    if (!visible || !ref.current || (item.svg && !image)) return;
    let alive = true,
      raf = 0,
      last = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let start = performance.now();
    const paint = (at: number) => {
      if (alive && ref.current) {
        renderElement(ref.current, item, at, color, image);
        onReady?.();
      }
    };
    const tick = (now: number) => {
      if (now - last > 1000 / 20 && !document.hidden) {
        paint(reduced.matches ? time : ((now - start) / 1000) % 7.8);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    void document.fonts.ready.then(() => {
      if (!alive) return;
      paint(time);
      if (live && !reduced.matches) raf = requestAnimationFrame(tick);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [item, time, color, image, visible, onReady, live]);
  return (
    <canvas
      ref={ref}
      width={canvasRef ? 960 : 480}
      height={canvasRef ? 540 : 270}
      className="element-preview"
      data-live={live && visible ? "true" : "false"}
      role="img"
      aria-label={`معاينة ${item.name}`}
    />
  );
}
