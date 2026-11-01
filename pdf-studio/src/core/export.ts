import { PDFDocument, degrees } from "pdf-lib";
import type { EditState } from "./types";
import type { PdfDoc } from "./pdf";
import { loadFonts, drawAnnotations } from "./annotations";
export async function exportPdf(
  bytes: Uint8Array,
  doc: PdfDoc,
  state: EditState,
  onProgress: (v: number) => void,
) {
  await loadFonts();
  const source = await PDFDocument.load(bytes, { updateMetadata: false }),
    out = await PDFDocument.create();
  for (let i = 0; i < state.pages.length; i++) {
    const p = state.pages[i],
      [page] = await out.copyPages(source, [p.source]);
    out.addPage(page);
    if (p.annotations.length) {
      const proxy = await doc.getPage(p.source + 1),
        view = proxy.getViewport({ scale: 1 }),
        scale = Math.min(
          2.5,
          Math.sqrt(12_000_000 / (view.width * view.height)),
        ),
        canvas = document.createElement("canvas");
      canvas.width = Math.ceil(view.width * scale);
      canvas.height = Math.ceil(view.height * scale);
      drawAnnotations(canvas.getContext("2d")!, p.annotations, scale);
      const data = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(Error("Image encoding failed"))),
          "image/png",
        ),
      );
      const image = await out.embedPng(await data.arrayBuffer()),
        [x, y] = view.convertToPdfPoint(0, view.height);
      page.drawImage(image, {
        x,
        y,
        width: view.width,
        height: view.height,
        rotate: degrees(proxy.rotate),
      });
      canvas.width = canvas.height = 0;
    }
    page.setRotation(degrees((page.getRotation().angle + p.rotation) % 360));
    onProgress(Math.round(((i + 1) / state.pages.length) * 100));
  }
  out.setProducer("UniTool PDF Studio");
  out.setTitle("Edited document");
  return new Blob([await out.save()], { type: "application/pdf" });
}
