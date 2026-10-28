import type { Asset } from "../types";
import type { SceneEntry } from "./scene";
import { clipOpacity } from "../lib/timeline";
/** Only active scene decoders are retained; duplicate uses have independent media clocks. */
export class PreviewMedia {
  private slots = new Map<
    string,
    {
      url: string;
      el: HTMLVideoElement | HTMLImageElement;
      ready: Promise<void>;
      cancelLoad: () => void;
      pending: Set<() => void>;
    }
  >();
  private disposed = false;
  private generation = 0;
  async sync(entries: SceneEntry[], assets: Asset[], playing: boolean) {
    const generation = ++this.generation;
    const active = new Set(entries.map((e) => e.id));
    for (const [id, slot] of this.slots)
      if (!active.has(id)) {
        this.release(slot);
        this.slots.delete(id);
      }
    const output = new Map<string, CanvasImageSource>();
    await Promise.all(
      entries.map(async (entry) => {
        const asset = assets.find((a) => a.id === entry.clip.assetId);
        if (!asset) return;
        let slot = this.slots.get(entry.id);
        if (slot?.url !== asset.url) {
          if (slot) this.release(slot);
          const el =
            asset.type === "image"
              ? new Image()
              : document.createElement("video");
          if (el instanceof HTMLVideoElement) {
            el.preload = "auto";
            el.playsInline = true;
          }
          let cancelLoad = () => {};
          const ready = new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              clean();
              reject(new Error("تعذّرت قراءة وسيط المعاينة"));
            }, 15000);
            const clean = () => {
              clearTimeout(timer);
              el.onload = null;
              el.onloadeddata = null;
              el.onerror = null;
            };
            cancelLoad = () => {
              clean();
              resolve();
            };
            el.onload = el.onloadeddata = () => {
              clean();
              resolve();
            };
            el.onerror = () => {
              clean();
              reject(new Error("وسيط غير مدعوم"));
            };
            el.src = asset.url;
          });
          slot = { url: asset.url, el, ready, cancelLoad, pending: new Set() };
          this.slots.set(entry.id, slot);
        }
        if (slot.el instanceof HTMLVideoElement && (!playing || !entry.playing))
          slot.el.pause();
        await slot.ready;
        if (this.disposed || generation !== this.generation) return;
        const el = slot.el;
        if (el instanceof HTMLVideoElement) {
          if (
            Math.abs(el.currentTime - entry.local) >
            (playing && entry.playing ? 0.25 : 0.005)
          ) {
            await new Promise<void>((resolve) => {
              const done = () => {
                clearTimeout(timer);
                el.removeEventListener("seeked", done);
                slot.pending.delete(done);
                resolve();
              };
              const timer = setTimeout(done, 1000);
              slot.pending.add(done);
              el.addEventListener("seeked", done, { once: true });
              el.currentTime = entry.local;
            });
          }
          if (this.disposed || generation !== this.generation) return;
          el.playbackRate = entry.clip.speed;
          el.volume = Math.max(
            0,
            Math.min(
              1,
              entry.clip.volume *
                entry.audioAlpha *
                clipOpacity(entry.clip, entry.local),
            ),
          );
          if (playing && entry.playing) void el.play().catch(() => {});
          else el.pause();
        }
        output.set(entry.id, el);
      }),
    );
    return this.disposed || generation !== this.generation ? null : output;
  }
  private release(slot: {
    el: HTMLVideoElement | HTMLImageElement;
    cancelLoad: () => void;
    pending: Set<() => void>;
  }) {
    slot.cancelLoad();
    for (const cancel of slot.pending) cancel();
    const el = slot.el;
    if (el instanceof HTMLVideoElement) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    } else el.src = "";
  }
  dispose() {
    this.disposed = true;
    ++this.generation;
    for (const slot of this.slots.values()) this.release(slot);
    this.slots.clear();
  }
}
