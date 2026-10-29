import { textLayout } from "../text/layout";
import { motionAt, textAt } from "../animation/evaluate";
import { sceneAt } from "../composition/scene";
import { effectFrame, drawEffectOverlay } from "../effects/renderer";
import { clipOpacity } from "./timeline";
import { Asset, Clip, Project, clipDuration, filterCss, uid } from "../types";
/** Optional cancellation also releases the temporary metadata decoder. */
export async function readAsset(
  file: File,
  signal?: AbortSignal,
): Promise<Asset> {
  signal?.throwIfAborted();
  const type = file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("audio/")
      ? "audio"
      : file.type.startsWith("image/")
        ? "image"
        : null;
  if (!type) throw new Error("اختر ملف فيديو أو صورة أو صوت مدعوم.");
  const url = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const el = type === "image" ? new Image() : document.createElement(type);
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        el.onerror = null;
        if (el instanceof HTMLImageElement) el.onload = null;
        else {
          el.onloadedmetadata = null;
          el.pause();
          el.removeAttribute("src");
          el.load();
        }
      };
      const finish = (duration?: number, error?: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve(duration!);
      };
      const abort = () =>
        finish(
          undefined,
          signal?.reason || new DOMException("Aborted", "AbortError"),
        );
      const timer = setTimeout(
        () => finish(undefined, new Error("تعذّر قراءة الملف")),
        15000,
      );
      signal?.addEventListener("abort", abort, { once: true });
      el.onerror = () =>
        finish(undefined, new Error("صيغة الملف غير مدعومة في المتصفح"));
      if (el instanceof HTMLImageElement) el.onload = () => finish(5);
      else {
        el.preload = "metadata";
        el.onloadedmetadata = () =>
          Number.isFinite(el.duration) && el.duration > 0
            ? finish(el.duration)
            : finish(undefined, new Error("مدة الملف غير صالحة"));
      }
      el.src = url;
      if (signal?.aborted) abort();
    });
    signal?.throwIfAborted();
    return { id: uid(), name: file.name, type, url, duration };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}
