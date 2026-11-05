import { animatedWebP } from "./animated-webp";
import { embeddedFonts } from "./fonts";
import { svgString } from "./render";
import { motionFrame, motionSettings } from "./motion";
import type { Project } from "./types";
import {
  nouvellePalette,
  recense,
  indexe,
  gifIndexe,
} from "../bloub-svg/src/ui/anime";

export function videoFormat() {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof HTMLCanvasElement === "undefined" ||
    !HTMLCanvasElement.prototype.captureStream
  )
    return null;
  for (const mime of [
    "video/mp4;codecs=avc1.42E01E",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ])
    if (MediaRecorder.isTypeSupported(mime))
      return { mime, extension: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  return null;
}
function check(signal: AbortSignal) {
  signal.throwIfAborted();
}
export type MotionExportOptions = {
  fps?: 10 | 20 | 24;
  quality?: number;
  repeats?: number;
  videoBitrate?: number;
};
export function webpSupported() {
  try {
    return (
      typeof document !== "undefined" &&
      document
        .createElement("canvas")
        .toDataURL("image/webp")
        .startsWith("data:image/webp")
    );
  } catch {
    return false;
  }
}
export function motionOutputSize(project: Project, size: number) {
  const ratio = size / Math.max(project.width, project.height);
  return {
    width: Math.max(2, Math.round((project.width * ratio) / 2) * 2),
    height: Math.max(2, Math.round((project.height * ratio) / 2) * 2),
  };
}
function optionsFor(options: MotionExportOptions, video = false) {
  const fps = options.fps ?? (video ? 24 : 20),
    repeats = options.repeats ?? 1,
    quality = options.quality ?? 0.8,
    videoBitrate = options.videoBitrate ?? 4_000_000;
  if (
    ![10, 20, ...(video ? [24] : [])].includes(fps) ||
    !Number.isInteger(repeats) ||
    repeats < 1 ||
    repeats > 5 ||
    !Number.isFinite(quality) ||
    quality < 0.1 ||
    quality > 1 ||
    !Number.isFinite(videoBitrate) ||
    videoBitrate < 500_000 ||
    videoBitrate > 10_000_000
  )
    throw Error("Invalid export options");
  return { fps, repeats, quality, videoBitrate };
}
async function renderer(project: Project, size: number, signal: AbortSignal) {
  if (!Number.isInteger(size) || size < 128 || size > 1024)
    throw Error("Choose 128–1024px");
  check(signal);
  await document.fonts.ready;
  const css = await embeddedFonts([
    ...new Set([
      "cairo",
      ...project.nodes.filter((n) => n.kind === "text").map((n) => n.font),
    ]),
  ]);
  check(signal);
  const canvas = document.createElement("canvas");
  Object.assign(canvas, motionOutputSize(project, size));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw Error("Canvas unavailable");
  return {
    canvas,
    ctx,
    async draw(t: number) {
      check(signal);
      const url = URL.createObjectURL(
        new Blob([svgString(motionFrame(project, t), css)], {
          type: "image/svg+xml",
        }),
      );
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        check(signal);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      } finally {
        URL.revokeObjectURL(url);
      }
    },
  };
}
const yieldUI = () => new Promise((resolve) => setTimeout(resolve, 0));
export async function exportMotionGif(
  project: Project,
  size: number,
  signal: AbortSignal,
  progress: (n: number) => void,
  options: MotionExportOptions = {},
) {
  const { fps } = optionsFor(options);
  if (size > 512) throw Error("GIF is limited to 512px");
  const { canvas, ctx, draw } = await renderer(project, size, signal),
    frames = Math.round(motionSettings(project).duration * fps),
    palette = nouvellePalette();
  // Two passes keep RGBA memory bounded to one frame and share one palette.
  for (let i = 0; i < frames; i++) {
    await draw(i / frames);
    recense(palette, ctx.getImageData(0, 0, canvas.width, canvas.height).data);
    progress(((i + 1) / frames) * 0.45);
    await yieldUI();
  }
  const indexed: Uint8Array[] = [];
  for (let i = 0; i < frames; i++) {
    await draw(i / frames);
    indexed.push(
      indexe(palette, ctx.getImageData(0, 0, canvas.width, canvas.height).data),
    );
    progress(0.45 + ((i + 1) / frames) * 0.5);
    await yieldUI();
  }
  check(signal);
  const data = gifIndexe(
    palette,
    indexed,
    canvas.width,
    canvas.height,
    1000 / fps,
  );
  check(signal);
  progress(1);
  return new Blob([data], { type: "image/gif" });
}
export async function exportMotionVideo(
  project: Project,
  size: number,
  signal: AbortSignal,
  progress: (n: number) => void,
  options: MotionExportOptions = {},
) {
  const { fps, repeats, videoBitrate } = optionsFor(options, true);
  const format = videoFormat();
  if (!format) throw Error("Video recording is unavailable in this browser");
  // Video is flattened intentionally: GIF remains the transparent animation option.
  const source = { ...project, background: project.background || "#ffffff" };
  const { canvas, draw } = await renderer(source, size, signal);
  if (!canvas.captureStream)
    throw Error("Canvas video recording is unavailable");
  await draw(0);
  check(signal);
  const stream = canvas.captureStream(fps),
    chunks: Blob[] = [];
  let recorder: MediaRecorder | undefined;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType: format.mime,
      videoBitsPerSecond: videoBitrate,
    });
    const recording = recorder;
    let failure: Error | undefined;
    const finished = new Promise<void>((resolve) => {
      recording.onstop = () => resolve();
      recording.onerror = () => {
        failure = Error("Video encoder failed");
        resolve();
      };
    });
    recording.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recording.start(100);
    const started = performance.now(),
      cycle = motionSettings(project).duration * 1000,
      duration = cycle * repeats;
    while (performance.now() - started < duration) {
      check(signal);
      if (document.hidden)
        throw Error("Keep this tab visible while recording video");
      await draw(((performance.now() - started) % cycle) / cycle);
      progress(Math.min(0.98, (performance.now() - started) / duration));
      if (failure) throw failure;
      const next =
        started +
        ((Math.floor(((performance.now() - started) * fps) / 1000) + 1) *
          1000) /
          fps;
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.max(0, Math.min(started + duration, next) - performance.now()),
        ),
      );
    }
    recording.stop();
    await finished;
    check(signal);
    if (failure) throw failure;
    const blob = new Blob(chunks, { type: format.mime });
    if (!blob.size) throw Error("Video encoder produced an empty file");
    progress(1);
    return { blob, extension: format.extension };
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
  }
}

export async function exportMotionWebP(
  project: Project,
  size: number,
  signal: AbortSignal,
  progress: (n: number) => void,
  options: MotionExportOptions = {},
) {
  if (!webpSupported())
    throw Error("Animated WebP encoding is unavailable in this browser");
  const { fps, quality } = optionsFor(options),
    { canvas, draw } = await renderer(project, size, signal),
    count = Math.round(motionSettings(project).duration * fps),
    frames: Uint8Array[] = [];
  for (let i = 0; i < count; i++) {
    await draw(i / count);
    check(signal);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b && b.type === "image/webp"
            ? resolve(b)
            : reject(Error("WebP encoding failed")),
        "image/webp",
        quality,
      ),
    );
    check(signal);
    frames.push(new Uint8Array(await blob.arrayBuffer()));
    progress(((i + 1) / count) * 0.95);
    await yieldUI();
  }
  check(signal);
  const bytes = animatedWebP(frames, canvas.width, canvas.height, 1000 / fps);
  check(signal);
  progress(1);
  return new Blob([bytes], { type: "image/webp" });
}
