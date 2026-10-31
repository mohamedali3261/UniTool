import type { Project, SoundCue } from "../types";
export function cueTime(project: Project, cue: SoundCue, time: number) {
  if (
    project.tracks?.sfx?.muted ||
    time < cue.at ||
    time >= cue.at + cue.end - cue.start
  )
    return null;
  return cue.start + time - cue.at;
}
