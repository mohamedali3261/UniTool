import { effectFrame, drawEffectOverlay } from "../effects/renderer";
import { clipOpacity } from "./timeline";
import { Asset, Clip, Project, clipDuration, filterCss, uid } from "../types";
export async function readAsset(file: File): Promise<Asset> {
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
      const timer = setTimeout(
        () => reject(new Error("تعذّر قراءة الملف")),
        15000,
      );
      const done = (d: number) => {
        clearTimeout(timer);
        resolve(d);
      };
      el.onerror = () => {
        clearTimeout(timer);
        reject(new Error("صيغة الملف غير مدعومة في المتصفح"));
      };
      if (el instanceof HTMLImageElement) {
        el.onload = () => done(5);
      } else {
        el.preload = "metadata";
        el.onloadedmetadata = () =>
          Number.isFinite(el.duration)
            ? done(el.duration)
            : reject(new Error("مدة الملف غير صالحة"));
      }
      el.src = url;
    });
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
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource | null,
  p: Project,
  time: number,
  clip?: Clip,
) {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#080a0e";
  ctx.fillRect(0, 0, w, h);
  const located = clip ? locate(p, time) : null;
  const elapsed =
    clip && located ? (located.local - clip.start) / clip.speed : 0;
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
      const sideways = (clip?.rotation || 0) % 180 !== 0;
      const boundsW = sideways ? sh : sw,
        boundsH = sideways ? sw : sh;
      const scale =
        (clip?.fit === "cover"
          ? Math.max(w / boundsW, h / boundsH)
          : Math.min(w / boundsW, h / boundsH)) * (clip?.zoom ?? 1);
      ctx.save();
      ctx.filter = clip ? filterCss(clip) : "none";

      ctx.globalAlpha = clip && located ? clipOpacity(clip, located.local) : 1;
      ctx.translate(w / 2 + (e.camera.x || 0), h / 2 + (e.camera.y || 0));
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
    ctx.globalAlpha = clip && located ? clipOpacity(clip, located.local) : 1;
    drawEffectOverlay(ctx, e);
    ctx.restore();
  }
  for (const t of p.texts.filter((t) => time >= t.start && time < t.end)) {
    ctx.save();
    ctx.font = `700 ${(t.size * w) / 960}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = t.color;
    ctx.shadowColor = "#000a";
    ctx.shadowBlur = 8;
    const lines = t.text.split("\n");
    lines.forEach((line, i) =>
      ctx.fillText(
        line,
        (w * t.x) / 100,
        (h * t.y) / 100 + ((i * t.size * w) / 960) * 1.2,
        w * 0.94,
      ),
    );
    ctx.restore();
  }
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
