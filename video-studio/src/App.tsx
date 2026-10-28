import type { Tab } from "./pages/Editor/Library";
import { useRef, useState, useEffect } from "react";
import { Home } from "./pages/Home";
import { Editor } from "./pages/Editor";
import { useProject } from "./hooks/useProject";
import { Asset, blankProject, uid } from "./types";
import { readAsset } from "./lib/media";
import { loadProject, saveProject } from "./lib/projectIO";
export default function App() {
  const state = useProject();
  const [page, setPage] = useState<"home" | "editor">("home");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  const [startTab, setStartTab] = useState<Tab>("media");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const open = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    if (state.project.clips.length)
      window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.project.clips.length]);
  const notify = (s: string) => {
    setToast(s);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 5000);
  };
  async function importFiles(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const added: Asset[] = [];
      for (const file of Array.from(files)) {
        try {
          added.push(await readAsset(file));
        } catch (e) {
          notify((e as Error).message);
        }
      }
      setAssets((a) => [...a, ...added]);
      state.update((p) => ({
        ...p,
        clips: [
          ...p.clips,
          ...added
            .filter((a) => a.type !== "audio")
            .map((a) => ({
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
            })),
        ],
        audioId: added.find((a) => a.type === "audio")?.id || p.audioId,
      }));
      if (added.length) setPage("editor");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <>
      <input
        hidden
        ref={input}
        type="file"
        accept="video/*,image/*,audio/*"
        multiple
        onChange={(e) => void importFiles(e.target.files)}
      />
      <input
        hidden
        ref={open}
        type="file"
        accept=".json"
        onChange={async (e) => {
          try {
            const f = e.target.files?.[0];
            if (!f) return;
            const d = await loadProject(f);
            state.update(d.project);
            setAssets((a) =>
              Array.from(
                new Map(
                  [...a, ...d.assets].map((asset) => [asset.id, asset]),
                ).values(),
              ),
            );
            setPage("editor");
            notify("تم فتح المشروع بكل ملفاته");
          } catch (err) {
            notify((err as Error).message);
          }
          e.target.value = "";
        }}
      />
      {page === "home" ? (
        <Home
          hasProject={!!state.project.clips.length}
          project={state.project}
          onResume={() => setPage("editor")}
          onEffects={() => {
            setStartTab("effects");
            setPage("editor");
          }}
          onNew={(ratio) => {
            setStartTab("media");
            state.update({ ...blankProject(), ratio: ratio || "16:9" });
            setPage("editor");
          }}
          onImport={() => input.current?.click()}
          onOpen={() => open.current?.click()}
        />
      ) : (
        <Editor
          {...state}
          initialTab={startTab}
          assets={assets}
          onHome={() => setPage("home")}
          onImport={() => input.current?.click()}
          onOpen={() => open.current?.click()}
          onStockAsset={(asset) => {
            setAssets((previous) =>
              previous.some((a) => a.id === asset.id)
                ? previous
                : [...previous, asset],
            );
            const id = uid();
            state.update((p) => ({
              ...p,
              clips: [
                ...p.clips,
                {
                  id,
                  assetId: asset.id,
                  start: 0,
                  end: asset.duration,
                  filter: "original",
                  brightness: 1,
                  contrast: 1,
                  saturation: 1,
                  volume: 1,
                  speed: 1,
                },
              ],
            }));
            notify("تمت إضافة لقطة Pexels للخط الزمني");
            return id;
          }}
          onSave={async () => {
            try {
              await saveProject(
                state.project,
                assets.filter(
                  (a) =>
                    state.project.clips.some((c) => c.assetId === a.id) ||
                    a.id === state.project.audioId,
                ),
              );
              notify("تم تنزيل المشروع بملفاته — افتحه لاحقًا للمتابعة");
            } catch {
              notify("تعذّر حفظ المشروع، قد تكون الملفات كبيرة جدًا");
            }
          }}
          notify={notify}
        />
      )}
      {busy && (
        <div className="busy-overlay">
          <div className="spinner" />
          جاري قراءة الوسائط…
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button onClick={() => setToast("")} aria-label="إغلاق">
            ×
          </button>
        </div>
      )}
    </>
  );
}
