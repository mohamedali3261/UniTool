import { useEffect, useRef, useState } from "react";
import { useEvent } from "../hooks/useEvent";
import type { Project, Asset } from "../types";
import { saveDraft } from "./database";
export function useAutosave(id: string, project: Project, assets: Asset[]) {
  const [status, setStatus] = useState("جاهز للحفظ التلقائي");
  const [revision, setRevision] = useState(0);
  const chain = useRef(Promise.resolve());
  const latest = useRef({ id, project, assets });
  latest.current = { id, project, assets };
  const touched = useRef(new Set<string>());
  if (project.clips.length) touched.current.add(id);
  const saved = useRef<{ id: string; project: Project; assets: Asset[] }>(
    undefined,
  );
  const flush = useEvent(() => {
    const snapshot = latest.current;
    if (!touched.current.has(snapshot.id)) return chain.current;
    chain.current = chain.current.then(async () => {
      if (
        saved.current?.id === snapshot.id &&
        saved.current.project === snapshot.project &&
        saved.current.assets === snapshot.assets
      )
        return;
      if (latest.current === snapshot) setStatus("جاري الحفظ تلقائيًا…");
      try {
        await saveDraft(snapshot.id, snapshot.project, snapshot.assets);
        saved.current = snapshot;
        if (
          latest.current.id === snapshot.id &&
          latest.current.project === snapshot.project &&
          latest.current.assets === snapshot.assets
        )
          setStatus("محفوظ على هذا الجهاز ✓");
        setRevision((n) => n + 1);
      } catch (error) {
        if (latest.current.id === snapshot.id)
          setStatus(
            (error as DOMException).name === "QuotaExceededError"
              ? "المساحة ممتلئة — نزّل نسخة JSON الآن"
              : "تعذّر الحفظ التلقائي — استخدم حفظ المشروع",
          );
      }
    });
    return chain.current;
  });
  useEffect(() => {
    if (!touched.current.has(id)) {
      setStatus("جاهز للحفظ التلقائي");
      return;
    }
    setStatus("تعديلات غير محفوظة بعد…");
    const timer = setTimeout(() => void flush(), 1500);
    return () => clearTimeout(timer);
  }, [id, project, assets, flush]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) void flush();
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [flush]);
  return { status, revision, flush };
}
