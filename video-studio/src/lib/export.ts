import { prepareCreativeFonts } from "../creative/fonts";
import { cueTime } from "../sound/timing";
import { sceneAt, layerClip } from "../composition/scene";
import { musicTime, clipOpacity } from "./timeline";
import { Asset, Project, durationOf, clipDuration } from "../types";
import { locate, drawFrame } from "./media";
function loadSource(
  el: HTMLMediaElement | HTMLImageElement,
  url: string,
  signal: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    const event = el instanceof HTMLImageElement ? "load" : "loadeddata";
    const clean = () => {
      clearTimeout(timer);
      el.removeEventListener(event, ready);
      el.removeEventListener("error", error);
      signal.removeEventListener("abort", cancel);
    };
    const ready = () => {
      clean();
      resolve();
    };
    const error = () => {
      clean();
      reject(new Error("تعذّر تحميل الوسائط للتصدير"));
    };
    const cancel = () => {
      clean();
      reject(new Error("تم إلغاء التصدير"));
    };
    const timer = setTimeout(error, 20000);
    el.addEventListener(event, ready, { once: true });
    el.addEventListener("error", error, { once: true });
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    el.src = url;
  });
}
function seekSource(
  source: HTMLVideoElement,
  time: number,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  if (Math.abs(source.currentTime - time) < 0.002 && !source.seeking)
    return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      source.removeEventListener("seeked", ready);
      signal.removeEventListener("abort", cancel);
    };
    const ready = () => {
      cleanup();
      resolve();
    };
    const cancel = () => {
      cleanup();
      reject(new Error("تم إلغاء التصدير"));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("تعذّر تجهيز إطار الفيديو"));
    }, 10000);
    source.addEventListener("seeked", ready, { once: true });
    signal.addEventListener("abort", cancel, { once: true });
    source.currentTime = time;
  });
}
export type ExportOptions = {
  format?: "mp4" | "webm";
  fps?: 24 | 30 | 60;
  bitrateMbps?: number;
  onStage?: (message: string) => void;
};
export async function exportVideo(
  p: Project,
  assets: Asset[],
  height: number,
  onProgress: (v: number) => void,
  signal: AbortSignal,
  options: ExportOptions = {},
) {
  const {
    format = "webm",
    fps = 30,
    bitrateMbps = height >= 1080 ? 8 : 4,
    onStage = () => {},
  } = options;
  signal.throwIfAborted();
  if (p.texts.some(t => t.creative?.id === "weight")) await prepareCreativeFonts();
  if (!window.MediaRecorder)
    throw new Error("المتصفح لا يدعم تصدير الفيديو. استخدم Chrome أو Edge.");
  const nativeMp4 =
    format === "mp4"
      ? [
          "video/mp4;codecs=avc1.42001f,mp4a.40.2",
          "video/mp4;codecs=avc1.42001f",
        ].find((m) => MediaRecorder.isTypeSupported(m))
      : undefined;
  const mime =
    nativeMp4 ||
    [
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm",
    ].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime)
    throw new Error("المتصفح لا يدعم التسجيل المطلوب. جرّب Chrome أو Edge.");
  const transcode = format === "mp4" && !nativeMp4;
  const recordProgress = (value: number) =>
    onProgress(
      Math.min(
        transcode ? 70 : 99,
        Math.round(value * (transcode ? 0.7 : 0.99)),
      ),
    );
  onStage("تجهيز الوسائط…");
  if (!HTMLCanvasElement.prototype.captureStream || !window.AudioContext)
    throw new Error(
      "التصدير يحتاج متصفحًا يدعم Canvas Capture و Web Audio. جرّب Chrome أو Edge.",
    );
  const canvas = document.createElement("canvas");
  const [rw, rh] = p.ratio.split(":").map(Number);
  canvas.height = height;
  canvas.width = Math.round((height * rw) / rh / 2) * 2;
  // Keep the recording surface paintable. Detached canvases can stop producing
  // frames under GPU-backed compositing even when drawImage succeeds.
  canvas.style.cssText =
    "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:2147483647";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#080a0e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let stream: MediaStream | undefined;
  let canvasTrack: CanvasCaptureMediaStreamTrack | undefined;
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  // A zero-valued clock keeps image-only recordings timed correctly even if
  // the first composited video frame is delayed on a busy mobile GPU.
  const silentClock = audioCtx.createConstantSource();
  silentClock.offset.value = 0;
  silentClock.connect(dest);
  silentClock.start();
  const elements: HTMLMediaElement[] = [];
  const sources = new Map<string, HTMLVideoElement | HTMLImageElement>();
  const gains = new Map<HTMLVideoElement, GainNode>();
  let recorder: MediaRecorder | undefined;
  try {
    await audioCtx.resume();
    for (const clip of [
      ...p.clips.filter((c) => !c.gap),
      ...(p.overlays || []).map(layerClip),
    ]) {
      const a = assets.find((asset) => asset.id === clip.assetId);
      if (!a) throw new Error("وسيط مفقود في المشروع");
      const el =
        a.type === "image" ? new Image() : document.createElement("video");
      if (el instanceof HTMLVideoElement) {
        el.preload = "auto";
        el.playsInline = true;
        elements.push(el);
        const source = audioCtx.createMediaElementSource(el);
        const gain = audioCtx.createGain();
        source.connect(gain).connect(dest);
        gains.set(el, gain);
      }
      await loadSource(el, a.url, signal);
      sources.set(clip.id, el);
    }
    const audio = assets.find((a) => a.id === p.audioId);
    let music: HTMLAudioElement | undefined;
    if (audio) {
      music = new Audio();
      elements.push(music);
      const gain = audioCtx.createGain();
      gain.gain.value = p.audioVolume;
      audioCtx.createMediaElementSource(music).connect(gain).connect(dest);
      music.loop = false;
      music.playbackRate = p.audioSpeed || 1;
      await loadSource(music, audio.url, signal);
    }
    const cues = [];
    for (const cue of p.sounds || []) {
      const asset = assets.find((a) => a.id === cue.assetId);
      if (!asset) throw new Error("ملف مؤثر الصوت مفقود");
      const el = new Audio();
      elements.push(el);
      const gain = audioCtx.createGain();
      gain.gain.value = cue.volume;
      audioCtx.createMediaElementSource(el).connect(gain).connect(dest);
      await loadSource(el, asset.url, signal);
      cues.push({ cue, el });
    }
    // Prime the first multi-source blend before starting the realtime clock.
    // Software/GPU backends can spend seconds on their first cross-canvas copy;
    // doing that during recording would skip the transition's frames and audio.
    let boundary = 0;
    for (const [index, clip] of p.clips.entries()) {
      if (index && clip.transition?.kind && clip.transition.kind !== "none") {
        drawFrame(ctx, null, p, boundary, undefined, sources);
        ctx.getImageData(0, 0, 1, 1);
        break;
      }
      boundary += clipDuration(clip);
    }
    const first = locate(p, 0);
    if (first) {
      const source = sources.get(first.clip.id)!;
      if (source instanceof HTMLVideoElement && first.local > 0) {
        await seekSource(source, first.local, signal);
      }
      for (const entry of sceneAt(p, 0).entries) {
        const media = sources.get(entry.id);
        if (media instanceof HTMLVideoElement)
          await seekSource(media, entry.local, signal);
      }
      drawFrame(ctx, source, p, 0, first.clip, sources);
      // Allow the recording surface to paint before starting the recording clock.
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 200);
        requestAnimationFrame(() => {
          clearTimeout(timer);
          resolve();
        });
      });
      signal.throwIfAborted();
    }
    // Timed capture also works when manual requestFrame is throttled by a compositor.
    stream = canvas.captureStream(fps);
    canvasTrack = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    dest.stream.getAudioTracks().forEach((t) => stream!.addTrack(t));
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: bitrateMbps * 1000000,
    });
    const chunks: BlobPart[] = [];
    const stopped = new Promise<Blob>((r, j) => {
      recorder!.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder!.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        if (!blob.size)
          j(
            new Error(
              "لم يتم التقاط إطارات. جرّب Chrome أو Edge مع إبقاء الصفحة ظاهرة.",
            ),
          );
        else r(blob);
      };
      recorder!.onerror = () => j(new Error("حدث خطأ أثناء التصدير"));
    });
    void stopped.catch(() => {});
    onStage("تسجيل المشاهد والصوت…");
    recorder.start(250);

    const duration = durationOf(p);
    let previous = new Set<string>();
    const start = performance.now();
    await new Promise<void>((resolve, reject) => {
      const tick = async () => {
        try {
          if (signal.aborted) throw new Error("تم إلغاء التصدير");
          const time = Math.min((performance.now() - start) / 1000, duration);
          if (music && audio) {
            const local = musicTime(p, audio.duration, time);
            if (local === null) music.pause();
            else {
              if (Math.abs(music.currentTime - local) > 0.2)
                music.currentTime = local;
              if (music.paused) await music.play();
            }
          }
          for (const { cue, el } of cues) {
            const local = cueTime(p, cue, time);
            if (local === null) el.pause();
            else {
              if (Math.abs(el.currentTime - local) > 0.15)
                el.currentTime = local;
              if (el.paused) await el.play();
            }
          }
          const scene = sceneAt(p, time);
          const active = new Set(scene.entries.map((entry) => entry.id));
          for (const [id, source] of sources)
            if (source instanceof HTMLVideoElement && !active.has(id))
              source.pause();
          for (const entry of scene.entries) {
            const source = sources.get(entry.id);
            if (source instanceof HTMLVideoElement) {
              if (
                !previous.has(entry.id) ||
                (!entry.playing &&
                  Math.abs(source.currentTime - entry.local) > 0.02)
              )
                await seekSource(source, entry.local, signal);
              source.playbackRate = entry.clip.speed;
              gains.get(source)!.gain.value =
                entry.clip.volume *
                entry.audioAlpha *
                clipOpacity(entry.clip, entry.local);
              if (entry.playing && source.paused) await source.play();
              if (!entry.playing) source.pause();
            }
          }
          previous = active;
          drawFrame(ctx, null, p, time, undefined, sources);
          canvasTrack.requestFrame?.();
          recordProgress(Math.min(100, Math.round((time / duration) * 100)));
          if (time >= duration) resolve();
          else setTimeout(tick, 1000 / fps);
        } catch (e) {
          reject(e);
        }
      };
      void tick();
    });
    recorder.stop();
    const recorded = await stopped;
    signal.throwIfAborted();
    // Stop realtime resources before the (potentially memory-intensive) encode.
    elements.forEach((e) => e.pause());
    stream?.getTracks().forEach((t) => t.stop());
    if (transcode) {
      onStage("تحميل محرك MP4 المحلي ثم ترميز H.264 / AAC…");
      const { convertToMp4 } = await import("./mp4");
      const output = await convertToMp4(
        recorded,
        fps,
        (p) => onProgress(70 + Math.round(p * 0.29)),
        signal,
        bitrateMbps,
      );
      onProgress(100);
      return output;
    }
    onProgress(100);
    return recorded;
  } finally {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    elements.forEach((e) => {
      e.pause();
      e.removeAttribute("src");
      e.load();
    });
    stream?.getTracks().forEach((t) => t.stop());
    canvas.remove();
    silentClock.stop();
    await audioCtx.close();
  }
}
