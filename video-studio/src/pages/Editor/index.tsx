import { insertElement } from "../../elements/insert";
import type { LibraryElement } from "../../../../src/pages/Elements/types";
import { readAsset } from "../../lib/media";
import { synthSound } from "../../sound/synth";
import type { SoundPreset } from "../../sound/presets";
import { PanelDivider } from "./desktop/PanelDivider";
import type { TextPresetStyle } from "../../text/presets/types";
import { MobileToolPage } from "./mobile/MobileToolPage";
import { MobileProjectMenu } from "./mobile/MobileProjectMenu";
import { useMobileEditor, type MobilePanel } from "./mobile/useMobileEditor";
import { MobilePanelBar } from "./mobile/MobilePanelBar";
import { freezeClipFrame } from "./timeline/mediaFrames";
import { insertFrozen, locked } from "./timeline/editing";
import { clipStart } from "../../lib/timeline";
import { duplicateObject, type Selection } from "../../preview/model";
import { splitKeyframes } from "../../animation/evaluate";
import { PerformanceMenu } from "../../settings/PerformanceMenu";
import { useEvent } from "../../hooks/useEvent";
import { effectById } from "../../effects/registry";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Clapperboard,
  Download,
  Save,
  FolderOpen,
  Undo2,
  Redo2,
  ImageDown,
  Keyboard,
  Plus,
  Scissors,
} from "lucide-react";
import {
  Asset,
  Clip,
  Project,
  clipDuration,
  durationOf,
  uid,
  newClip,
} from "../../types";
import { download, locate } from "../../lib/media";
import { IconButton } from "../../components/IconButton";
import { Preview, type PreviewPlayback } from "./Preview";
import { Timeline } from "./Timeline";
import { Library, Tab, tabs } from "./Library";
import { Inspector } from "./Inspector";
import { ExportDialog } from "./ExportDialog";
type Props = {
  importNotice?: { revision: number; clipId?: string; layer: boolean };
  autosaveStatus: string;
  initialTab?: Tab;
  project: Project;
  update: (p: Project | ((p: Project) => Project)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  assets: Asset[];
  onHome: () => void;
  onImportLayer: (at: number) => void;
  onImport: () => void;
  onStockAsset: (asset: Asset) => string;
  onRegisterAsset: (asset: Asset) => void;
  onOpen: () => void;
  onSave: () => Promise<void>;
  notify: (s: string) => void;
};
export function Editor({
  project,
  importNotice,
  autosaveStatus,
  initialTab = "media",
  update,
  undo,
  redo,
  canUndo,
  canRedo,
  assets,
  onHome,
  onImport,
  onImportLayer,
  onStockAsset,
  onRegisterAsset,
  onOpen,
  onSave,
  notify,
}: Props) {
  const onStockAdd = useEvent((asset: Asset) => {
    playback.current?.pause();
    setPlaying(false);
    setTime(durationOf(project));
    select(onStockAsset(asset));
  });
  const [visualSelection, setVisualSelection] = useState<Selection | null>(
    null,
  );
  const [inlineRequest, setInlineRequest] = useState<{
    id: string;
    nonce: number;
  }>();
  const [tab, setTab] = useState<Tab>(initialTab);
  const isMobile = useMobileEditor();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(
    !project.clips.length || initialTab === "effects" ? "library" : "timeline",
  );
  const [previewFocused, setPreviewFocused] = useState(false);
  const openPanel = (panel: MobilePanel) => {
    setMobilePanel(panel);
    setPreviewFocused(false);
  };
  const openTool = (next: Tab) => {
    setTab(next);
    openPanel("library");
  };
  const [selected, select] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const playback = useRef<PreviewPlayback>(null);
  const clock = useRef(0);
  const freezeController = useRef<AbortController | null>(null);
  const currentProject = useRef(project);
  currentProject.current = project;
  useEffect(() => () => freezeController.current?.abort(), []);
  const freezeAtCursor = useEvent(async (id: string) => {
    const c = project.clips.find((c) => c.id === id),
      a = assets.find((a) => a.id === c?.assetId);
    if (!c || !a || locked(project, { kind: "clip", id })) return;
    playback.current?.pause();
    setPlaying(false);
    freezeController.current?.abort();
    const abort = new AbortController();
    freezeController.current = abort;
    const snapshot = project,
      at = Math.max(
        clipStart(project, id),
        Math.min(clipStart(project, id) + clipDuration(c) - 0.001, time),
      );
    try {
      const asset = await freezeClipFrame(a, project, c, at, abort.signal);
      if (currentProject.current !== snapshot || abort.signal.aborted) {
        notify("تغير المشروع؛ اختار الإطار من جديد");
        return;
      }
      onRegisterAsset(asset);
      const frozen = newClip(asset);
      update(insertFrozen(project, id, at, frozen));
      select(frozen.id);
      setVisualSelection(null);
      notify("تمت إضافة إطار ثابت لمدة ثانيتين");
    } catch {
      if (!abort.signal.aborted) notify("تعذّر التقاط إطار من هذا الملف");
    }
  });
  const clip = project.clips.find((c) => c.id === selected);
  const duration = durationOf(project);
  const getTime = useEvent(() => (playing ? clock.current : time));
  const importLayerAtCursor = useEvent(() => {
    playback.current?.pause();
    setPlaying(false);
    onImportLayer(time);
  });
  const previewCreative = useEvent((at: number) => {
    setTime(at);
    playback.current?.play();
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!importNotice?.revision) return;
    playback.current?.pause();
    setPlaying(false);
    openPanel(importNotice.layer ? "inspector" : "timeline");
    if (!importNotice.layer && importNotice.clipId) {
      select(importNotice.clipId);
      setVisualSelection(null);
      setTime(clipStart(project, importNotice.clipId));
    }
  }, [importNotice?.revision]);
  useEffect(() => {
    if (!project.clips.some((c) => c.id === selected))
      select(project.clips[0]?.id ?? null);
  }, [selected, project.clips]);
  useEffect(() => {
    setTime((t) => Math.min(t, duration));
  }, [duration]);
  const updateClip = (patch: Partial<Clip>) => {
    if (!clip) {
      notify("اختار مقطع من الخط الزمني الأول");
      return;
    }
    update((p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === selected ? { ...c, ...patch } : c)),
    }));
  };
  function addAsset(a: Asset) {
    const id = uid();
    playback.current?.pause();
    setPlaying(false);
    setTime(duration);
    select(id);
    setVisualSelection(null);
    openPanel("timeline");
    update((p) => ({
      ...p,
      clips: [
        ...p.clips,
        {
          id,
          assetId: a.id,
          start: 0,
          end: a.duration,
          filter: "original",
          brightness: 1,
          contrast: 1,
          saturation: 1,
          volume: 1,
          speed: 1,
        },
      ],
    }));
  }
  function split() {
    const under = locate(project, time);
    if (under && locked(project, { kind: "clip", id: under.clip.id })) return;
    const found = locate(project, time);
    if (
      !found ||
      found.local - found.clip.start < 0.1 ||
      found.clip.end - found.local < 0.1
    ) {
      notify("حرّك المؤشر لمنتصف المقطع لتقسيمه");
      return;
    }
    const frames = splitKeyframes(
      found.clip,
      (found.local - found.clip.start) / found.clip.speed,
    );
    update((p) => ({
      ...p,
      clips: p.clips.flatMap((c) =>
        c.id === found.clip.id
          ? [
              { ...c, end: found.local, fadeOut: 0, keyframes: frames.head },
              {
                ...c,
                id: uid(),
                start: found.local,
                fadeIn: 0,
                keyframes: frames.tail,
                transition: undefined,
              },
            ]
          : [c],
      ),
    }));
    select(found.clip.id);
  }
  function trimAtPlayhead(edge: "start" | "end") {
    const under = locate(project, time);
    if (under && locked(project, { kind: "clip", id: under.clip.id })) return;
    const found = locate(project, time);
    if (
      !found ||
      found.local - found.clip.start < 0.1 ||
      found.clip.end - found.local < 0.1
    ) {
      notify("حرّك المؤشر داخل المقطع أولًا");
      return;
    }
    playback.current?.pause();
    setPlaying(false);
    select(found.clip.id);
    update((p) => ({
      ...p,
      clips: p.clips.map((c) =>
        c.id === found.clip.id ? { ...c, [edge]: found.local } : c,
      ),
    }));
  }
  function remove() {
    if (!selected || locked(project, { kind: "clip", id: selected })) return;
    update((p) => ({ ...p, clips: p.clips.filter((c) => c.id !== selected) }));
    select(null);
  }
  function duplicate() {
    if (!clip || locked(project, { kind: "clip", id: clip.id })) return;
    update((p) => ({
      ...p,
      clips: p.clips.flatMap((c) =>
        c.id === selected ? [c, { ...c, id: uid() }] : [c],
      ),
    }));
  }
  function addText(text: string, style?: TextPresetStyle) {
    if (!duration) {
      notify("أضف مقطع فيديو أو صورة الأول");
      return;
    }
    openTool("text");
    const start = Math.min(time, Math.max(0, duration - 0.1));
    const textId = uid();
    setVisualSelection({ kind: "text", id: textId });
    playback.current?.pause();
    setPlaying(false);
    update((p) => ({
      ...p,
      texts: [
        ...p.texts,
        {
          id: textId,
          text,
          start,
          end: Math.min(duration, start + 5),
          x: 50,
          y: 75,
          size: 52,
          color: "#ffffff",
          ...style,
        },
      ],
    }));
  }
  async function save() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        exporting ||
        e.defaultPrevented ||
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable=true],[role=combobox],[data-studio-select-content],dialog[open],[role=dialog]",
        )
      )
        return;
      // Let focused buttons/links activate with Space/Enter instead of toggling playback.
      if (
        (e.code === "Space" || e.key === "Enter") &&
        (e.target as HTMLElement).closest("button,a,summary,[role=button]")
      )
        return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        playback.current?.pause();
        setPlaying(false);
        setTime((t) =>
          Math.max(
            0,
            Math.min(
              duration,
              t + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 1 : 1 / 30),
            ),
          ),
        );
        return;
      }
      if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        playback.current?.pause();
        setPlaying(false);
        setTime(e.key === "Home" ? 0 : duration);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate();
        return;
      }
      if (e.key.toLowerCase() === "m" && !e.ctrlKey && !e.metaKey && clip) {
        e.preventDefault();
        updateClip({ volume: clip.volume ? 0 : 1 });
        return;
      }
      if (e.key === "[") {
        e.preventDefault();
        trimAtPlayhead("start");
        return;
      }
      if (e.key === "]") {
        e.preventDefault();
        trimAtPlayhead("end");
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        if (duration) {
          if (time >= duration) setTime(0);
          playback.current?.toggle();
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
      if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) split();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [project, selected, time, canUndo, canRedo, exporting]);
  useEffect(() => {
    if (visualSelection?.kind === "overlay")
      document.getElementById("studio-layers")?.setAttribute("open", "");
  }, [visualSelection]);
  const onElementAdd = useEvent(
    (item: LibraryElement, color?: string, seconds = 5) => {
      try {
        const result = insertElement(project, item, getTime(), color, seconds);
        playback.current?.pause();
        setPlaying(false);
        result.assets.forEach(onRegisterAsset);
        update(result.project);
        setTime(result.at);
        if (result.selection.kind === "clip") {
          select(result.selection.id);
          setVisualSelection(null);
          openPanel("inspector");
        } else {
          setVisualSelection(result.selection);
          if (result.selection.kind === "text") {
            setTab("text");
            openPanel("library");
          } else openPanel("inspector");
        }
        notify(
          item.kind === "scene"
            ? "تمت إضافة المشهد في نهاية التايم لاين؛ عدّل المشهد واللون من الخصائص"
            : "تمت إضافة العنصر؛ عدّل النص والشكل من النصوص، والصورة من الخصائص أو مباشرة في المعاينة",
        );
      } catch (e) {
        notify((e as Error).message);
      }
    },
  );
  useEffect(() => {
    const params = new URLSearchParams(location.search),
      id = params.get("element");
    if (!id) return;
    let alive = true;
    void import("../../../../src/pages/Elements/registry")
      .then((m) => {
        if (!alive) return;
        const item = m.loadElements().find((i) => i.id === id);
        const color = params.get("color") || undefined;
        if (item)
          onElementAdd(
            item,
            color && /^#[0-9a-f]{6}$/i.test(color) ? color : undefined,
          );
        else notify("العنصر المطلوب غير موجود؛ اختاره من مكتبة العناصر");
        const url = new URL(location.href);
        url.searchParams.delete("element");
        url.searchParams.delete("color");
        history.replaceState(null, "", url);
      })
      .catch(() => {
        if (alive) notify("تعذّر تحميل العنصر؛ جرّب مكتبة العناصر من الوسائط");
      });
    return () => {
      alive = false;
    };
  }, []);
  const onLibraryAdd = useEvent(addAsset);
  const onLibraryText = useEvent(addText);
  const onLibraryFilter = useEvent((filter: string) => {
    updateClip({ filter });
    if (clip) notify(`تم تطبيق ${effectById.get(filter)?.name || "الفلتر"}`);
  });
  const onLibraryEffect = useEvent((effect: string) => {
    updateClip({ effect, effectIntensity: 1, effectSpeed: 1 });
    if (clip)
      notify(
        `تم تطبيق ${effectById.get(effect)?.name || "التأثير"} — شغّل المعاينة لرؤية الحركة`,
      );
  });
  const onLibrarySettings = useEvent(updateClip);
  const onLibraryAudio = useEvent((audioId: string) =>
    update((p) => ({
      ...p,
      audioId,
      audioEnd: undefined,
      audioSpeed: undefined,
      audioStart: 0,
      audioOffset: 0,
    })),
  );
  const onSoundProject = useEvent((patch: Partial<Project>) =>
    update((p) => ({ ...p, ...patch })),
  );
  const onSoundAdd = useEvent(async (preset: SoundPreset) => {
    if (project.tracks?.sfx?.locked)
      throw new Error("مسار المؤثرات مقفول؛ افتح القفل أولًا");
    if (!duration)
      throw new Error("أضف فيديو أو قالبًا أولًا لتحديد مكان المؤثر");
    if ((project.sounds?.length || 0) >= 32)
      throw new Error("الحد 32 مؤثرًا في المشروع؛ احذف مؤثرًا لإضافة آخر");
    const filename = `SFX-${preset.id} • ${preset.name}.wav`;
    let asset = assets.find((a) => a.name === filename && a.type === "audio");
    if (!asset) {
      asset = await readAsset(
        new File([synthSound(preset)], filename, { type: "audio/wav" }),
      );
      onRegisterAsset(asset);
    }
    const cue = {
      id: uid(),
      assetId: asset.id,
      at: Math.min(getTime(), Math.max(0, duration - 0.01)),
      start: 0,
      end: asset.duration,
      volume: 0.7,
    };
    update((p) => ({ ...p, sounds: [...(p.sounds || []), cue] }));
    notify(`تمت إضافة ${preset.name} عند المؤشر — الموسيقى لم تتغيّر`);
  });
  const onRemoveAudio = useEvent(() =>
    update((p) => ({
      ...p,
      audioId: null,
      audioEnd: undefined,
      audioSpeed: undefined,
    })),
  );
  const updateText = useEvent(
    (id: string, patch: Partial<Project["texts"][number]>) =>
      update((p) => ({
        ...p,
        texts: p.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
  );
  const removeText = useEvent((id: string) =>
    update((p) => ({ ...p, texts: p.texts.filter((t) => t.id !== id) })),
  );
  const selectText = useEvent((id: string) => {
    const t = project.texts.find((t) => t.id === id);
    if (!t) return;
    playback.current?.pause();
    setPlaying(false);
    setVisualSelection({ kind: "text", id });
    if (time < t.start || time >= t.end)
      setTime(
        Math.min(t.end - 0.01, t.start + Math.min(0.6, (t.end - t.start) / 2)),
      );
  });
  const duplicateText = useEvent((id: string) => {
    const result = duplicateObject(project, { kind: "text", id });
    if (result) {
      update(result.project);
      setVisualSelection(result.selection);
    }
  });
  const inlineText = useEvent((id: string) => {
    selectText(id);
    setInlineRequest({ id, nonce: Date.now() });
  });
  const selectVisual = useEvent((s: Selection | null) => {
    setVisualSelection(s);
    if (s?.kind === "clip") select(s.id);
  });
  return (
    <div
      className={`editor-shell ${previewFocused ? "is-preview-focused" : ""} ${isMobile && mobilePanel !== "timeline" && !previewFocused ? "is-tool-page" : ""}`}
      data-mobile-panel={mobilePanel}
    >
      <header className="editor-header">
        <div className="editor-brand">
          <IconButton
            icon={ArrowRight}
            label="العودة للاستوديو"
            onClick={() => {
              playback.current?.pause();
              setPlaying(false);
              onHome();
            }}
          />
          <div className="brand-icon">
            <Clapperboard size={21} />
          </div>
          <b>
            UniTool<span> STUDIO</span>
          </b>
          <span className="header-divider" />
          <input
            aria-label="اسم المشروع"
            value={project.name}
            onChange={(e) => update((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="editor-actions">
          {isMobile && (
            <MobileProjectMenu
              onOpen={() => {
                playback.current?.pause();
                setPlaying(false);
                onOpen();
              }}
              onImport={onImport}
              status={autosaveStatus}
            />
          )}
          {!isMobile && <PerformanceMenu />}
          <span className="local-badge">
            <i />{" "}
            <span role="status" title={autosaveStatus}>
              {autosaveStatus}
            </span>
          </span>
          <IconButton
            icon={FolderOpen}
            label="فتح مشروع"
            onClick={() => {
              playback.current?.pause();
              setPlaying(false);
              onOpen();
            }}
          />
          <button
            className="secondary save-button"
            disabled={saving}
            onClick={() => void save()}
          >
            <Save size={16} />
            {saving ? "جاري الحفظ…" : "حفظ المشروع"}
          </button>
          <button
            className="primary"
            disabled={!duration}
            onClick={() => {
              playback.current?.pause();
              setPlaying(false);
              setExporting(true);
            }}
          >
            <Download size={17} /> تصدير <span>↗</span>
          </button>
        </div>
      </header>
      <div className="editor-workspace">
        <nav className="tool-rail" aria-label="أقسام التحرير">
          <button
            className={`mobile-edit-tab ${mobilePanel === "inspector" && !previewFocused ? "active" : ""}`}
            aria-label="تعديل المقاطع"
            aria-pressed={mobilePanel === "inspector" && !previewFocused}
            onClick={() => openPanel("inspector")}
          >
            <Scissors size={20} />
            <span>تعديل</span>
          </button>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => openTool(t.id)}
              aria-pressed={
                tab === t.id &&
                (!isMobile || (mobilePanel === "library" && !previewFocused))
              }
              className={
                tab === t.id &&
                (!isMobile || (mobilePanel === "library" && !previewFocused))
                  ? "active"
                  : ""
              }
            >
              <t.icon size={22} />
              <span>{t.label}</span>
            </button>
          ))}
          <div className="rail-bottom">
            <button
              title="Space تشغيل • S تقسيم • الأسهم فريم • M كتم • Ctrl+D نسخ • [ ] قص • Ctrl+Z تراجع"
              onClick={() =>
                notify(
                  "Space: تشغيل • S: تقسيم • الأسهم: فريم • Shift+سهم: ثانية • M: كتم • Ctrl+D: نسخ • [ ]: قص • Ctrl+Z: تراجع • Ctrl+S: حفظ",
                )
              }
            >
              <Keyboard size={21} />
              <span>اختصارات</span>
            </button>
          </div>
        </nav>
        <Library
          selectedTextId={
            visualSelection?.kind === "text" ? visualSelection.id : null
          }
          onSelectText={selectText}
          onDuplicateText={duplicateText}
          onInlineText={inlineText}
          tab={tab}
          clip={clip}
          suspendPreviews={
            playing ||
            exporting ||
            (isMobile && (mobilePanel !== "library" || previewFocused))
          }
          assets={assets}
          project={project}
          onImport={onImport}
          onElementAdd={onElementAdd}
          onAdd={onLibraryAdd}
          onStockAsset={onStockAdd}
          onText={onLibraryText}
          onFilter={onLibraryFilter}
          onEffect={onLibraryEffect}
          onEffectSettings={onLibrarySettings}
          onAudio={onLibraryAudio}
          onSoundAdd={onSoundAdd}
          onSoundProject={onSoundProject}
          onRemoveAudio={onRemoveAudio}
          updateText={updateText}
          removeText={removeText}
        />
        <PanelDivider side="library" />
        <PanelDivider side="inspector" />
        <div className="center-workspace">
          <div className="workspace-tools">
            <div>
              <IconButton
                icon={Undo2}
                label="تراجع"
                disabled={!canUndo}
                onClick={undo}
              />
              <IconButton
                icon={Redo2}
                label="إعادة"
                disabled={!canRedo}
                onClick={redo}
              />
              <span className="toolbar-divider" />
              <button className="text-button" onClick={onImport}>
                <Plus size={15} />
                إضافة وسائط
              </button>
            </div>
            <IconButton
              icon={ImageDown}
              label="تنزيل الإطار الحالي PNG"
              disabled={!duration}
              onClick={() =>
                canvas.current?.toBlob(
                  (blob) => blob && download(blob, `${project.name}-frame.png`),
                )
              }
            />
          </div>
          <Preview
            playbackRef={playback}
            clockRef={clock}
            mobileHistory={
              <div className="mobile-player-history">
                <IconButton
                  icon={Undo2}
                  label="تراجع"
                  disabled={!canUndo}
                  onClick={undo}
                />
                <IconButton
                  icon={Redo2}
                  label="إعادة"
                  disabled={!canRedo}
                  onClick={redo}
                />
              </div>
            }
            project={project}
            assets={assets}
            time={time}
            setTime={setTime}
            playing={playing}
            setPlaying={setPlaying}
            canvasRef={canvas}
            selection={visualSelection}
            onSelect={selectVisual}
            onChange={update}
            onTextPanel={() => openTool("text")}
            inlineRequest={inlineRequest}
          />
        </div>
        <Inspector
          onRegisterAsset={onRegisterAsset}
          mobileExpanded={
            isMobile && mobilePanel === "inspector" && !previewFocused
          }
          onMobileClose={() => openPanel("timeline")}
          project={project}
          clip={clip}
          assets={assets}
          getTime={getTime}
          onImportLayer={importLayerAtCursor}
          onPreview={previewCreative}
          onClip={updateClip}
          onProject={(patch) => update((p) => ({ ...p, ...patch }))}
          onMove={(d) => {
            if (!clip) return;
            update((p) => {
              const cs = [...p.clips];
              const i = cs.findIndex((c) => c.id === selected);
              const j = i + d;
              if (j < 0 || j >= cs.length) return p;
              [cs[i], cs[j]] = [cs[j], cs[i]];
              return { ...p, clips: cs };
            });
          }}
        />
      </div>
      <MobilePanelBar
        panel={mobilePanel}
        onPanel={openPanel}
        toolName={tabs.find((t) => t.id === tab)?.label || "الأدوات"}
        focused={previewFocused}
        onFocus={() => setPreviewFocused((v) => !v)}
      />
      {isMobile && mobilePanel !== "timeline" && !previewFocused && (
        <MobileToolPage
          panel={mobilePanel}
          tab={tab}
          onTool={(value) =>
            value === "adjust" ? openPanel("inspector") : openTool(value)
          }
          onBack={() => openPanel("timeline")}
          onFocus={() => setPreviewFocused(true)}
        />
      )}
      <Timeline
        playing={playing}
        clockRef={clock}
        compact={isMobile}
        onInspectOverlay={() => openPanel("inspector")}
        onFreeze={freezeAtCursor}
        onSelectItem={(s) => {
          playback.current?.pause();
          setPlaying(false);
          setVisualSelection(null);
        }}
        project={project}
        assets={assets}
        time={time}
        setTime={(t) => {
          setVisualSelection(null);
          playback.current?.pause();
          setPlaying(false);
          setTime(t);
        }}
        selected={selected}
        select={(id) => {
          select(id);
          setVisualSelection(null);
          let t = 0;
          for (const c of project.clips) {
            if (c.id === id) break;
            t += clipDuration(c);
          }
          playback.current?.pause();
          setPlaying(false);
          setTime(t);
        }}
        onImport={onImport}
        onSplit={split}
        onDelete={remove}
        onDuplicate={duplicate}
        onText={() => openTool("text")}
        onAudio={() => openTool("audio")}
        onChange={(p) => {
          playback.current?.pause();
          setPlaying(false);
          update(p);
        }}
        onTrimStart={() => trimAtPlayhead("start")}
        onTrimEnd={() => trimAtPlayhead("end")}
      />
      <footer className="editor-footer">
        <span>
          <i /> <span role="status">{autosaveStatus}</span>
        </span>
        <span>
          Space تشغيل / إيقاف <span>•</span> S تقسيم <span>•</span> Ctrl + Z
          تراجع
        </span>
        <span>{project.ratio} · 30 FPS</span>
      </footer>
      {exporting && (
        <ExportDialog
          project={project}
          assets={assets}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  );
}
