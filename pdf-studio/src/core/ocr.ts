import type { PdfDoc } from "./pdf";
import { pageCanvas } from "./pdf";
import type { OCRResult } from "./types";
export function recognizePage(
  doc: PdfDoc,
  index: number,
  onProgress: (status: string, progress: number) => void,
  layout: "auto" | "block" | "sparse" = "auto",
  rotation = 0,
) {
  let cancelled = false,
    worker:
      | Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>
      | undefined,
    canvas: HTMLCanvasElement | undefined,
    rejectStop: (e: Error) => void = () => {};
  const stop = new Promise<never>((_, reject) => {
    rejectStop = reject;
  });
  const cancel = () => {
    cancelled = true;
    rejectStop(Error("Cancelled"));
    if (canvas) canvas.width = canvas.height = 0;
    void worker?.terminate();
  };
  const timeout = setTimeout(() => {
    cancelled = true;
    rejectStop(Error("OCR timed out. Try a smaller page."));
    void worker?.terminate();
  }, 120000);
  const work = (async () => {
    const { createWorker, OEM, PSM } = await import("tesseract.js");
    canvas = await pageCanvas(doc, index, 2600, rotation);
    if (cancelled) throw Error("Cancelled");
    worker = await createWorker(["ara", "eng"], OEM.LSTM_ONLY, {
      workerPath: "/pdf-studio/vendor/worker.min.js",
      corePath: "/pdf-studio/vendor",
      langPath: "/pdf-studio/vendor/lang",
      workerBlobURL: false,
      logger: (m) => {
        if (!cancelled) onProgress(m.status, m.progress || 0);
      },
      errorHandler: (e) => rejectStop(Error(String(e))),
    });
    if (cancelled) {
      await worker.terminate();
      throw Error("Cancelled");
    }
    await worker.setParameters({
      tessedit_pageseg_mode:
        layout === "block"
          ? PSM.SINGLE_BLOCK
          : layout === "sparse"
            ? PSM.SPARSE_TEXT
            : PSM.AUTO,
      preserve_interword_spaces: "1",
    });
    const { data } = await worker.recognize(canvas);
    if (cancelled) throw Error("Cancelled");
    return {
      text: data.text,
      confidence: data.confidence,
      reviewed: false,
    } as OCRResult;
  })();
  const promise = Promise.race([work, stop]).finally(async () => {
    clearTimeout(timeout);
    cancelled = true;
    if (canvas) canvas.width = canvas.height = 0;
    await worker?.terminate();
  });
  return { promise, cancel };
}
