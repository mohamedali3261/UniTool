import { durationOf } from "./types";
import { useAutosave } from "./persistence/useAutosave";
import { RecentProjects } from "./persistence/RecentProjects";
import { restoreDraft } from "./persistence/database";
import { TemplateGallery } from "./templates/TemplateGallery";
import { buildTemplate } from "./templates";
import { assetIsUsed } from "./types";
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
  const [draftId, setDraftId] = useState<string>(uid);
  const autosave = useAutosave(draftId, state.project, assets);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const importTarget = useRef<{ layer: boolean; at: number }>({
    layer: false,
    at: 0,
  });
  const chooseMedia = (layer = false, at = 0) => {
    importTarget.current = { layer, at };
    if (input.current) {
      input.current.accept = layer
        ? "video/*,image/*"
        : "video/*,image/*,audio/*";
      input.current.click();
    }
  };
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
    const target = { ...importTarget.current };
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
      if (target.layer) {
        state.update((p) => {
          const overlays = [...(p.overlays || [])];
          const at = Math.max(0, Math.min(target.at, durationOf(p) - 0.1));
          if (!p.clips.length) return p;
          for (const a of added
            .filter((a) => a.type !== "audio")
            .slice(0, 6 - overlays.length))
            overlays.push({
              id: uid(),
              assetId: a.id,
              at,
              start: 0,
              end: Math.min(a.duration, Math.max(0.1, durationOf(p) - at)),
              x: 75,
              y: 28,
              width: 35,
              opacity: 1,
              rotation: 0,
              volume: 0,
            });
          return { ...p, overlays };
        });
        notify("تم استيراد الملف للطبقات الإضافية — عدّل مكانه من الخصائص");
      } else
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
          ...(added.some((a) => a.type === "audio")
            ? {
                audioEnd: undefined,
                audioSpeed: undefined,
                audioStart: 0,
                audioOffset: 0,
              }
            : {}),
        }));
      if (added.length) setPage("editor");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      importTarget.current = { layer: false, at: 0 };
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
            await autosave.flush();
            setDraftId(uid());
            state.replace(d.project);
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
          workspace={
            <>
              <TemplateGallery
                busy={busy}
                onUse={async (template) => {
                  if (
                    state.project.clips.length &&
                    !window.confirm(
                      "بدء القالب كمشروع جديد؟ مشروعك الحالي سيظل محفوظًا تلقائيًا إن كان التخزين متاحًا.",
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    await autosave.flush();
                    const built = await buildTemplate(template);
                    setDraftId(uid());
                    state.replace(built.project);
                    setAssets((previous) => [...previous, ...built.assets]);
                    setStartTab("text");
                    setPage("editor");
                    notify(
                      "القالب جاهز — عدّل النصوص واستبدل الخلفيات من خصائص المقطع",
                    );
                  } catch (error) {
                    notify((error as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <RecentProjects
                revision={autosave.revision}
                onRestore={async (id) => {
                  setBusy(true);
                  try {
                    await autosave.flush();
                    const restored = await restoreDraft(id);
                    setDraftId(id);
                    state.replace(restored.project);
                    setAssets((previous) =>
                      Array.from(
                        new Map(
                          [...previous, ...restored.assets].map((a) => [
                            a.id,
                            a,
                          ]),
                        ).values(),
                      ),
                    );
                    setStartTab("media");
                    setPage("editor");
                    notify("تم استرجاع المشروع من هذا الجهاز");
                  } catch (error) {
                    notify((error as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </>
          }
          hasProject={!!state.project.clips.length}
          project={state.project}
          onResume={() => setPage("editor")}
          onEffects={() => {
            setStartTab("effects");
            setPage("editor");
          }}
          onNew={async (ratio) => {
            await autosave.flush();
            setDraftId(uid());
            setStartTab("media");
            state.replace({ ...blankProject(), ratio: ratio || "16:9" });
            setPage("editor");
          }}
          onImport={() => chooseMedia()}
          onOpen={() => open.current?.click()}
        />
      ) : (
        <Editor
          {...state}
          initialTab={startTab}
          assets={assets}
          onImportLayer={(at) => chooseMedia(true, at)}
          autosaveStatus={autosave.status}
          onHome={() => {
            void autosave.flush();
            setPage("home");
          }}
          onImport={() => chooseMedia()}
          onOpen={() => open.current?.click()}
          onRegisterAsset={(asset) =>
            setAssets((previous) => [...previous, asset])
          }
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
                assets.filter((a) => assetIsUsed(state.project, a.id)),
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
          جاري تجهيز المشروع والوسائط…
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
