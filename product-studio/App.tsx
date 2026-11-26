import { ProductionPanel } from "./sections/ProductionPanel";
import { MeasurementPanel } from "./sections/MeasurementPanel";
import { HistoryPanel } from "./sections/HistoryPanel";
import { FontPanel } from "./sections/FontPanel";
import { PrintPanel } from "./sections/PrintPanel";
import { LibraryPanel } from "./sections/LibraryPanel";
import { SceneExtras } from "./sections/SceneExtras";
import { loadStudioFonts } from "./core/advanced";
import { ToolSidebar } from "./sections/ToolSidebar";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { X } from "lucide-react";
import { useDocumentAppearance } from "../src/hooks/useSiteAppearance";
import { SiteNavbar } from "../src/components/SiteNavbar";
import { downloadBlob } from "../src/utils/download";
import {
  initialProject,
  layer,
  parseProject,
  reorder,
  updateLayer,
  type Layer,
  type Project,
  type Side,
} from "./core/model";
import { historyReducer } from "./core/history";
import { renderTryOn } from "./core/tryOn";
import {
  drawArtwork,
  rasterFile,
  invalidateArtworkCache,
} from "./core/artwork";
import { TopBar } from "./sections/TopBar";
import { ProductPanel } from "./sections/ProductPanel";
import { DesignPanel } from "./sections/DesignPanel";
import { FabricPanel } from "./sections/FabricPanel";
import { Inspector } from "./sections/Inspector";
import { StageDesk } from "./sections/StageDesk";
import { PresetsPanel } from "./sections/PresetsPanel";
import { StatusBar } from "./sections/StatusBar";
import { type PreviewHandle } from "./sections/Preview3D";
import { ExportPanel } from "./sections/ExportPanel";
const STORAGE = "unitool.product-studio.v1";
function loadInitial() {
  try {
    const s = localStorage.getItem(STORAGE);
    if (s) return parseProject(s);
  } catch {}
  return initialProject();
}
const startup = loadInitial();
export function App() {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    present: startup,
    past: [],
    future: [],
    origin: null,
  }));
  const project = history.present;
  const [side, setSide] = useState<Side>("front"),
    [mode, setMode] = useState<"3d" | "2d" | "person" | "split">("split"),
    [spin, setSpin] = useState(false),
    [selected, select] = useState<string | null>(
      () => history.present.sides.front[0]?.id ?? null,
    ),
    [lang, setLang] = useState<"ar" | "en">("ar"),
    [dark, setDark] = useState(true),
    [focus, setFocus] = useState(false),
    [exporting, setExporting] = useState(false),
    [notice, setNotice] = useState(""),
    [saved, setSaved] = useState(""),
    [help, setHelp] = useState(false);
  useDocumentAppearance(dark ? "dark" : "light", "product-studio");
  const ar = lang === "ar",
    preview = useRef<PreviewHandle>(null),
    projectInput = useRef<HTMLInputElement>(null),
    current = useRef(project);
  const lastRendered = useRef(project);
  if (lastRendered.current !== project) {
    lastRendered.current = project;
    current.current = project;
  }
  useEffect(() => {
    let active = true;
    loadStudioFonts(project.fonts)
      .then(() => {
        if (active && project.fonts?.length) {
          invalidateArtworkCache();
          dispatch({
            type: "set",
            project: {
              ...current.current,
              sides: { ...current.current.sides },
            },
          });
        }
      })
      .catch((e) => setNotice(String(e)));
    return () => {
      active = false;
    };
  }, [project.fonts]);
  const notify = useCallback((s: string) => setNotice(s), []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE, JSON.stringify(project));
        setSaved(ar ? "محفوظ على هذا الجهاز" : "Saved on this device");
      } catch {
        setSaved(
          ar
            ? "تعذر الحفظ المحلي — احفظ ملف المشروع"
            : "Local storage full — save a project file",
        );
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [project, ar]);
  const frame = useRef<number | null>(null),
    pendingProject = useRef<Project | null>(null);
  const flushChanges = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    const next = pendingProject.current;
    pendingProject.current = null;
    if (next) dispatch({ type: "set", project: next });
  }, []);
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );
  const setProject = useCallback((p: Project) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    pendingProject.current = null;
    current.current = p;
    dispatch({ type: "set", project: p });
  }, []);
  const patch = (p: Partial<Project>) =>
    setProject({ ...current.current, ...p });
  const changePart = useCallback(
    (part: Side, id: string, patch: Partial<Layer>) => {
      const next = updateLayer(current.current, part, id, patch);
      if (next === current.current) return;
      current.current = next;
      pendingProject.current = next;
      if (frame.current === null)
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          const p = pendingProject.current;
          pendingProject.current = null;
          if (p) dispatch({ type: "set", project: p });
        });
    },
    [],
  );
  const change = useCallback(
    (id: string, p: Partial<Layer>) => changePart(side, id, p),
    [side, changePart],
  );
  const add = (kind: Layer["kind"], p: Partial<Layer> = {}) => {
    if (current.current.sides[side].length >= 100) {
      notify(
        ar ? "الحد الأقصى 100 طبقة لكل وجه" : "Maximum 100 layers per side",
      );
      return;
    }
    const l = layer(kind, p);
    setProject({
      ...current.current,
      sides: {
        ...current.current.sides,
        [side]: [...current.current.sides[side], l],
      },
    });
    select(l.id);
    setMode("2d");
  };
  const remove = useCallback(() => {
    const p = current.current,
      l = p.sides[side].find((l) => l.id === selected);
    if (!l || l.locked) return;
    setProject({
      ...p,
      sides: {
        ...p.sides,
        [side]: p.sides[side].filter((l) => l.id !== selected),
      },
    });
    select(null);
  }, [selected, side, setProject]);
  const save = useCallback(() => {
    downloadBlob(
      new Blob([JSON.stringify(current.current, null, 2)], {
        type: "application/json",
      }),
      "product-studio.json",
    );
    notify(ar ? "تم تنزيل ملف المشروع" : "Project file downloaded");
  }, [ar, notify]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.target as Element)?.closest?.('[role="dialog"]')) return;
      if (
        (e.target as HTMLElement).matches(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [remove, save]);
  const item = project.sides[side].find((l) => l.id === selected);
  async function exportImage(
    kind: "artwork" | "mockup" | "person",
    size: number,
    transparent: boolean,
  ) {
    await loadStudioFonts(current.current.fonts);
    await document.fonts.ready;
    let blob: Blob;
    if (kind === "artwork") {
      const c = await drawArtwork(current.current.sides[side], size);
      blob = await new Promise<Blob>((resolve, reject) =>
        c.toBlob((b) =>
          b ? resolve(b) : reject(new Error("PNG export failed")),
        ),
      );
    } else if (kind === "person") {
      if (
        current.current.tryOn.source !== "custom" &&
        current.current.product !== "tee"
      )
        throw new Error(
          ar
            ? "اختر تيشيرت أو صورة ملابس مطابقة قبل التصدير."
            : "Choose a T-shirt or upload a matching garment photo.",
        );
      const c = await renderTryOn(current.current, size);
      blob = await new Promise<Blob>((resolve, reject) =>
        c.toBlob((b) =>
          b ? resolve(b) : reject(new Error("PNG export failed")),
        ),
      );
    } else {
      if ((mode !== "3d" && mode !== "split") || !preview.current)
        throw new Error(
          ar
            ? "افتح معاينة 3D قبل تصدير المجسم"
            : "Open 3D preview before exporting a mockup",
        );
      blob = await preview.current.exportImage(size, transparent);
    }
    downloadBlob(blob, `${project.name}-${side}-${kind}-${size}.png`, {
      silent: true,
    });
    notify(
      ar ? "صورتك جاهزة — تم التنزيل" : "Your image is ready — downloaded",
    );
  }
  return (
    <div
      className={`ps-app ${dark ? "ps-dark" : ""} ${focus ? "ps-focused" : ""}`}
      dir={ar ? "rtl" : "ltr"}
      onPointerDownCapture={() => {
        flushChanges();
        dispatch({ type: "begin" });
      }}
      onPointerUpCapture={() => {
        flushChanges();
        dispatch({ type: "end" });
      }}
      onPointerCancelCapture={() => {
        flushChanges();
        dispatch({ type: "end" });
      }}
    >
      <SiteNavbar lang={lang} onToggleLang={() => setLang(ar ? "en" : "ar")} />
      <TopBar
        name={project.name}
        rename={(name) => patch({ name })}
        undo={() => dispatch({ type: "undo" })}
        redo={() => dispatch({ type: "redo" })}
        canUndo={!!history.past.length}
        canRedo={!!history.future.length}
        save={save}
        load={() => projectInput.current?.click()}
        exportOpen={() => setExporting(true)}
        ar={ar}
        dark={dark}
        toggleDark={() => setDark(!dark)}
        focus={focus}
        toggleFocus={() => setFocus(!focus)}
      />
      <input
        ref={projectInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            if (f.size > 80 * 1024 * 1024)
              throw new Error(ar ? "الملف أكبر من 80MB" : "File exceeds 80MB");
            setProject(parseProject(await f.text()));
            select(null);
            notify(ar ? "تم فتح المشروع" : "Project opened");
          } catch (err) {
            notify(
              ar ? `تعذر فتح المشروع: ${String(err)}` : "Invalid project file",
            );
          }
        }}
      />
      <div className="ps-workspace">
        <StageDesk
          mode={mode}
          setMode={setMode}
          project={project}
          side={side}
          setSide={setSide}
          spin={spin}
          setSpin={setSpin}
          help={help}
          setHelp={setHelp}
          selected={selected}
          select={select}
          change={change}
          changePart={changePart}
          patch={patch}
          preview={preview}
          notify={notify}
          ar={ar}
        />
        <ToolSidebar
          selectionKey={`${side}-${selected}`}
          ar={ar}
          design={
            <>
              <Inspector
                item={item}
                fonts={project.fonts?.map((f) => f.name)}
                onChange={(p) => item && change(item.id, p)}
                ar={ar}
              />

              <MeasurementPanel
                project={project}
                side={side}
                item={item}
                patch={patch}
                change={(p) => item && change(item.id, p)}
                ar={ar}
              />
              <DesignPanel
                layers={project.sides[side]}
                selected={item?.id ?? null}
                select={select}
                ar={ar}
                add={add}
                upload={async (file) => {
                  try {
                    const src = await rasterFile(file);
                    add("image", {
                      src,
                      name: file.name,
                      w: 650,
                      h: 650,
                      x: 187,
                      y: 187,
                    });
                  } catch (e) {
                    notify(String(e instanceof Error ? e.message : e));
                  }
                }}
                change={change}
                move={(id, d) =>
                  setProject(reorder(current.current, side, id, d))
                }
                duplicate={() => {
                  if (item)
                    add(item.kind, {
                      ...item,
                      id: layer(item.kind).id,
                      name: `${item.name} +`,
                      x: item.x + 30,
                      y: item.y + 30,
                      locked: false,
                    });
                }}
                copyToOther={() => {
                  const opposite: Record<Side, Side> = {
                    front: "back",
                    back: "front",
                    leftSleeve: "rightSleeve",
                    rightSleeve: "leftSleeve",
                    hoodLeft: "hoodRight",
                    hoodRight: "hoodLeft",
                  };
                  const target = opposite[side],
                    p = current.current;
                  if (
                    p.sides[target].length &&
                    !confirm(
                      ar
                        ? "استبدال التصميم في الجزء المقابل؟"
                        : "Replace the design on the opposite panel?",
                    )
                  )
                    return;
                  setProject({
                    ...p,
                    sides: {
                      ...p.sides,
                      [target]: p.sides[side].map((l) =>
                        layer(l.kind, { ...l, id: layer(l.kind).id }),
                      ),
                    },
                  });
                  notify(
                    ar
                      ? "تم نسخ التصميم للجزء المقابل"
                      : "Design copied to the opposite panel",
                  );
                }}
                remove={remove}
              />
              <FontPanel project={project} patch={patch} ar={ar} />
              <PrintPanel project={project} side={side} patch={patch} ar={ar} />
              <ProductionPanel project={project} ar={ar} />
              <LibraryPanel
                project={project}
                open={(p) => {
                  setProject(p);
                  select(null);
                }}
                ar={ar}
              />
              <HistoryPanel past={history.past} restore={setProject} ar={ar} />
              <ProductPanel project={project} onChange={patch} ar={ar} />
            </>
          }
          scene={
            <>
              <SceneExtras
                project={project}
                patch={patch}
                preview={preview}
                ar={ar}
              />
              <FabricPanel
                project={project}
                onChange={(appearance) => patch({ appearance })}
                ar={ar}
              />
              <PresetsPanel add={add} ar={ar} />
            </>
          }
        />
      </div>
      <StatusBar
        saved={saved}
        ar={ar}
        onNew={() => {
          if (
            confirm(
              ar
                ? "بدء مشروع جديد؟ احفظ ملف مشروعك الحالي أولًا."
                : "Start fresh? Save your current project file first.",
            )
          ) {
            setProject(initialProject());
            select(null);
          }
        }}
      />
      {exporting && (
        <ExportPanel
          initialKind={
            mode === "person" ? "person" : mode === "2d" ? "artwork" : "mockup"
          }
          ar={ar}
          close={() => setExporting(false)}
          onExport={exportImage}
        />
      )}
      {notice && (
        <div className="ps-toast" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label={ar ? "إغلاق الرسالة" : "Dismiss"}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
