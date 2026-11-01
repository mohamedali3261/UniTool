import { useEffect, useRef } from "react";
import type { PdfDoc } from "../../core/pdf";
export function Thumbnail({
  doc,
  source,
  rotation,
}: {
  doc: PdfDoc;
  source: number;
  rotation: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let dead = false,
      task: any;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      void (async () => {
        const page = await doc.getPage(source + 1);
        if (dead) return;
        const base = page.getViewport({
            scale: 1,
            rotation: (page.rotate + rotation) % 360,
          }),
          viewport = page.getViewport({
            scale: 110 / Math.max(base.width, base.height),
            rotation: (page.rotate + rotation) % 360,
          }),
          canvas = ref.current!;
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        task = page.render({
          canvasContext: canvas.getContext("2d")!,
          viewport,
          background: "#fff",
        });
        await task.promise;
      })().catch(() => {});
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      dead = true;
      observer.disconnect();
      task?.cancel();
    };
  }, [doc, source, rotation]);
  return <canvas ref={ref} aria-hidden="true" />;
}
