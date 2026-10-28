import { PreviewMedia } from "../../composition/PreviewMedia";
import { sceneAt } from "../../composition/scene";

import { useStudioSettings } from "../../settings/StudioSettings";
import { musicTime } from "../../lib/timeline";
import { useEffect, useRef, useState } from "react";
import {
  Maximize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Clapperboard,
} from "lucide-react";
import { Asset, Project, durationOf, timeLabel } from "../../types";
import { drawFrame } from "../../lib/media";
import { IconButton } from "../../components/IconButton";
export function Preview({
  project,
  assets,
  time,
  setTime,
  playing,
  setPlaying,
  canvasRef,
}: {
  project: Project;
  assets: Asset[];
  time: number;
  setTime: (t: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const { previewWidth } = useStudioSettings();
  const music = assets.find((a) => a.id === project.audioId);
  const latest = useRef({ project, time });
  latest.current = { project, time };
  const runtime = useRef<PreviewMedia>(null);
  const [mediaError, setMediaError] = useState("");
  useEffect(() => {
    runtime.current = new PreviewMedia();
    return () => runtime.current?.dispose();
  }, []);
  useEffect(() => {
    let cancelled = false;
    const engine = runtime.current;
    void engine
      ?.sync(sceneAt(project, time).entries, assets, playing)
      .then((sources) => {
        if (cancelled || !sources) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          drawFrame(ctx, null, project, time, undefined, sources);
          setMediaError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setMediaError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [project, assets, time, playing, previewWidth, canvasRef]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, [setPlaying]);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.volume = project.audioVolume;
    const local = musicTime(project, music?.duration || 0, time);
    if (local === null) {
      a.pause();
      return;
    }
    if (Math.abs(a.currentTime - local) > 0.15) a.currentTime = local;
    if (playing) void a.play().catch(() => {});
    else a.pause();
  }, [
    time,
    playing,
    music?.id,
    project.audioVolume,
    project.audioStart,
    project.audioOffset,
    project.audioLoop,
  ]);
  useEffect(() => {
    if (!playing) return;
    let raf: number;
    let last = performance.now();
    const began = last,
      initial = latest.current.time;
    const tick = (now: number) => {
      if (now - last >= 1000 / 30) {
        last = now;
        const next = initial + (now - began) / 1000;
        if (next >= durationOf(latest.current.project)) {
          setTime(durationOf(latest.current.project));
          setPlaying(false);
          return;
        }
        setTime(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const [rw, rh] = project.ratio.split(":").map(Number);
  return (
    <section className="preview-area">
      <div className="preview-title">
        <span>المعاينة</span>
        <span>
          {project.ratio} <i /> جودة المعاينة
        </span>
      </div>
      <div className="canvas-stage">
        {!project.clips.length && (
          <div className="empty-preview">
            <Clapperboard size={42} />
            <h3>المشهد الأول يبدأ من هنا</h3>
            <p>ارفع ملفاتك أو أضف مقطعًا من مكتبة الوسائط</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={previewWidth}
          height={Math.round((previewWidth * rh) / rw)}
          style={{
            aspectRatio: `${rw}/${rh}`,
            display: project.clips.length ? "block" : "none",
          }}
        />
        <audio ref={audio} src={music?.url} hidden />
      </div>
      {mediaError && (
        <p role="status" className="composition-error">
          {mediaError}
        </p>
      )}
      <div className="player-controls">
        <span className="timecode" dir="ltr">
          {timeLabel(time)} <em>/ {timeLabel(durationOf(project))}</em>
        </span>
        <div>
          <IconButton
            icon={SkipForward}
            label="البداية"
            onClick={() => setTime(0)}
          />
          <button
            className="play-button"
            aria-label={playing ? "إيقاف" : "تشغيل"}
            disabled={!project.clips.length}
            onClick={() => {
              if (time >= durationOf(project)) setTime(0);
              setPlaying(!playing);
            }}
          >
            {playing ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <IconButton
            icon={SkipBack}
            label="النهاية"
            onClick={() => {
              setPlaying(false);
              setTime(durationOf(project));
            }}
          />
        </div>
        <IconButton
          icon={Maximize}
          label="ملء الشاشة"
          onClick={() =>
            void canvasRef.current?.requestFullscreen().catch(() => {})
          }
        />
      </div>
    </section>
  );
}
