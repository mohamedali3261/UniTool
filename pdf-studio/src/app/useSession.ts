import { useCallback, useEffect, useRef, useState } from "react";
import { openPdf, fingerprint, type PdfDoc } from "../core/pdf";
import { LIMITS, uid, type EditState } from "../core/types";
export interface Session {
  doc: PdfDoc;
  bytes: Uint8Array;
  name: string;
  hash: string;
  id: string;
}
export function useSession() {
  const [session, setSession] = useState<Session | null>(null),
    [edit, setEdit] = useState<EditState>({ pages: [] }),
    [dirty, setDirty] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [history, setHistory] = useState({ undo: 0, redo: 0 });
  const current = useRef(edit),
    past = useRef<EditState[]>([]),
    future = useRef<EditState[]>([]),
    epoch = useRef(0),
    docRef = useRef<PdfDoc | null>(null);
  current.current = edit;
  const update = useCallback(
    (change: EditState | ((e: EditState) => EditState)) => {
      try {
        const next =
          typeof change === "function" ? change(current.current) : change;
        if (!next.pages.length || next.pages.length > LIMITS.pages)
          throw Error("عدد الصفحات 1–100 / Page limit: 1–100");
        if (
          next.pages.reduce((n, p) => n + p.annotations.length, 0) >
            LIMITS.annotations ||
          next.pages.some((p) => p.annotations.length > LIMITS.perPage)
        )
          throw Error(
            "الحد الأقصى 100 إضافة للصفحة و500 للمستند / Annotation limit reached",
          );
        past.current.push(current.current);
        if (past.current.length > 40) past.current.shift();
        future.current = [];
        current.current = next;
        setEdit(next);
        setDirty(true);
        setHistory({ undo: past.current.length, redo: 0 });
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      }
    },
    [],
  );
  const travel = useCallback((redo = false) => {
    const from = redo ? future : past,
      to = redo ? past : future,
      next = from.current.pop();
    if (!next) return;
    to.current.push(current.current);
    current.current = next;
    setEdit(next);
    setDirty(true);
    setHistory({ undo: past.current.length, redo: future.current.length });
  }, []);
  const load = useCallback(async (file: File) => {
    if (
      docRef.current &&
      !window.confirm(
        "سيتم استبدال المستند الحالي. احفظ تعديلاتك أولًا. / Replace the current document? Save changes first.",
      )
    )
      return;
    const token = ++epoch.current;
    setLoading(true);
    setError("");
    let opened: PdfDoc | undefined;
    try {
      const { doc, bytes } = await openPdf(file);
      opened = doc;
      const hash = await fingerprint(bytes);
      if (token !== epoch.current) {
        await doc.destroy();
        return;
      }
      const previous = docRef.current;
      docRef.current = doc;
      const next = {
        pages: Array.from({ length: doc.numPages }, (_, source) => ({
          id: uid(),
          source,
          rotation: 0,
          annotations: [],
        })),
      };
      current.current = next;
      setEdit(next);
      past.current = [];
      future.current = [];
      setHistory({ undo: 0, redo: 0 });
      setSession({ doc, bytes, hash, name: file.name, id: uid() });
      setDirty(false);
      await previous?.destroy();
    } catch (e) {
      if (opened && opened !== docRef.current) await opened.destroy();
      if (token === epoch.current)
        setError(
          (e as Error).message.includes("encrypted")
            ? "الملف محمي بكلمة مرور؛ افتح نسخة غير محمية ومصرح بها. / Password-protected PDF: use an authorized unlocked copy."
            : "تعذر فتح الملف. قد يكون تالفًا أو يتجاوز الحدود. / Could not open PDF. " +
                (e as Error).message,
        );
    } finally {
      if (token === epoch.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  useEffect(
    () => () => {
      epoch.current++;
      void docRef.current?.destroy();
    },
    [],
  );
  return {
    session,
    edit,
    update,
    travel,
    history,
    dirty,
    setDirty,
    loading,
    error,
    setError,
    load,
  };
}
