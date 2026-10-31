import { clamp } from "../../../lib/timeline";

export const TIMELINE_VIEW_KEY = "unitool.timeline.view.v1";
export type TimelineView = {
  snap: boolean;
  ripple: boolean;
  follow: boolean;
  roomy: boolean;
  height: number;
};
export const defaultTimelineView: TimelineView = {
  snap: true,
  ripple: true,
  follow: true,
  roomy: false,
  height: 248,
};
/** View preferences are device-local, never part of the portable project. */
export function normalizeTimelineView(value: unknown): TimelineView {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    snap: typeof v.snap === "boolean" ? v.snap : true,
    ripple: typeof v.ripple === "boolean" ? v.ripple : true,
    follow: typeof v.follow === "boolean" ? v.follow : true,
    roomy: typeof v.roomy === "boolean" ? v.roomy : false,
    height:
      typeof v.height === "number" && Number.isFinite(v.height)
        ? clamp(Math.round(v.height), 180, 540)
        : defaultTimelineView.height,
  };
}
export function readTimelineView(): TimelineView {
  try {
    return normalizeTimelineView(JSON.parse(localStorage.getItem(TIMELINE_VIEW_KEY) || "null"));
  } catch {
    return { ...defaultTimelineView };
  }
}
export function writeTimelineView(view: TimelineView) {
  try {
    localStorage.setItem(TIMELINE_VIEW_KEY, JSON.stringify(view));
  } catch {
    /* Private browsing and full storage must not interrupt editing. */
  }
}
