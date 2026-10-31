import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  node,
  uid,
  blank,
  type Element,
  type Lang,
  type Project,
} from "./types";
import { allProjects, saveProject } from "./storage";
import { templates, templateProject } from "./templates";
type History = {
  doc: Project;
  past: Project[];
  future: Project[];
  baseline?: Project;
};
type Action =
  | { type: "commit" | "live"; fn: (p: Project) => Project }
  | { type: "begin" | "end" | "undo" | "redo" }
  | { type: "load"; doc: Project };
export function reducer(s: History, a: Action): History {
  if (a.type === "load") return { doc: a.doc, past: [], future: [] };
  if (a.type === "begin") return { ...s, baseline: s.doc };
  if (a.type === "end") {
    const changed =
      s.baseline && JSON.stringify(s.baseline) !== JSON.stringify(s.doc);
    return {
      ...s,
      baseline: undefined,
      past: changed ? [...s.past.slice(-39), s.baseline!] : s.past,
      future: changed ? [] : s.future,
    };
  }
  if (a.type === "undo")
    return s.past.length
      ? {
          doc: s.past.at(-1)!,
          past: s.past.slice(0, -1),
          future: [s.doc, ...s.future],
        }
      : s;
  if (a.type === "redo")
    return s.future.length
      ? {
          doc: s.future[0],
          past: [...s.past, s.doc],
          future: s.future.slice(1),
        }
      : s;
  if (!("fn" in a)) return s;
  const doc = a.fn(s.doc);
  if (doc === s.doc) return s;
  return a.type === "live"
    ? { ...s, doc }
    : { doc, past: [...s.past.slice(-39), s.doc], future: [] };
}
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
function useStore() {
  const [lang, setLang] = useState<Lang>(
      read("logo-designer-lang") === "en" ? "en" : "ar",
    ),
    [theme, setTheme] = useState(
      read("logo-designer-theme") === "dark" ? "dark" : "light",
    );
  const [history, dispatch] = useReducer(reducer, undefined, () => ({
    doc: templateProject(
      templates[0],
      read("logo-designer-lang") === "en" ? "en" : "ar",
    ),
    past: [],
    future: [],
  }));
  const doc = history.doc;
  const [selected, setSelected] = useState<string[]>([]),
    [tab, setTab] = useState("library"),
    [notice, setNotice] = useState(""),
    [saveStatus, setSaveStatus] = useState("loading"),
    [ready, setReady] = useState(false),
    [revision, setRevision] = useState(0);
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [grid, setGrid] = useState(false),
    [guides, setGuides] = useState(true),
    [snap, setSnap] = useState(true),
    [hand, setHand] = useState(false),
    [leftOpen, setLeftOpen] = useState(true),
    [rightOpen, setRightOpen] = useState(window.innerWidth > 850),
    [modal, setModal] = useState<string | null>(null);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  useEffect(() => {
    allProjects()
      .then((list) => {
        const id = read("logo-designer-last");
        const p = list.find((p) => p.id === id);
        if (p) dispatch({ type: "load", doc: p });
      })
      .catch(() =>
        setNotice(
          t(
            "تعذّر فتح التخزين المحلي؛ تقدر تكمّل وتصدّر ملف مشروع.",
            "Storage unavailable; you can still export a project.",
          ),
        ),
      )
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("logo-designer-lang", lang);
      localStorage.setItem("logo-designer-theme", theme);
    } catch {}
  }, [lang, theme]);
  useEffect(() => {
    if (!ready) return;
    setSaveStatus("pending");
    const timer = setTimeout(() => {
      saveProject(doc)
        .then(() => {
          setSaveStatus("saved");
          setRevision((v) => v + 1);
          try {
            localStorage.setItem("logo-designer-last", doc.id);
          } catch {}
        })
        .catch(() => setSaveStatus("error"));
    }, 900);
    return () => clearTimeout(timer);
  }, [doc, ready]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(
    () =>
      setSelected((ids) =>
        ids.filter((id) => doc.nodes.some((n) => n.id === id)),
      ),
    [doc],
  );
  const commit = (fn: (p: Project) => Project) =>
    dispatch({ type: "commit", fn });
  const patch = (patch: Partial<Element>, ids = selected) =>
    commit((p) => ({
      ...p,
      nodes: p.nodes.map((n) =>
        ids.includes(n.id) && !n.locked ? { ...n, ...patch } : n,
      ),
    }));
  const add = (items: Partial<Element>[]) => {
    if (doc.nodes.length + items.length > 500) {
      setNotice(t("الحد ٥٠٠ عنصر للمشروع.", "Limit: 500 elements."));
      return;
    }
    const nodes = items.map((n) =>
      node({ x: doc.width / 2, y: doc.height / 2, ...n, id: uid() }),
    );
    commit((p) => ({ ...p, nodes: [...p.nodes, ...nodes] }));
    setSelected(nodes.map((n) => n.id));
  };
  const choose = (id: string, multi = false) => {
    const n = doc.nodes.find((n) => n.id === id);
    if (!n || n.locked) return;
    const ids = n.group
      ? doc.nodes
          .filter((v) => v.group === n.group && !v.locked)
          .map((v) => v.id)
      : [id];
    setSelected((old) =>
      multi
        ? old.includes(id)
          ? old.filter((v) => !ids.includes(v))
          : [...new Set([...old, ...ids])]
        : ids,
    );
  };
  const remove = () => {
    const ids = selected.filter(
      (id) => !doc.nodes.find((n) => n.id === id)?.locked,
    );
    if (
      ids.length &&
      confirm(t(`حذف ${ids.length} عنصر؟`, "Delete selected elements?"))
    ) {
      commit((p) => ({
        ...p,
        nodes: p.nodes.filter((n) => !ids.includes(n.id)),
      }));
      setSelected([]);
    }
  };
  const duplicate = () => {
    const groups = new Map<string, string>();
    const nodes = doc.nodes
      .filter((n) => selected.includes(n.id))
      .map((n) => {
        if (n.group && !groups.has(n.group)) groups.set(n.group, uid());
        return {
          ...structuredClone(n),
          id: uid(),
          group: n.group ? groups.get(n.group) : undefined,
          x: n.x + 20,
          y: n.y + 20,
          locked: false,
        };
      });
    if (doc.nodes.length + nodes.length > 500) return;
    commit((p) => ({ ...p, nodes: [...p.nodes, ...nodes] }));
    setSelected(nodes.map((n) => n.id));
  };
  const save = async () => {
    try {
      await saveProject(doc);
      setSaveStatus("saved");
      setRevision((v) => v + 1);
      setNotice(
        t("تم حفظ المشروع على الجهاز.", "Project saved on this device."),
      );
    } catch {
      setSaveStatus("error");
      setNotice(
        t(
          "تعذّر الحفظ؛ صدّر ملف المشروع للاحتفاظ به.",
          "Save failed; export your project JSON.",
        ),
      );
    }
  };
  return {
    doc,
    history,
    dispatch,
    commit,
    patch,
    add,
    choose,
    remove,
    duplicate,
    save,
    lang,
    setLang,
    theme,
    setTheme,
    t,
    selected,
    setSelected,
    tab,
    setTab,
    notice,
    setNotice,
    saveStatus,
    ready,
    revision,
    setRevision,
    zoom,
    setZoom,
    pan,
    setPan,
    grid,
    setGrid,
    guides,
    setGuides,
    snap,
    setSnap,
    hand,
    setHand,
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    modal,
    setModal,
    load: (p: Project) => {
      dispatch({ type: "load", doc: p });
      setSelected([]);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    },
    newProject: () => {
      dispatch({ type: "load", doc: blank() });
      setSelected([]);
    },
  };
}
const Context = createContext<ReturnType<typeof useStore>>(null!);
export function DesignerProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export const useDesigner = () => useContext(Context);