export function locate(
  p: Project,
  time: number,
): { clip: Clip; local: number } | null {
  let offset = 0;
  for (const clip of p.clips) {
    const d = clipDuration(clip);
    if (time < offset + d)
      return {
        clip,
        local: clip.start + Math.max(0, time - offset) * clip.speed,
      };
    offset += d;
  }
  const c = p.clips.at(-1);
  return c ? { clip: c, local: Math.max(c.start, c.end - 0.03) } : null;
}
function drawSingleFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource | null,
  p: Project,
  time: number,
  clip?: Clip,
  elapsedOverride?: number,
  clear = true,
  alpha = 1,
) {
  const { width: w, height: h } = ctx.canvas;
  if (clear) {
    ctx.fillStyle = "#080a0e";
    ctx.fillRect(0, 0, w, h);
  }
  const located = clip ? locate(p, time) : null;
  const elapsed =
    elapsedOverride ??
    (clip && located ? (located.local - clip.start) / clip.speed : 0);
  const motion = clip
    ? motionAt(clip, elapsed)
    : { x: 0, y: 0, scale: 1, opacity: 1 };
  const e = effectFrame(
    clip?.effect,
    w,
    h,
    elapsed,
    clip ? elapsed / ((clip.end - clip.start) / clip.speed) : 0,
    clip?.effectIntensity ?? 1,
    clip?.effectSpeed ?? 1,
  );
  if (source) {
    const s = source as HTMLVideoElement & HTMLImageElement;
    const sw = s.videoWidth || s.naturalWidth;
    const sh = s.videoHeight || s.naturalHeight;
    if (sw && sh) {
      const rotation = ((clip?.rotation || 0) * Math.PI) / 180;
      const boundsW =
          Math.abs(sw * Math.cos(rotation)) + Math.abs(sh * Math.sin(rotation)),
        boundsH =
          Math.abs(sw * Math.sin(rotation)) + Math.abs(sh * Math.cos(rotation));
      const scale =
        (clip?.fit === "cover"
          ? Math.max(w / boundsW, h / boundsH)
          : Math.min(w / boundsW, h / boundsH)) * (clip?.zoom ?? 1);
      ctx.save();
      ctx.filter = clip ? filterCss(clip) : "none";

      ctx.globalAlpha =
        alpha *
        motion.opacity *
        (clip ? clipOpacity(clip, clip.start + elapsed * clip.speed) : 1);
      ctx.translate(
        w / 2 + (e.camera.x || 0) + ((motion.x + (clip?.x || 0)) * w) / 100,
        h / 2 + (e.camera.y || 0) + ((motion.y + (clip?.y || 0)) * h) / 100,
      );
      ctx.scale(motion.scale, motion.scale);
      ctx.scale(e.camera.zoom ?? 1, e.camera.zoom ?? 1);
      ctx.rotate(e.camera.rotate || 0);
      ctx.rotate(rotation);
      ctx.scale(clip?.flipX ? -1 : 1, clip?.flipY ? -1 : 1);
      ctx.drawImage(
        source,
        (-sw * scale) / 2,
        (-sh * scale) / 2,
        sw * scale,
        sh * scale,
      );
      ctx.restore();
    }
  }
  if (e.definition?.overlay) {
    ctx.save();
    ctx.globalAlpha =
      alpha *
      motion.opacity *
      (clip ? clipOpacity(clip, clip.start + elapsed * clip.speed) : 1);
    drawEffectOverlay(ctx, e);
    ctx.restore();
  }
  for (const t of p.texts.filter(
    (t) =>
      !t.hidden && !p.tracks?.text?.hidden && time >= t.start && time < t.end,
  )) {
    const animation = textAt(t, time);
    ctx.save();
    ctx.globalAlpha = animation.opacity * (t.opacity ?? 1);
    ctx.translate((w * t.x) / 100, (h * (t.y + animation.y)) / 100);
    ctx.rotate(((t.rotation || 0) * Math.PI) / 180);
    ctx.scale(animation.scale, animation.scale);
    const layout = textLayout(ctx, t, w);
    ctx.font = layout.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = t.color;
    ctx.shadowColor = "#000a";
    ctx.shadowBlur = 8;
    if (t.background) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.fillStyle = t.background;
      ctx.fillRect(
        -layout.width / 2 - layout.size * 0.25,
        -layout.size * 0.65,
        layout.width + layout.size * 0.5,
        layout.height + layout.size * 0.3,
      );
      ctx.restore();
    }
    const lines = animation.text.split("\n");
    lines.forEach((line, i) => {
      const y = i * layout.size * 1.2;
      if (t.outline) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = Math.max(1, layout.size * 0.07);
        ctx.lineJoin = "round";
        ctx.strokeText(line, 0, y, w * 0.94);
      }
      ctx.fillText(line, 0, y, w * 0.94);
    });
    ctx.restore();
  }
}
/** One compositor for preview, snapshots and both export formats. */
const scratch = new WeakMap<CanvasRenderingContext2D, HTMLCanvasElement>();
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource | null,
  p: Project,
  time: number,
  clip?: Clip,
  sources?: Map<string, CanvasImageSource>,
) {
  if (!sources) {
    drawSingleFrame(ctx, source, p, time, clip);
    return;
  }
  const { entries, flash } = sceneAt(p, time);
  const w = ctx.canvas.width,
    h = ctx.canvas.height;
  ctx.fillStyle = "#080a0e";
  ctx.fillRect(0, 0, w, h);
  const withoutText = { ...p, texts: [] };
  let flashed = false;
  const paintFlash = () => {
    if (!flash) return;
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };
  const baseCount = entries.filter((entry) => !entry.overlay).length;
  for (const entry of entries) {
    if (entry.overlay && !flashed) {
      paintFlash();
      flashed = true;
    }
    const media = sources.get(entry.id);
    if (!media) continue;
    if (entry.overlay) {
      const l = entry.overlay;
      ctx.save();
      ctx.translate((w * l.x) / 100, (h * l.y) / 100);
      ctx.scale(l.width / 100, l.width / 100);
      ctx.translate(-w / 2, -h / 2);
      drawSingleFrame(
        ctx,
        media,
        withoutText,
        time,
        entry.clip,
        entry.elapsed,
        false,
        entry.alpha,
      );
      ctx.restore();
    } else {
      if (baseCount === 1) {
        drawSingleFrame(
          ctx,
          media,
          withoutText,
          time,
          entry.clip,
          entry.elapsed,
        );
        continue;
      }
      // Composite a complete scene, including letterboxing, rather than fading to black.
      let surface = scratch.get(ctx);
      if (!surface) {
        surface = document.createElement("canvas");
        scratch.set(ctx, surface);
      }
      if (surface.width !== w) surface.width = w;
      if (surface.height !== h) surface.height = h;
      drawSingleFrame(
        surface.getContext("2d")!,
        media,
        withoutText,
        time,
        entry.clip,
        entry.elapsed,
      );
      ctx.save();
      ctx.globalAlpha = entry.alpha;
      ctx.translate(w / 2 + entry.shift * w, h / 2);
      ctx.scale(entry.scale, entry.scale);
      ctx.drawImage(surface, -w / 2, -h / 2);
      ctx.restore();
    }
  }
  if (!flashed) paintFlash();
  drawSingleFrame(ctx, null, p, time, undefined, 0, false);
}
/** Portable filenames avoid browsers dropping the extension on non-Latin names. */
export function portableFilename(name: string) {
  const extension = name.match(/(\.unitool\.json|\.[a-z0-9]+)$/i)?.[0] || "";
  const base = extension ? name.slice(0, -extension.length) : name;
  const slug = base
    .normalize("NFKD")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
  return `${slug || "UniTool-project"}${extension}`;
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = portableFilename(name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
