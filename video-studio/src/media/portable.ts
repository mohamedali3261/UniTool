import type { Asset, Project } from "../types";
import { mediaBlob, localMediaSize } from "./files";
export const portableMemoryLimit = 128 * 1024 * 1024;
export const estimatedMediaBytes = (assets: Asset[]) =>
  assets.reduce(
    (sum, a) =>
      sum +
      (a.size ||
        localMediaSize(a.url) ||
        (a.url.startsWith("data:") ? a.url.length * 0.75 : 0)),
    0,
  );
type Writer = {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
  abort: () => Promise<void>;
};
type Picker = (
  options: unknown,
) => Promise<{ createWritable: () => Promise<Writer> }>;
/** Encode complete triples, carrying at most two bytes between chunks. */
export async function writeBase64(
  blob: Blob,
  write: (data: string) => Promise<void>,
) {
  const reader = blob.stream().getReader();
  let tail = new Uint8Array(0);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const bytes = new Uint8Array(tail.length + value.length);
      bytes.set(tail);
      bytes.set(value, tail.length);
      const end = bytes.length - (bytes.length % 3);
      for (let i = 0; i < end; i += 49152) {
        const part = bytes.subarray(i, Math.min(end, i + 49152));
        await write(btoa(String.fromCharCode(...part)));
      }
      tail = bytes.slice(end);
    }
    if (tail.length) await write(btoa(String.fromCharCode(...tail)));
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
export async function saveLargeProject(project: Project, assets: Asset[]) {
  const picker = (window as Window & { showSaveFilePicker?: Picker })
    .showSaveFilePicker;
  if (!picker)
    throw new Error(
      "هذا المشروع أكبر من حد تنزيل JSON الآمن (128MB). استخدم Chrome/Edge يدعم حفظ الملفات مباشرة، أو قلّل الوسائط. الحفظ المحلي يعتمد على المساحة المتاحة.",
    );
  const handle = await picker.call(window, {
    suggestedName: `${project.name}.unitool.json`,
    types: [
      {
        description: "UniTool project",
        accept: { "application/json": [".json"] },
      },
    ],
  });
  const writer = await handle.createWritable();
  try {
    await writer.write(
      `{"version":1,"project":${JSON.stringify(project)},"assets":[`,
    );
    for (const [i, asset] of assets.entries()) {
      const { url, ...metadata } = asset;
      await writer.write(
        `${i ? "," : ""}${JSON.stringify(metadata).slice(0, -1)},"url":"`,
      );
      if (url.startsWith("data:")) {
        for (let offset = 0; offset < url.length; offset += 65536)
          await writer.write(
            JSON.stringify(url.slice(offset, offset + 65536)).slice(1, -1),
          );
      } else {
        const blob = await mediaBlob(url);
        await writer.write(
          JSON.stringify(
            `data:${blob.type || `${asset.type}/${asset.type === "video" ? "mp4" : asset.type === "audio" ? "mpeg" : "png"}`};base64,`,
          ).slice(1, -1),
        );
        await writeBase64(blob, (data) => writer.write(data));
      }
      await writer.write('"}');
    }
    await writer.write("]}");
    await writer.close();
  } catch (error) {
    await writer.abort().catch(() => {});
    throw error;
  }
}
