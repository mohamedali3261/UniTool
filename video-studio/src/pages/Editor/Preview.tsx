import { useStudioSettings } from "../../settings/StudioSettings";
import { musicTime, clipOpacity } from "../../lib/timeline";
import { useEffect, useRef, useCallback } from "react";
import {
  Maximize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Clapperboard,
} from "lucide-react";
import { Asset, Project, durationOf, timeLabel } from "../../types";
import { drawFrame, locate } from "../../lib/media";
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
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const image = useRef<HTMLImageElement>(null);
  if (!image.current) image.current = new Image();
  const { previewWidth } = useStudioSettings();
  const current = locate(project, time);
  const asset = assets.find((a) => a.id === current?.clip.assetId);
  const music = assets.find((a) => a.id === project.audioId);
  const latest = useRef({ project, time, current });
  latest.current = { project, time, current };
  const paint = useCallback(() => {
    const { project, time, current } = latest.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx)
      drawFrame(
        ctx,
        asset?.type === "video" ? video.current : asset ? image.current : null,
        project,
        time,
        current?.clip,
      );
  }, [asset?.id, asset?.url, asset?.type, canvasRef]);
  // Paused preview is event-driven: no perpetual RAF or hidden background draw loop.
  useEffect(() => {
    const frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [paint, project, time, previewWidth]);
  useEffect(() => {
    const v = video.current;
    const img = image.current;
    v?.addEventListener("loadeddata", paint);
    v?.addEventListener("seeked", paint);
    img?.addEventListener("load", paint);
    return () => {
      v?.removeEventListener("loadeddata", paint);
      v?.removeEventListener("seeked", paint);
      img?.removeEventListener("load", paint);
    };
  }, [paint]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, [setPlaying]);
  useEffect(() => {
    if (asset?.type === "image") image.current.src = asset.url;
  }, [asset]);
  useEffect(() => {
    const v = video.current;
    if (!v || asset?.type !== "video" || !current) return;
    if (Math.abs(v.currentTime - current.local) > (playing ? 0.25 : 0.005))
      v.currentTime = current.local;
    v.playbackRate = current.clip.speed;
    v.volume = current.clip.volume * clipOpacity(current.clip, current.local);
    if (playing) void v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [time, playing, asset?.id, current?.clip.speed, current?.clip.volume]);
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
        <video
          ref={video}
          src={asset?.type === "video" ? asset.url : undefined}
          playsInline
          preload="auto"
          hidden
        />
        <audio ref={audio} src={music?.url} hidden />
      </div>
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
