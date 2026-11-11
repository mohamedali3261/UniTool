import { fabric } from "fabric";
import type { ProjectItem } from "../../types";
import { exportCanvasImage } from "../../utils/fabricHelpers";
import { withoutGuides } from "../../packaging/print";
import { downloadBlob as safeDownloadBlob } from "../../../../src/utils/download";
export function downloadBlob(blob: Blob, name: string) {
  safeDownloadBlob(blob, name);
}
function safeName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "design";
}
export async function batchVariants(
  canvas: fabric.Canvas,
  width: number,
  height: number,
  title: string,
) {
  if (width * height > 16_000_000) throw Error("ZIP_SIZE");
  const { default: JSZip } = await import("jszip"),
    zip = new JSZip(),
    original = canvas.backgroundColor;
  try {
    const originalPng = withoutGuides(canvas, true, () =>
      exportCanvasImage(canvas, "png", 1, 1, width, height),
    );
    canvas.backgroundColor = "";
    const clear = withoutGuides(canvas, true, () =>
      exportCanvasImage(canvas, "png", 1, 1, width, height),
    );
    zip.file(`${safeName(title)}-background.png`, originalPng.split(",")[1], {
      base64: true,
    });
    zip.file(`${safeName(title)}-transparent.png`, clear.split(",")[1], {
      base64: true,
    });
    return await zip.generateAsync({ type: "blob" });
  } finally {
    canvas.backgroundColor = original;
    canvas.requestRenderAll();
  }
}
export async function batchProjects(projects: ProjectItem[]) {
  if (!projects.length || projects.length > 10)
    throw Error("Select 1–10 projects");
  const { default: JSZip } = await import("jszip"),
    zip = new JSZip();
  let bytes = 0;
  await document.fonts.ready;
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    if (!p.width || !p.height || p.width * p.height > 16_000_000)
      throw Error("ZIP_SIZE");
    const surface = new fabric.StaticCanvas(null, {
      width: p.width,
      height: p.height,
      enableRetinaScaling: false,
      renderOnAddRemove: false,
    });
    let completed = false;
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          completed = true;
          reject(Error("Asset loading timed out"));
        }, 15000);
        surface.loadFromJSON(p.canvasData, () => {
          if (completed) {
            surface.dispose();
            return;
          }
          clearTimeout(timer);
          resolve();
        });
      });
      surface.renderAll();
      const data = withoutGuides(surface as fabric.Canvas, true, () => surface.toDataURL({ format: "png", multiplier: 1, enableRetinaScaling: false })).split(",")[1];
      bytes += data.length * 0.75;
      if (bytes > 40 * 1024 * 1024) throw Error("ZIP_SIZE");
      zip.file(`${i + 1}-${safeName(p.title)}.png`, data, { base64: true });
    } finally {
      if (!completed) surface.dispose();
    }
  }
  return zip.generateAsync({ type: "blob" });
}
