import type { InterfaceScene } from "./templates/interface-flow/scenes";
import { filterPresets } from "./effects/registry";
export type Asset = {
  size?: number;
  width?: number;
  height?: number;
  id: string;
  name: string;
  type: "video" | "image" | "audio";
  url: string;
  duration: number;
  source?: {
    provider: "pexels";
    id: number;
    pageUrl: string;
    author: string;
    authorUrl: string;
    quality: "hd" | "fullhd";
  };
};
export type TransitionKind = "none" | "crossfade" | "slide" | "zoom" | "light";
export type MotionPreset = string;
export type TextAnimation = "none" | "fade" | "slide" | "pop" | "typewriter";
export type MotionKeyframe = {
  easeFrom?: number;
  easeTo?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  id: string;
  t: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
};
export type Clip = {
  designScene?: InterfaceScene;
  designAccent?: string;
  gap?: boolean;
  hidden?: boolean;
  groupId?: string;
  id: string;
  assetId: string;
  start: number;
  end: number;
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  volume: number;
  speed: number;
  rotation?: number;
  x?: number;
  y?: number;
  locked?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  zoom?: number;
  fit?: "contain" | "cover";
  fadeIn?: number;
  fadeOut?: number;
  effect?: string;
  effectIntensity?: number;
  effectSpeed?: number;
  transition?: { kind: TransitionKind; duration: number };
  motion?: MotionPreset;
  keyframes?: MotionKeyframe[];
};
export type OverlayLayer = {
  groupId?: string;
  locked?: boolean;
  hidden?: boolean;
  id: string;
  assetId: string;
  at: number;
  start: number;
  end: number;
  x: number;
  y: number;
  width: number;
  opacity: number;
  rotation: number;
  volume: number;
};
export type TextLayer = {
  groupId?: string;
  rotation?: number;
  opacity?: number;
  font?: "sans" | "serif" | "mono";
  bold?: boolean;
  background?: string;
  outline?: boolean;
  locked?: boolean;
  hidden?: boolean;
  id: string;
  text: string;
  start: number;
  end: number;
  x: number;
  y: number;
  size: number;
  color: string;
  animationIn?: TextAnimation;
  animationOut?: Exclude<TextAnimation, "typewriter">;
  animationDuration?: number;
};
export type TrackSettings = {
  name?: string;
  locked?: boolean;
  hidden?: boolean;
  muted?: boolean;
  collapsed?: boolean;
  height?: number;
};
export type TimelineMarker = {
  id: string;
  time: number;
  label: string;
  color: string;
};
export type SoundCue = {
  id: string;
  assetId: string;
  at: number;
  start: number;
  end: number;
  volume: number;
};
export type Project = {
  sounds?: SoundCue[];
  markers?: TimelineMarker[];
  tracks?: Record<string, TrackSettings>;
  audioEnd?: number;
  audioSpeed?: number;
  name: string;
  ratio: string;
  clips: Clip[];
  texts: TextLayer[];
  overlays?: OverlayLayer[];
  audioId: string | null;
  audioVolume: number;
  audioStart?: number;
  audioOffset?: number;
  audioLoop?: boolean;
};
export const uid = () => crypto.randomUUID();
export const clipDuration = (c: Clip) => (c.end - c.start) / c.speed;
export const durationOf = (p: Project) =>
  p.clips.reduce((s, c) => s + clipDuration(c), 0);
export const timeLabel = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
export const blankProject = (): Project => ({
  name: "مشروعي الجديد",
  ratio: "16:9",
  clips: [],
  texts: [],
  audioId: null,
  audioVolume: 0.7,
});
export const filters = filterPresets;
const filterCssById = new Map(filters.map((f) => [f.id, f.css]));
export function filterCss(c: Clip) {
  const preset = filterCssById.get(c.filter) || "";
  if (!preset && c.brightness === 1 && c.contrast === 1 && c.saturation === 1)
    return "none";
  return `${preset} brightness(${c.brightness}) contrast(${c.contrast}) saturate(${c.saturation})`;
}

export function assetIsUsed(p: Project, id: string) {
  return (
    p.clips.some((c) => c.assetId === id) ||
    p.overlays?.some((l) => l.assetId === id) ||
    p.sounds?.some((c) => c.assetId === id) ||
    p.audioId === id
  );
}
export function newClip(asset: Asset): Clip {
  return {
    id: uid(),
    assetId: asset.id,
    start: 0,
    end: asset.duration,
    filter: "original",
    brightness: 1,
    contrast: 1,
    saturation: 1,
    volume: 1,
    speed: 1,
  };
}
