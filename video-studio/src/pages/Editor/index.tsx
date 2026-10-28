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
} from "lucide-react";
import {
  Asset,
  Clip,
  Project,
  clipDuration,
  durationOf,
  uid,
} from "../../types";
import { download, locate } from "../../lib/media";
import { IconButton } from "../../components/IconButton";
import { Preview } from "./Preview";
import { Timeline } from "./Timeline";
import { Library, Tab, tabs } from "./Library";
import { Inspector } from "./Inspector";
import { ExportDialog } from "./ExportDialog";
type Props = {
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
  onOpen: () => void;
  onSave: () => Promise<void>;
  notify: (s: string) => void;
};
export function Editor({
  project,
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
  onOpen,
  onSave,
  notify,
}: Props) {
  const onStockAdd = useEvent((asset: Asset) => {
    setPlaying(false);
    setTime(durationOf(project));
    select(onStockAsset(asset));
  });
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, select] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clip = project.clips.find((c) => c.id === selected);
  const duration = durationOf(project);
  const getTime = useEvent(() => time);
  const importLayerAtCursor = useEvent(() => {
    setPlaying(false);
    onImportLayer(time);
  });
  const previewCreative = useEvent((at: number) => {
    setTime(at);
    setPlaying(true);
  });
  const [saving, setSaving] = useState(false);
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
    update((p) => ({
      ...p,
      clips: [
        ...p.clips,
        {
          id: uid(),
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
    const found = locate(project, time);
    if (
      !found ||
      found.local - found.clip.start < 0.1 ||
      found.clip.end - found.local < 0.1
    ) {
      notify("حرّك المؤشر داخل المقطع أولًا");
      return;
    }
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
    if (!selected) return;
    update((p) => ({ ...p, clips: p.clips.filter((c) => c.id !== selected) }));
    select(null);
  }
  function duplicate() {
    if (!clip) return;
    update((p) => ({
      ...p,
      clips: p.clips.flatMap((c) =>
        c.id === selected ? [c, { ...c, id: uid() }] : [c],
      ),
    }));
  }
  function addText(text: string) {
    if (!duration) {
      notify("أضف مقطع فيديو أو صورة الأول");
      return;
    }
    setTab("text");
    const start = Math.min(time, Math.max(0, duration - 0.1));
    update((p) => ({
      ...p,
      texts: [
        ...p.texts,
        {
          id: uid(),
          text,
          start,
          end: Math.min(duration, start + 5),
          x: 50,
          y: 75,
          size: 52,
          color: "#ffffff",
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
          setPlaying((p) => !p);
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
    update((p) => ({ ...p, audioId })),
  );
  const onRemoveAudio = useEvent(() =>
    update((p) => ({ ...p, audioId: null })),
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
  return (
    <div className="editor-shell">
      <header className="editor-header">
        <div className="editor-brand">
          <IconButton
            icon={ArrowRight}
            label="العودة للاستوديو"
            onClick={() => {
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
          <PerformanceMenu />
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
              setPlaying(false);
              setExporting(true);
            }}
          >
            <Download size={17} /> تصدير <span>↗</span>
          </button>
        </div>
      </header>
      <div className="editor-workspace">
        <nav className="tool-rail">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                if (
                  window.matchMedia(
                    "(max-width:650px), (max-width:900px) and (pointer:coarse), (max-height:500px) and (pointer:coarse)",
                  ).matches
                )
                  document.getElementById("studio-library")?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion:reduce)",
                    ).matches
                      ? "auto"
                      : "smooth",
                    block: "start",
                  });
              }}
              aria-pressed={tab === t.id}
              className={tab === t.id ? "active" : ""}
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
          tab={tab}
          clip={clip}
          suspendPreviews={playing || exporting}
          assets={assets}
          project={project}
          onImport={onImport}
          onAdd={onLibraryAdd}
          onStockAsset={onStockAdd}
          onText={onLibraryText}
          onFilter={onLibraryFilter}
          onEffect={onLibraryEffect}
          onEffectSettings={onLibrarySettings}
          onAudio={onLibraryAudio}
          onRemoveAudio={onRemoveAudio}
          updateText={updateText}
          removeText={removeText}
        />
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
            project={project}
            assets={assets}
            time={time}
            setTime={setTime}
            playing={playing}
            setPlaying={setPlaying}
            canvasRef={canvas}
          />
        </div>
        <Inspector
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
      <Timeline
        project={project}
        assets={assets}
        time={time}
        setTime={(t) => {
          setPlaying(false);
          setTime(t);
        }}
        selected={selected}
        select={(id) => {
          select(id);
          let t = 0;
          for (const c of project.clips) {
            if (c.id === id) break;
            t += clipDuration(c);
          }
          setPlaying(false);
          setTime(t);
        }}
        onImport={onImport}
        onSplit={split}
        onDelete={remove}
        onDuplicate={duplicate}
        onText={() => setTab("text")}
        onAudio={() => setTab("audio")}
        onChange={(p) => {
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
