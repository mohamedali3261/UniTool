import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, Check, FileText } from "lucide-react";
import type { useSession } from "../../app/useSession";
import type { Translate, Annotation, PageText, Tool } from "../../core/types";
import { uid } from "../../core/types";
import { useNativeSource } from "../../app/useNativeSource";
import { saveBlob } from "../../core/pdf";
import { parseProject } from "../../core/project";
import { DocumentBar } from "./DocumentBar";
import { PageStrip } from "./PageStrip";
import { ToolRail } from "./ToolRail";
import { PropertiesPanel } from "./PropertiesPanel";
import { DocumentCanvas } from "./DocumentCanvas";
import { CanvasToolbar } from "./CanvasToolbar";
import { TextPanel } from "./TextPanel";
import { NativeTextEditor } from "./NativeTextEditor";
import { Guide } from "./Guide";
import { Modal } from "../../components/Modal";
import "./editor.css";
type State = ReturnType<typeof useSession>;
export default function EditorPage({
  state,
  t,
  notice,
}: {
  state: State;
  t: Translate;
  notice: (s: string) => void;
}) {
  const { session, edit, update, travel, history, dirty, setDirty, load } =
      state,
    [current, setCurrent] = useState(edit.pages[0].id),
    [tool, setTool] = useState<Tool>("select"),
    [selected, setSelected] = useState<string | null>(null),
    [zoom, setZoom] = useState(1),
    [text, setText] = useState(t("نص جديد", "New text")),
    [fontSize, setFontSize] = useState(22),
    [color, setColor] = useState("#b85d42"),
    [texts, setTexts] = useState<Record<number, PageText>>({}),
    [query, setQuery] = useState(""),
    [panel, setPanel] = useState(""),
    [help, setHelp] = useState(false),
    [inlineEditing, setInlineEditing] = useState(false),
    [nativeEdit, setNativeEdit] = useState<{
      bytes: Uint8Array;
      pageIndex: number;
    } | null>(null),
    [busy, setBusy] = useState(""),
    [removePage, setRemovePage] = useState<string | null>(null);
  const native = useNativeSource(session!, () => {
    setDirty(true);
    setTexts({});
  });
  const s = { ...session!, ...native.source },
    page = edit.pages.find((p) => p.id === current) || edit.pages[0],
    index = edit.pages.findIndex((p) => p.id === page.id),
    onExtract = useCallback(
      (source: number, value: PageText) =>
        setTexts((v) => ({ ...v, [source]: value })),
      [],
    );
  const select = (id: string) => {
    setCurrent(id);
    setSelected(null);
  };
  useEffect(() => {
    setSelected(null);
  }, [page.id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        busy ||
        document.querySelector("dialog[open]") ||
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        travel(e.shiftKey);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [travel, busy]);
  const patch = (id: string, patch: Partial<Annotation>) =>
    update((e) => ({
      ...e,
      pages: e.pages.map((p) =>
        p.id === page.id
          ? {
              ...p,
              annotations: p.annotations.map((a) =>
                a.id === id ? { ...a, ...patch } : a,
              ),
            }
          : p,
      ),
    }));
  const action = (
    kind: "up" | "down" | "duplicate" | "rotate" | "delete",
    id: string,
  ) => {
    if (kind === "delete") {
      setRemovePage(id);
      return;
    }
    const pages = [...edit.pages],
      i = pages.findIndex((p) => p.id === id);
    if (kind === "rotate")
      pages[i] = { ...pages[i], rotation: (pages[i].rotation + 90) % 360 };
    if (kind === "duplicate") {
      const p = structuredClone(pages[i]);
      p.id = uid();
      p.annotations = p.annotations.map((a) => ({ ...a, id: uid() }));
      pages.splice(i + 1, 0, p);
    }
    if (kind === "up" && i > 0)
      [pages[i], pages[i - 1]] = [pages[i - 1], pages[i]];
    if (kind === "down" && i < pages.length - 1)
      [pages[i], pages[i + 1]] = [pages[i + 1], pages[i]];
    update({ pages });
  };
  return (
    <main className="ps-editor">
      <DocumentBar
        name={s.name}
        dirty={dirty}
        history={history}
        travel={travel}
        load={load}
        busy={busy || (state.loading ? t("جاري الفتح…", "Opening…") : "")}
        help={() => setHelp(true)}
        t={t}
        exportFile={async () => {
          if (document.querySelector(".ps-inline-native-form")) {
            notice(
              t(
                "احفظ تعديل النص أو ألغِه قبل تصدير PDF.",
                "Save or cancel the active text edit before exporting PDF.",
              ),
            );
            return;
          }
          setBusy(t("تصدير…", "Exporting…"));
          try {
            const { exportPdf } = await import("../../core/export");
            const blob = await exportPdf(s.bytes, s.doc, edit, (p) =>
              setBusy(t("تصدير ", "Export ") + p + "%"),
            );
            saveBlob(blob, s.name.replace(/\.pdf$/i, "") + "-edited.pdf");
            setDirty(false);
            notice(
              t(
                "تم تصدير نسخة جديدة. الأصل لم يتغير.",
                "A new copy was exported. The original was not changed.",
              ),
            );
          } catch (e) {
            notice(
              t(
                "تعذر التصدير. لم يتغير الأصل. ",
                "Export failed. Original unchanged. ",
              ) + (e as Error).message,
            );
          } finally {
            setBusy("");
          }
        }}
        exportProject={() => {
          if (native.modified) {
            notice(
              t(
                "احفظ PDF المعدل وافتحه أولًا قبل حفظ مشروع الإضافات؛ المشروع لا يتضمن تعديلات النص الأصلي.",
                "Save and reopen the edited PDF before saving an annotation project; projects do not include native text edits.",
              ),
            );
            return;
          }
          saveBlob(
            new Blob(
              [
                JSON.stringify({
                  version: 1,
                  fingerprint: s.hash,
                  pages: edit.pages,
                }),
              ],
              { type: "application/json" },
            ),
            s.name + ".annotations.json",
          );
          notice(
            t(
              "تم تنزيل المشروع. احتفظ بملف PDF الأصلي لاستعادته.",
              "Project downloaded. Keep the identical original PDF to restore it.",
            ),
          );
        }}
        importProject={async (file) => {
          if (native.modified) {
            notice(
              t(
                "احفظ PDF المعدل وافتحه أولًا قبل استعادة مشروع.",
                "Save and reopen the edited PDF before restoring a project.",
              ),
            );
            return;
          }
          try {
            if (file.size > 5 * 1024 * 1024)
              throw Error("Maximum project size: 5 MB");
            const restored = parseProject(
              JSON.parse(await file.text()),
              s.hash,
              s.doc.numPages,
            );
            if (
              !window.confirm(
                t(
                  "استبدال إضافات المستند بالمشروع؟ يمكن التراجع.",
                  "Replace current annotations with this project? You can undo.",
                ),
              )
            )
              return;
            update(restored);
            select(restored.pages[0].id);
          } catch (e) {
            notice((e as Error).message);
          }
        }}
      />
      <div className="ps-editor-title">
        <span>
          <FileText size={14} />
          <b>PDF STUDIO</b>
          <i>/</i>
          {t("مساحة المستند", "Document workspace")}
        </span>
        <span>
          <ShieldCheck size={12} />
          {t("نسختك الأصلية في أمان", "Your original stays intact")}
        </span>
      </div>
      <CanvasToolbar
        index={index}
        count={edit.pages.length}
        select={(i) => select(edit.pages[i].id)}
        zoom={zoom}
        setZoom={setZoom}
        rotate={() => action("rotate", page.id)}
        editing={inlineEditing}
        toggleEditing={() => {
          setInlineEditing((v) => !v);
          setTool("select");
          setSelected(null);
        }}
        panel={panel}
        setPanel={setPanel}
        t={t}
      />
      {inlineEditing && (
        <div
          className="ps-inline-edit-toolbar"
          role="region"
          aria-label={t("وضع تعديل النص", "Text edit mode")}
        >
          <span>
            {t(
              "اضغط إطار النص لتعديله في نفس موضعه. الأزرق قابل للتعديل؛ البرتقالي غير مدعوم لتغيير الحروف.",
              "Tap a text frame to edit in place. Blue supports replacement; amber does not support character changes.",
            )}
          </span>
          <button
            disabled={!native.canUndo || native.busy}
            onClick={async () => {
              try {
                await native.undo();
              } catch (e) {
                notice((e as Error).message);
              }
            }}
          >
            {t("تراجع عن تعديل النص", "Undo text edit")}
          </button>
          <button onClick={() => setInlineEditing(false)}>
            {t("إنهاء التعديل", "Finish editing")}
          </button>
        </div>
      )}
      <div
        className={"ps-editor-layout panel-" + panel}
        inert={!!busy || state.loading || native.busy}
      >
        <aside className="ps-left-sidebar">
          <div className="ps-tool-section">
            <div className="ps-section-eyebrow">MARK IT. MAKE IT YOURS.</div>
            <ToolRail
              tool={tool}
              setTool={(value) => {
                setInlineEditing(false);
                setTool(value);
              }}
              t={t}
            />
            <button
              className="ps-button"
              onClick={async () => {
                setBusy(t("تجهيز نسخة…", "Preparing copy…"));
                try {
                  const { exportPdf } = await import("../../core/export");
                  const blob = await exportPdf(s.bytes, s.doc, edit, () => {});
                  setNativeEdit({
                    bytes: new Uint8Array(await blob.arrayBuffer()),
                    pageIndex: index,
                  });
                } catch (e) {
                  notice((e as Error).message);
                } finally {
                  setBusy("");
                }
              }}
            >
              {t("تعديل النص الأصلي (محدود)", "Edit original text (limited)")}
            </button>
            <PropertiesPanel
              tool={tool}
              items={page.annotations}
              selected={selected}
              setSelected={setSelected}
              patch={patch}
              remove={(id) => {
                update((e) => ({
                  ...e,
                  pages: e.pages.map((p) =>
                    p.id === page.id
                      ? {
                          ...p,
                          annotations: p.annotations.filter((a) => a.id !== id),
                        }
                      : p,
                  ),
                }));
                setSelected(null);
              }}
              text={text}
              setText={setText}
              fontSize={fontSize}
              setFontSize={setFontSize}
              color={color}
              setColor={setColor}
              t={t}
            />
          </div>
          <PageStrip
            doc={s.doc}
            pages={edit.pages}
            current={page.id}
            onSelect={select}
            action={action}
            t={t}
          />
        </aside>
        <DocumentCanvas
          doc={s.doc}
          inlineEdit={
            inlineEditing
              ? {
                  bytes: s.bytes,
                  commit: async (bytes) => {
                    if (
                      edit.pages.filter((p) => p.source === page.source)
                        .length > 1
                    )
                      throw Error(
                        t(
                          "هذه الصفحة مكررة من نفس المصدر. صدّر PDF وافتحه أولًا لتعديل نسخة واحدة فقط.",
                          "This source page is duplicated. Export and reopen the PDF before editing just one copy.",
                        ),
                      );
                    await native.apply(bytes);
                  },
                }
              : undefined
          }
          page={page}
          tool={tool}
          zoom={zoom}
          text={text}
          fontSize={fontSize}
          color={color}
          selected={selected}
          setSelected={setSelected}
          add={(a) => {
            if (
              update((e) => ({
                ...e,
                pages: e.pages.map((p) =>
                  p.id === page.id
                    ? { ...p, annotations: [...p.annotations, a] }
                    : p,
                ),
              }))
            ) {
              setSelected(a.id);
              if (a.type === "text") setTool("select");
            }
          }}
          patch={patch}
          extracted={texts[page.source]}
          query={query}
          t={t}
        />
        <aside className="ps-right-sidebar">
          <TextPanel
            doc={s.doc}
            page={page}
            pages={edit.pages}
            onSelect={select}
            extracted={texts[page.source]}
            onExtract={onExtract}
            query={query}
            setQuery={setQuery}
            t={t}
            notice={notice}
          />
        </aside>
      </div>
      <footer className="ps-statusbar">
        <span>
          <Check size={11} />
          {t(
            "محلي بالكامل. بدون رفع ملفات.",
            "Local processing. No file uploads.",
          )}
        </span>
        <span>
          {t("صفحة ", "Page ")}
          {index + 1} / {edit.pages.length} · {page.annotations.length}{" "}
          {t("إضافة", "annotations")} · {t("الأصل ", "Source ")}
          {page.source + 1}
        </span>
      </footer>
      {nativeEdit && (
        <NativeTextEditor
          {...nativeEdit}
          name={s.name}
          close={() => setNativeEdit(null)}
          open={load}
          t={t}
        />
      )}
      {help && <Guide t={t} onClose={() => setHelp(false)} />}{" "}
      {removePage && (
        <Modal
          title={t("حذف الصفحة من النسخة؟", "Remove this page from your copy?")}
          onClose={() => setRemovePage(null)}
        >
          <p>
            {t(
              "الملف الأصلي لا يتغير، ويمكن التراجع عن الحذف.",
              "The original file is unchanged. This action can be undone.",
            )}
          </p>
          <button
            className="ps-button danger"
            onClick={() => {
              update((e) => ({
                ...e,
                pages: e.pages.filter((p) => p.id !== removePage),
              }));
              setRemovePage(null);
            }}
          >
            {t("حذف الصفحة", "Remove page")}
          </button>
        </Modal>
      )}
    </main>
  );
}
