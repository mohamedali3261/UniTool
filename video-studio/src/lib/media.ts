import { clipTransitionMask } from "../creative/clipTransitions";
import { isBackgroundText } from "../composition/stacking";
import { drawInterfaceScene } from "../templates/interface-flow/render";
import { classifyMedia, localMediaURL, releaseMediaURL } from "../media/files";
import { drawTextLayers } from "../text/render";
import { motionAt } from "../animation/evaluate";
import { sceneAt } from "../composition/scene";
import { effectFrame, drawEffectOverlay } from "../effects/renderer";
import { clipOpacity } from "./timeline";
import { Asset, Clip, Project, clipDuration, filterCss, uid } from "../types";
/** The metadata probe is cancellable and never decodes the whole file into memory. */
export async function readAsset(
  file: File,
  signal?: AbortSignal,
): Promise<Asset> {
  signal?.throwIfAborted();
  const { type, mime } = await classifyMedia(file);
  signal?.throwIfAborted();
  const url = localMediaURL(
    file.type === mime ? file : file.slice(0, file.size, mime),
  );
  try {
    const metadata = await new Promise<{
      duration: number;
      width?: number;
      height?: number;
    }>((resolve, reject) => {
      const el = type === "image" ? new Image() : document.createElement(type);
      let settled = false,
        recovering = false;
      const clean = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        el.onerror = null;
        if (el instanceof HTMLImageElement) {
          el.onload = null;
          el.src = "";
        } else {
          el.onloadedmetadata = null;
          el.onloadeddata = null;
          el.ondurationchange = null;
          el.onseeked = null;
          el.pause();
          el.removeAttribute("src");
          el.load();
        }
      };
      const finish = (
        value?: { duration: number; width?: number; height?: number },
        error?: unknown,
      ) => {
        if (settled) return;
        settled = true;
        clean();
        error ? reject(error) : resolve(value!);
      };
      const abort = () =>
        finish(
          undefined,
          signal?.reason || new DOMException("Aborted", "AbortError"),
        );
      const timer = setTimeout(
        () =>
          finish(
            undefined,
            new Error(
              `${file.name}: انتهت مهلة قراءة الملف؛ قد يكون تالفًا أو ترميزه غير مدعوم. جرّب MP4/H.264 أو WebM/VP9.`,
            ),
          ),
        file.size > 256 * 1024 * 1024 ? 60000 : 30000,
      );
      signal?.addEventListener("abort", abort, { once: true });
      el.onerror = () =>
        finish(
          undefined,
          new Error(
            `${file.name}: المتصفح لا يستطيع فك ترميز هذا الملف. الامتداد وحده لا يكفي؛ حوّله إلى MP4/H.264 مع صوت AAC أو WebM/VP9.`,
          ),
        );
      if (el instanceof HTMLImageElement)
        el.onload = () =>
          finish({
            duration: 5,
            width: el.naturalWidth,
            height: el.naturalHeight,
          });
      else {
        el.preload = type === "video" ? "auto" : "metadata";
        el.muted = true;
        const ready = () => {
          if (!Number.isFinite(el.duration) || el.duration <= 0) return;
          if (
            type === "video" &&
            (el.readyState < 2 || !(el as HTMLVideoElement).videoWidth)
          )
            return;
          finish({
            duration: el.duration,
            ...(type === "video"
              ? {
                  width: (el as HTMLVideoElement).videoWidth,
                  height: (el as HTMLVideoElement).videoHeight,
                }
              : {}),
          });
        };
        el.onloadedmetadata = () => {
          if (el.duration === Infinity && !recovering) {
            recovering = true;
            el.currentTime = 1e10;
          } else ready();
        };
        el.ondurationchange = ready;
        el.onloadeddata = ready;
        el.onseeked = ready;
      }
      el.src = url;
      if (signal?.aborted) abort();
    });
    signal?.throwIfAborted();
    return {
      id: uid(),
      name: file.name,
      type,
      url,
      size: file.size,
      ...metadata,
    };
  } catch (error) {
    releaseMediaURL(url);
    throw error;
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
      if (clip?.designScene) {
        ctx.save();
        ctx.translate((-sw * scale) / 2, (-sh * scale) / 2);
        ctx.scale((sw * scale) / 720, (sh * scale) / 1280);
        drawInterfaceScene(
          ctx,
          clip.designScene,
          clip.start + elapsed * clip.speed,
          clip.designAccent,
        );
        ctx.restore();
      }
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
  drawTextLayers(ctx, p.texts, time, !!p.tracks?.text?.hidden);
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
  const paintOverlay = (entry: import("../composition/scene").SceneEntry) => {
    const media = sources.get(entry.id);
    if (!media) return;
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
  };
  const baseCount = entries.filter((entry) => !entry.overlay).length;
  for (const entry of entries) {
    if (entry.overlay) continue;
    if (entry.overlay && !flashed) {
      paintFlash();
      flashed = true;
    }
    const media = sources.get(entry.id);
    if (!media) continue;
    if (entry.overlay) {
      paintOverlay(entry);
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
        // This surface is copied into another canvas every frame. CPU backing
        // avoids expensive GPU readbacks at the first blended transition.
        surface.getContext("2d", { willReadFrequently: true })!,
        media,
        withoutText,
        time,
        entry.clip,
        entry.elapsed,
      );
      ctx.save();
      ctx.globalAlpha = entry.alpha;
      clipTransitionMask(ctx, entry, w, h);
      ctx.translate(w / 2 + entry.shift * w, h / 2);
      ctx.scale(entry.scale, entry.scale);
      ctx.drawImage(surface, -w / 2, -h / 2);
      ctx.restore();
    }
  }
  if (!flashed) paintFlash();
  drawTextLayers(
    ctx,
    p.texts.filter(isBackgroundText),
    time,
    !!p.tracks?.text?.hidden,
  );
  for (const entry of entries)
    if (entry.overlay?.backgroundLayer) paintOverlay(entry);
  for (const entry of entries)
    if (
      entry.overlay &&
      !entry.overlay.backgroundLayer &&
      !entry.overlay.foreground
    )
      paintOverlay(entry);
  drawSingleFrame(
    ctx,
    null,
    { ...p, texts: p.texts.filter((t) => !isBackgroundText(t)) },
    time,
    undefined,
    0,
    false,
  );
  for (const entry of entries)
    if (entry.overlay?.foreground && !entry.overlay.backgroundLayer)
      paintOverlay(entry);
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
