import { useEffect, useRef, useState } from "react";
import type { fabric } from "fabric";
import type { ProjectItem } from "../types";
import { EXTRA_PROPS } from "./core/text";
import { portableProject } from "../utils/projectFile";
import { withCartonPrecision } from "../packaging/precision";
import {
  recoveryPoints,
  saveRecovery,
  type RecoveryPoint,
} from "./core/recovery";
export function useStudio(canvas: fabric.Canvas | null, project: ProjectItem) {
  const meta = useRef(project);
  meta.current = project;
  const [dirty, setDirty] = useState(false),
    [revision, setRevision] = useState(0),
    [points, setPoints] = useState<RecoveryPoint[]>([]),
    [recoveryStatus, setRecoveryStatus] = useState("idle"),
    [saving, setSaving] = useState(false);
  const needsSave = useRef(!!project.sessionOnly);
  const baseline = useRef(""),
    lastRecovery = useRef("");
  const changeHandler = useRef<() => void>(() => {});
  const snapshot = () => {
    if (!canvas) throw Error("Canvas not ready");
    return {
      ...meta.current,
      canvasData: {
        ...withCartonPrecision(() => canvas.toJSON(EXTRA_PROPS)),
        background:
          meta.current.canvasData?.background ?? canvas.backgroundColor,
      },
    };
  };
  const refresh = async () => {
    const list = await recoveryPoints(meta.current.id);
    setPoints(list);
    if (!list.length) setRecoveryStatus("idle");
  };
  const checkpoint = async () => {
    if (!canvas) return;
    setRecoveryStatus("saving");
    try {
      const data = await portableProject(snapshot(), canvas);
      if (
        data !== lastRecovery.current ||
        !(await recoveryPoints(meta.current.id)).length
      ) {
        await saveRecovery(meta.current.id, data);
        lastRecovery.current = data;
      }
      await refresh();
      setRecoveryStatus("saved");
    } catch (error) {
      setRecoveryStatus("failed");
      throw error;
    }
  };
  const checkpointRef = useRef(checkpoint);
  checkpointRef.current = checkpoint;
  useEffect(() => {
    if (!canvas) return;
    let timer: ReturnType<typeof setTimeout> | undefined,
      alive = true;
    const fingerprint = () => {
      const p = snapshot();
      return JSON.stringify({
        title: p.title,
        width: p.width,
        height: p.height,
        studio: p.studio,
        canvasData: p.canvasData,
      });
    };
    const loaded = () => {
      baseline.current = fingerprint();
      setDirty(needsSave.current);
      setRevision((n) => n + 1);
    };
    const changed = () => {
      if ((canvas as any).__studioInitializing) return;
      setRevision((n) => n + 1);
      if (!baseline.current) baseline.current = fingerprint();
      setDirty(needsSave.current || fingerprint() !== baseline.current);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (alive) void checkpointRef.current().catch(() => {});
      }, 2000);
    };
    changeHandler.current = changed;
    const selected = () => setRevision((n) => n + 1);
    const saved = (event: Event) => {
      const d = (event as CustomEvent).detail;
      if (d?.id !== meta.current.id) return;
      setSaving(false);
      if (d.ok) {
        needsSave.current = false;
        const current = fingerprint();
        if (typeof d.fingerprint === "string") baseline.current = d.fingerprint;
        else baseline.current = current;
        setDirty(current !== baseline.current);
      } else setDirty(true);
    };
    const savingHandler = (event: Event) => {
      if ((event as CustomEvent).detail?.id === meta.current.id) setSaving(true);
    };
    for (const name of [
      "object:added",
      "object:removed",
      "object:modified",
      "text:changed",
      "studio:changed",
    ])
      canvas.on(name as any, changed);
    for (const name of [
      "selection:created",
      "selection:updated",
      "selection:cleared",
    ])
      canvas.on(name as any, selected);
    canvas.on("studio:loaded" as any, loaded);
    window.addEventListener("designcraft:saved", saved);
    window.addEventListener("designcraft:saving", savingHandler);
    if (!(canvas as any).__studioInitializing) loaded();
    refresh().catch(() => setRecoveryStatus("failed"));
    return () => {
      alive = false;
      clearTimeout(timer);
      changeHandler.current = () => {};
      for (const name of [
        "object:added",
        "object:removed",
        "object:modified",
        "text:changed",
        "studio:changed",
      ])
        canvas.off(name as any, changed);
      for (const name of [
        "selection:created",
        "selection:updated",
        "selection:cleared",
      ])
        canvas.off(name as any, selected);
      canvas.off("studio:loaded" as any, loaded);
      window.removeEventListener("designcraft:saved", saved);
      window.removeEventListener("designcraft:saving", savingHandler);
    };
  }, [canvas, project.id]);
  useEffect(() => {
    changeHandler.current();
  }, [
    project.title,
    project.width,
    project.height,
    JSON.stringify(project.studio),
    project.canvasData?.background,
  ]);
  useEffect(() => {
    if (!dirty && !saving) return;
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty, saving]);
  return {
    dirty,
    saving,
    revision,
    points,
    recoveryStatus,
    checkpoint,
    refresh,
    snapshot,
  };
}
