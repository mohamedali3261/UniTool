import { clipDuration, type Clip } from "../../../types";

export type TimelineViewport = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** One linear layout pass, rather than repeatedly summing all preceding clips. */
export function clipLayout(clips: Clip[]) {
  let start = 0;
  return clips.map((clip) => {
    const row = { clip, start };
    start += clipDuration(clip);
    return row;
  });
}

/** Buffered windows tolerate bucketed scroll updates without flashing empty rows. */
export function visibleInTimeline(
  start: number,
  duration: number,
  top: number,
  height: number,
  view: TimelineViewport,
  zoom: number,
  vertical = true,
) {
  const left = start * zoom,
    right = left + Math.max(8, duration * zoom);
  return (
    right >= view.left - 600 &&
    left <= view.left + view.width + 1200 &&
    (!vertical ||
      (top + height >= view.top - 100 && top <= view.top + view.height + 200))
  );
}
