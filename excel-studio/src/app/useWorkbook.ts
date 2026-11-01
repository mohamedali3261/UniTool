import { useCallback, useEffect, useRef, useState } from "react";
import { type Workbook } from "../core/types";
import { validateBook } from "../core/workbook";
import { templateBook } from "../data/templates";
const KEY = "unitool.excel-studio.workbook.v1";
export function useWorkbook() {
  const [initial] = useState(() => {
      try {
        const raw = localStorage.getItem(KEY);
        return {
          book: raw
            ? validateBook(JSON.parse(raw))
            : templateBook(
                "sales",
                localStorage.getItem("excel-studio.lang") === "en"
                  ? "en"
                  : "ar",
              ),
          warning: "",
        };
      } catch {
        return {
          book: templateBook("sales"),
          warning:
            "تعذر استعادة النسخة المحلية. الملف المحفوظ يدويًا يمكن استيراده. / Local recovery failed.",
        };
      }
    }),
    [book, setBook] = useState(initial.book),
    [saveState, setSaveState] = useState("saved"),
    [error, setError] = useState(initial.warning),
    past = useRef<Workbook[]>([]),
    future = useRef<Workbook[]>([]),
    current = useRef(book);
  current.current = book;
  const update = useCallback(
    (change: Workbook | ((book: Workbook) => Workbook), history = true) => {
      try {
        const next =
          typeof change === "function" ? change(current.current) : change;
        if (history) {
          past.current.push(current.current);
          if (past.current.length > 40) past.current.shift();
          future.current = [];
        }
        current.current = next;
        setBook(next);
        return true;
      } catch (e: any) {
        setError(e.message);
        return false;
      }
    },
    [],
  );
  const undo = useCallback(() => {
      const prev = past.current.pop();
      if (prev) {
        future.current.push(current.current);
        current.current = prev;
        setBook(prev);
      }
    }, []),
    redo = useCallback(() => {
      const next = future.current.pop();
      if (next) {
        past.current.push(current.current);
        current.current = next;
        setBook(next);
      }
    }, []);
  useEffect(() => {
    setSaveState("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(book));
        setSaveState("saved");
      } catch {
        setSaveState("error");
        setError(
          "التخزين المحلي ممتلئ أو غير متاح. صدّر ملف المشروع لحفظ شغلك. / Local save failed. Export a project backup.",
        );
      }
    }, 450);
    return () => clearTimeout(t);
  }, [book]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (saveState !== "saved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [saveState]);
  return {
    book,
    update,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    saveState,
    error,
    setError,
  };
}
