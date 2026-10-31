import { usePreviewViewport } from "./preview/usePreviewViewport";
import { PreviewViewControls } from "./preview/PreviewViewControls";
import { LatestFrameQueue } from "../../performance/LatestFrameQueue";
import { primeMediaPlayback, playbackMessage } from "../../sound/playback";
import { CueAudio } from "../../sound/CueAudio";
import { Interaction } from "../../preview/Interaction";
import type { Dimensions, Selection } from "../../preview/model";
import { PreviewMedia } from "../../composition/PreviewMedia";
import { sceneAt } from "../../composition/scene";

import { useStudioSettings } from "../../settings/StudioSettings";
import { musicTime } from "../../lib/timeline";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Maximize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Clapperboard,
} from "lucide-react";
import { Asset, Project, durationOf, timeLabel } from "../../types";
import { download, drawFrame } from "../../lib/media";
import { IconButton } from "../../components/IconButton";
export type PreviewPlayback = {
  play: () => void;
  toggle: () => void;
  pause: () => void;
};
export function Preview({
  playbackRef,
  clockRef,
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
  playbackRef?: React.Ref<PreviewPlayback>;
  clockRef?: React.MutableRefObject<number>;
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
  const [playTime, setPlayTime] = useState(time);
  const renderTime = playing ? playTime : time;
  const currentTime = useRef(time);
  currentTime.current = renderTime;
  if (clockRef) clockRef.current = renderTime;
  const audio = useRef<HTMLAudioElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const viewport = usePreviewViewport(stage, canvasRef);
  const [audioError, setAudioError] = useState("");
  const [preparing, setPreparing] = useState(false);
  const request = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const a = audio.current;
    return () => {
      mounted.current = false;
      request.current++;
      a?.pause();
    };
  }, []);
  function reportAudioError(error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (mounted.current) setAudioError(playbackMessage(error));
  }
  function pause() {
    runtime.current?.suspend();
    if (playing) setTime(currentTime.current);
    stage.current
      ?.querySelectorAll<HTMLAudioElement>("audio")
      .forEach((a) => a.pause());
    runtime.current?.playbackElements().forEach((a) => a.pause());
    request.current++;
    setPreparing(false);
    setPlaying(false);
  }
  function play() {
    const token = ++request.current;
    setAudioError("");
    setPreparing(true);
    // Start all play promises within this actual user gesture, not a React effect.
    const elements = [
      ...Array.from(
        stage.current?.querySelectorAll<HTMLAudioElement>("audio[src]") || [],
      ),
      ...(runtime.current?.playbackElements() || []),
    ];
    void primeMediaPlayback(elements)
      .then(() => {
        if (mounted.current && token === request.current) {
          setPreparing(false);
          setPlaying(true);
        }
      })
      .catch((error) => {
        if (mounted.current && token === request.current) {
          setPreparing(false);
          reportAudioError(error);
        }
      });
  }
  function toggle() {
    if (playing || preparing) pause();
    else play();
  }
  useImperativeHandle(playbackRef, () => ({ play, toggle, pause }));
  const [draft, setDraft] = useState<Project | null>(null);
  const displayProject = draft || project;
  const [dimensions, setDimensions] = useState<Dimensions>(new Map());
  const [toolbarHost, setToolbarHost] = useState<HTMLDivElement | null>(null);
  const { previewWidth: configuredWidth, preferences } = useStudioSettings();
  const heavy = assets.some(
    (a) =>
      (a.size || 0) > 256 * 1024 * 1024 ||
      (a.width || 0) * (a.height || 0) > 3840 * 2160,
  );
  const previewWidth =
    heavy && preferences.quality === "auto"
      ? Math.min(configuredWidth, 480)
      : configuredWidth;
  const music = assets.find((a) => a.id === project.audioId);
  const latest = useRef({ project, time });
  latest.current = { project, time };
  const runtime = useRef<PreviewMedia>(null);
  const [mediaError, setMediaError] = useState("");
  useEffect(() => {
    if (!playing) runtime.current?.suspend();
  }, [playing]);
  type FrameRequest = {
    project: Project;
    assets: Asset[];
    time: number;
    playing: boolean;
    width: number;
  };
  const frameQueue = useRef<LatestFrameQueue<FrameRequest> | null>(null);
  const latestFrame = useRef<FrameRequest>({
    project: displayProject,
    assets,
    time: renderTime,
    playing,
    width: previewWidth,
  });
  latestFrame.current = {
    project: displayProject,
    assets,
    time: renderTime,
    playing,
    width: previewWidth,
  };
  useEffect(() => {
    const engine = new PreviewMedia();
    runtime.current = engine;
    const queue = new LatestFrameQueue<FrameRequest>(
      async (frame) => {
        const sources = await engine.sync(
          sceneAt(frame.project, frame.time).entries,
          frame.assets,
          frame.playing,
          (error) => {
            if (mounted.current) reportAudioError(error);
          },
        );
        const latest = latestFrame.current;
        if (
          !mounted.current ||
          !sources ||
          latest.project !== frame.project ||
          latest.assets !== frame.assets ||
          latest.playing !== frame.playing ||
          latest.width !== frame.width
        )
          return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        drawFrame(ctx, null, frame.project, frame.time, undefined, sources);
        if (!frame.playing) {
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
        }
        setMediaError("");
      },
      (error) => {
        if (mounted.current) setMediaError((error as Error).message);
      },
    );
    frameQueue.current = queue;
    queue.request(latestFrame.current);
    return () => {
      queue.dispose();
      engine.dispose();
    };
  }, [canvasRef]);
  useEffect(() => {
    frameQueue.current?.request(latestFrame.current);
  }, [displayProject, assets, renderTime, playing, previewWidth]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        if (playing) setTime(currentTime.current);
        request.current++;
        setPreparing(false);
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, [setPlaying, playing]);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.volume = project.audioVolume;
    a.playbackRate = project.audioSpeed || 1;
    const local = musicTime(project, music?.duration || 0, renderTime);
    if (local === null) {
      a.pause();
      return;
    }
    if (Math.abs(a.currentTime - local) > 0.15) a.currentTime = local;
    if (playing) void a.play().catch(reportAudioError);
    else a.pause();
  }, [
    renderTime,
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
    let raf: number,
      last = performance.now(),
      published = last;
    const began = last,
      initial = latest.current.time;
    setPlayTime(initial);
    const tick = (now: number) => {
      if (now - last >= 1000 / 30) {
        last = now;
        const next = Math.min(
          initial + (now - began) / 1000,
          durationOf(latest.current.project),
        );
        currentTime.current = next;
        if (clockRef) clockRef.current = next;
        setPlayTime(next);
        if (next >= durationOf(latest.current.project)) {
          setTime(next);
          setPlaying(false);
          return;
        }
        // Heavy editor panels/timeline rows do not need 30 React renders/second.
        if (now - published >= 250) {
          published = now;
          setTime(next);
        }
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
      <div
        ref={stage}
        className={`canvas-stage ${viewport.panning && viewport.view.zoom > 1 ? "is-panning" : ""}`}
        tabIndex={0}
        aria-label="مساحة المعاينة"
        {...viewport.handlers}
        onKeyDown={(e) => {
          if (
            (e.target as HTMLElement).closest(
              "input,textarea,[data-preview-tools]",
            )
          )
            return;
          if (e.key === "Escape") viewport.finish(true);
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
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
            transform: `translate(${viewport.view.x}px, ${viewport.view.y}px) scale(${viewport.view.zoom})`,
            transformOrigin: "center",
            aspectRatio: `${rw}/${rh}`,
            display: project.clips.length ? "block" : "none",
          }}
        />
        {!!project.clips.length && (
          <Interaction
            viewVersion={`${viewport.view.zoom}:${viewport.view.x}:${viewport.view.y}`}
            compositionGuides={viewport.guides}
            project={project}
            displayProject={displayProject}
            time={renderTime}
            playing={playing}
            canvas={canvasRef.current}
            dimensions={dimensions}
            selection={selection}
            onSelect={onSelect}
            onChange={onChange}
            onDraft={setDraft}
            onPause={pause}
            onTextPanel={onTextPanel}
            inlineRequest={inlineRequest}
            toolbarHost={toolbarHost}
          />
        )}
        <PreviewViewControls
          viewport={viewport}
          disabled={!project.clips.length}
          onStep={(direction) => {
            pause();
            setTime(
              Math.max(
                0,
                Math.min(
                  durationOf(project),
                  currentTime.current + direction / 30,
                ),
              ),
            );
          }}
          onSnapshot={async () => {
            const canvas = canvasRef.current;
            if (!canvas || !project.clips.length) throw new Error("No frame");
            const at = currentTime.current;
            const blob = await new Promise<Blob>((resolve, reject) =>
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error("Empty frame"))),
                "image/png",
              ),
            );
            download(blob, `${project.name}-${at.toFixed(2)}s.png`);
          }}
        />
        <CueAudio
          project={project}
          assets={assets}
          time={renderTime}
          playing={playing}
          onError={reportAudioError}
        />
        <audio
          ref={audio}
          src={music?.url}
          preload="auto"
          onError={() => reportAudioError(new Error("audio"))}
          hidden
        />
      </div>
      {mediaError && (
        <p role="status" className="composition-error">
          {mediaError}
        </p>
      )}
      {audioError && (
        <div className="composition-error" role="alert">
          {audioError} <button onClick={play}>إعادة تفعيل الصوت</button>
        </div>
      )}
      <div className="player-controls">
        {mobileHistory}
        <span className="timecode" dir="ltr">
          {timeLabel(renderTime)} <em>/ {timeLabel(durationOf(project))}</em>
        </span>
        <div>
          <IconButton
            icon={SkipForward}
            label="البداية"
            onClick={() => {
              pause();
              setTime(0);
            }}
          />
          <button
            className="play-button"
            aria-label={playing || preparing ? "إيقاف" : "تشغيل"}
            aria-busy={preparing}
            disabled={!project.clips.length}
            onClick={() => {
              if (time >= durationOf(project)) setTime(0);
              toggle();
            }}
          >
            {playing ? <Pause size={19} /> : <Play size={19} />}
          </button>
          <IconButton
            icon={SkipBack}
            label="النهاية"
            onClick={() => {
              pause();
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
