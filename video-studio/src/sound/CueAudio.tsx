import { useEffect, useRef } from "react";
import type { Asset, Project, SoundCue } from "../types";
import { cueTime } from "./timing";
function Cue({
  cue,
  project,
  asset,
  time,
  playing,
  onError,
}: {
  cue: SoundCue;
  project: Project;
  asset: Asset;
  time: number;
  playing: boolean;
  onError?: (error: unknown) => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const a = ref.current;
    return () => {
      a?.pause();
    };
  }, []);
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const local = cueTime(project, cue, time);
    a.volume = cue.volume;
    if (local === null) {
      a.pause();
      return;
    }
    if (Math.abs(a.currentTime - local) > 0.12) a.currentTime = local;
    if (playing && a.paused) void a.play().catch((error) => onError?.(error));
    if (!playing) a.pause();
  }, [cue, project.tracks, time, playing]);
  return (
    <audio
      ref={ref}
      src={asset.url}
      preload="auto"
      onError={() => onError?.(new Error("ملف مؤثر الصوت غير قابل للتشغيل"))}
      hidden
      data-sound-cue={cue.id}
    />
  );
}
export function CueAudio({
  project,
  assets,
  time,
  playing,
  onError,
}: {
  project: Project;
  assets: Asset[];
  time: number;
  playing: boolean;
  onError?: (error: unknown) => void;
}) {
  return (
    <>
      {(project.sounds || []).map((c) => {
        const a = assets.find((a) => a.id === c.assetId);
        return a ? (
          <Cue
            key={c.id}
            cue={c}
            asset={a}
            project={project}
            time={time}
            playing={playing}
            onError={onError}
          />
        ) : null;
      })}
    </>
  );
}
