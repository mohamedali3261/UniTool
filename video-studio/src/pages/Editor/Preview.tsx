import { Interaction } from "../../preview/Interaction";
import type { Dimensions, Selection } from "../../preview/model";
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
  mobileHistory,
  project,
  assets,
  time,
  setTime,
  playing,
  setPlaying,
  canvasRef,
  selection,
  onSelect,
  onChange,
  onTextPanel,
  inlineRequest,
}: {
  mobileHistory?: React.ReactNode;
  project: Project;
  assets: Asset[];
  time: number;
  setTime: (t: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  selection: Selection | null;
  onSelect: (s: Selection | null) => void;
  onChange: (p: Project) => void;
  onTextPanel: () => void;
  inlineRequest?: { id: string; nonce: number };
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [draft, setDraft] = useState<Project | null>(null);
  const displayProject = draft || project;
  const [dimensions, setDimensions] = useState<Dimensions>(new Map());
  const [toolbarHost, setToolbarHost] = useState<HTMLDivElement | null>(null);
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
      ?.sync(sceneAt(displayProject, time).entries, assets, playing)
      .then((sources) => {
        if (cancelled || !sources) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          drawFrame(ctx, null, displayProject, time, undefined, sources);
          const next: Dimensions = new Map();
          sources.forEach((source, id) => {
            const s = source as HTMLImageElement & HTMLVideoElement;
            next.set(id, {
              width: s.naturalWidth || s.videoWidth,
              height: s.naturalHeight || s.videoHeight,
            });
          });
          setDimensions((previous) =>
            JSON.stringify([...previous]) === JSON.stringify([...next])
              ? previous
              : next,
          );
          setMediaError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setMediaError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [displayProject, assets, time, playing, previewWidth, canvasRef]);
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
    a.playbackRate = project.audioSpeed || 1;
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
    project.audioEnd,
    project.audioSpeed,
    project.tracks,
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
      <div ref={setToolbarHost} className="preview-toolbar-host" />
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
        {!!project.clips.length && (
          <Interaction
            project={project}
            displayProject={displayProject}
            time={time}
            playing={playing}
            canvas={canvasRef.current}
            dimensions={dimensions}
            selection={selection}
            onSelect={onSelect}
            onChange={onChange}
            onDraft={setDraft}
            onPause={() => setPlaying(false)}
            onTextPanel={onTextPanel}
            inlineRequest={inlineRequest}
            toolbarHost={toolbarHost}
          />
        )}
        <audio ref={audio} src={music?.url} hidden />
      </div>
      {mediaError && (
        <p role="status" className="composition-error">
          {mediaError}
        </p>
      )}
      <div className="player-controls">
        {mobileHistory}
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
            void canvasRef.current?.parentElement
              ?.requestFullscreen()
              .catch(() => {})
          }
        />
      </div>
    </section>
  );
}
