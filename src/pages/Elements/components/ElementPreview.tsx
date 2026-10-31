import { useEffect, useRef, useState, type RefObject } from "react";
import type { LibraryElement } from "../types";
import { renderElement } from "../lib/render";
export function ElementPreview({
  item,
  time = 1.2,
  color,
  canvasRef,
  onReady,
}: {
  item: LibraryElement;
  time?: number;
  color?: string;
  canvasRef?: RefObject<HTMLCanvasElement>;
  onReady?: () => void;
}) {
  const local = useRef<HTMLCanvasElement>(null),
    ref = canvasRef || local;
  const [visible, setVisible] = useState(false),
    [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" },
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
    let alive = true;
    void document.fonts.ready.then(() => {
      if (alive && ref.current) {
        renderElement(ref.current, item, time, color, image);
        onReady?.();
      }
    });
    return () => {
      alive = false;
    };
  }, [item, time, color, image, visible, onReady]);
  return (
    <canvas
      ref={ref}
      width={960}
      height={540}
      className="element-preview"
      role="img"
      aria-label={`معاينة ${item.name}`}
    />
  );
}
