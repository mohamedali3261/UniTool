import { FFmpeg } from "@ffmpeg/ffmpeg";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";

/** A separate worker per job: cancelling never terminates another tool's FFmpeg. */
export async function convertToMp4(
  blob: Blob,
  fps: number,
  onProgress: (p: number) => void,
  signal: AbortSignal,
  bitrateMbps = 4,
): Promise<Blob> {
  const ffmpeg = new FFmpeg();
  const cancel = () => ffmpeg.terminate();
  signal.throwIfAborted();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    await ffmpeg.load({
      coreURL: new URL(coreURL, location.href).href,
      wasmURL: new URL(wasmURL, location.href).href,
    });
    signal.throwIfAborted();
    await ffmpeg.writeFile(
      "input.webm",
      new Uint8Array(await blob.arrayBuffer()),
    );
    ffmpeg.on("progress", ({ progress }) =>
      onProgress(Math.min(99, Math.max(0, Math.round(progress * 100)))),
    );
    const code = await ffmpeg.exec([
      "-i",
      "input.webm",
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-b:v",
      `${bitrateMbps}M`,
      "-maxrate",
      `${bitrateMbps}M`,
      "-bufsize",
      `${bitrateMbps * 2}M`,
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(fps),
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      "output.mp4",
    ]);
    signal.throwIfAborted();
    if (code !== 0)
      throw new Error("تعذّر ترميز MP4. جرّب دقة أقل أو صدّر WebM.");
    const output = await ffmpeg.readFile("output.mp4");
    if (typeof output === "string" || !output.byteLength)
      throw new Error("لم يتم إنشاء ملف MP4 صالح");
    return new Blob([new Uint8Array(output)], { type: "video/mp4" });
  } catch (e) {
    if (signal.aborted) throw new Error("تم إلغاء التصدير");
    throw e;
  } finally {
    signal.removeEventListener("abort", cancel);
    ffmpeg.terminate();
  }
}
