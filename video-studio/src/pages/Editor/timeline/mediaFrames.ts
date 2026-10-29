import { uid, type Asset } from "../../../types";
function wait(
  video: HTMLVideoElement,
  event: string,
  signal: AbortSignal,
  run: () => void,
) {
  return new Promise<void>((resolve, reject) => {
    const clean = () => {
      clearTimeout(timer);
      video.removeEventListener(event, ready);
      video.removeEventListener("error", fail);
      signal.removeEventListener("abort", abort);
    };
    const ready = () => {
        clean();
        resolve();
      },
      fail = () => {
        clean();
        reject(new Error("تعذّر قراءة إطار الفيديو"));
      },
      abort = () => {
        clean();
        reject(new DOMException("Aborted", "AbortError"));
      };
    const timer = setTimeout(fail, 12000);
    video.addEventListener(event, ready, { once: true });
    video.addEventListener("error", fail, { once: true });
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else run();
  });
}
export async function videoFrames(
  url: string,
  times: number[],
  signal: AbortSignal,
  maxWidth = 320,
) {
  const v = document.createElement("video");
  v.preload = "auto";
  v.muted = true;
  v.playsInline = true;
  try {
    await wait(v, "loadeddata", signal, () => {
      v.src = url;
    });
    const c = document.createElement("canvas");
    c.width = Math.min(maxWidth, v.videoWidth);
    c.height = Math.max(
      1,
      Math.round((c.width * v.videoHeight) / v.videoWidth),
    );
    const ctx = c.getContext("2d")!;
    const images: string[] = [];
    for (const time of times) {
      signal.throwIfAborted();
      const t = Math.max(0, Math.min(v.duration - 0.03, time));
      if (Math.abs(v.currentTime - t) > 0.002)
        await wait(v, "seeked", signal, () => {
          v.currentTime = t;
        });
      ctx.drawImage(v, 0, 0, c.width, c.height);
      images.push(c.toDataURL("image/jpeg", 0.75));
    }
    return images;
  } finally {
    v.pause();
    v.removeAttribute("src");
    v.load();
  }
}
export async function freezeFrame(
  asset: Asset,
  time: number,
  signal: AbortSignal,
): Promise<Asset> {
  if (asset.type === "image")
    return {
      ...asset,
      id: uid(),
      name: `إطار ثابت — ${asset.name}`,
      duration: 2,
    };
  const [url] = await videoFrames(asset.url, [time], signal, 1920);
  return {
    id: uid(),
    name: `إطار ثابت — ${asset.name}`,
    type: "image",
    url,
    duration: 2,
  };
}

/** Bake this clip's crop, color, motion and effects, without duplicating captions/overlays. */
export async function freezeClipFrame(
  asset: Asset,
  project: import("../../../types").Project,
  clip: import("../../../types").Clip,
  at: number,
  signal: AbortSignal,
): Promise<Asset> {
  const { clipStart } = await import("../../../lib/timeline");
  const { drawFrame } = await import("../../../lib/media");
  const sourceTime =
    clip.start + (at - clipStart(project, clip.id)) * clip.speed;
  const raw = await freezeFrame(asset, sourceTime, signal);
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("تعذّر تجهيز الإطار"));
    image.src = raw.url;
  });
  signal.throwIfAborted();
  const [rw, rh] = project.ratio.split(":").map(Number),
    canvas = document.createElement("canvas");
  canvas.width = Math.round(1920 * Math.min(1, rw / rh));
  canvas.height = Math.round(1920 * Math.min(1, rh / rw));
  drawFrame(
    canvas.getContext("2d")!,
    image,
    { ...project, texts: [], overlays: [] },
    at,
    clip,
  );
  return { ...raw, url: canvas.toDataURL("image/jpeg", 0.92) };
}
