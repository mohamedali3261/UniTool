import {
  clipDuration,
  type Clip,
  type Project,
  type OverlayLayer,
} from "../types";
export type SceneEntry = {
  id: string;
  clip: Clip;
  local: number;
  elapsed: number;
  alpha: number;
  audioAlpha: number;
  shift: number;
  scale: number;
  playing: boolean;
  overlay?: OverlayLayer;
};
export function layerClip(layer: OverlayLayer): Clip {
  return {
    id: layer.id,
    assetId: layer.assetId,
    start: layer.start,
    end: layer.end,
    speed: 1,
    volume: layer.volume,
    fit: layer.fit,
    filter: "original",
    brightness: 1,
    contrast: 1,
    saturation: 1,
    rotation: layer.rotation,
  };
}
export function transitionDuration(previous: Clip, next: Clip) {
  return previous.gap ||
    next.gap ||
    !next.transition ||
    next.transition.kind === "none"
    ? 0
    : Math.min(
        next.transition.duration,
        clipDuration(previous),
        clipDuration(next),
        3,
      );
}
/** Transitions straddle an edit without changing timeline length. Source edges hold outside their own clip. */
export function sceneAt(
  project: Project,
  time: number,
): { entries: SceneEntry[]; flash: number } {
  const starts: number[] = [];
  let end = 0;
  project.clips.forEach((c) => {
    starts.push(end);
    end += clipDuration(c);
  });
  const make = (index: number): SceneEntry => {
    const original = project.clips[index];
    const clip = project.tracks?.video?.muted
      ? { ...original, volume: 0 }
      : original;
    const elapsed = Math.max(
      0,
      Math.min(clipDuration(clip) - 0.001, time - starts[index]),
    );
    return {
      id: clip.id,
      clip,
      local: Math.max(
        clip.start,
        Math.min(clip.end - 0.0001, clip.start + elapsed * clip.speed),
      ),
      elapsed,
      alpha: 1,
      audioAlpha: 1,
      shift: 0,
      scale: 1,
      playing:
        time >= starts[index] && time < starts[index] + clipDuration(clip),
    };
  };
  let entries: SceneEntry[] = [];
  let flash = 0;
  for (let i = 1; i < project.clips.length; i++) {
    const duration = transitionDuration(project.clips[i - 1], project.clips[i]);
    if (
      !duration ||
      time < starts[i] - duration / 2 ||
      time >= starts[i] + duration / 2
    )
      continue;
    const p = (time - starts[i] + duration / 2) / duration;
    const before = make(i - 1),
      after = make(i);
    const kind = project.clips[i].transition!.kind;
    before.audioAlpha = 1 - p;
    after.audioAlpha = p;
    after.alpha = p;
    if (kind === "slide") {
      before.shift = -p;
      after.shift = 1 - p;
      after.alpha = 1;
    }
    if (kind === "zoom") {
      before.scale = 1 + 0.25 * p;
      after.scale = 1.25 - 0.25 * p;
    }
    if (kind === "light") flash = Math.sin(Math.PI * p) * 0.9;
    entries = [before, after];
    break;
  }
  if (!entries.length && project.clips.length) {
    let i = starts.findIndex(
      (start, index) =>
        time >= start && time < start + clipDuration(project.clips[index]),
    );
    if (i < 0) i = time < 0 ? 0 : project.clips.length - 1;
    entries = [make(i)];
  }
  entries = entries.filter(
    (e) => !e.clip.gap && !e.clip.hidden && !project.tracks?.video?.hidden,
  );
  for (const original of project.overlays || []) {
    const flags = project.tracks?.[original.id];
    const layer = flags?.muted ? { ...original, volume: 0 } : original;
    if (
      layer.hidden ||
      flags?.hidden ||
      time < layer.at ||
      time >= layer.at + layer.end - layer.start
    )
      continue;
    const clip = layerClip(layer);
    const elapsed = time - layer.at;
    entries.push({
      id: layer.id,
      clip,
      elapsed,
      local: layer.start + elapsed,
      alpha: layer.opacity,
      audioAlpha: 1,
      shift: 0,
      scale: 1,
      playing: true,
      overlay: layer,
    });
  }
  return { entries, flash };
}
