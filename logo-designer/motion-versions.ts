import { uid, type Element, type Project } from "./types";
import type { LogoMotion } from "./motion";
export type MotionVersion = {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  nodes: Element[];
  motion?: LogoMotion;
};
const snapshot = (p: Project, id: string, name: string): MotionVersion => ({
  id,
  name,
  width: p.width,
  height: p.height,
  background: p.background,
  nodes: structuredClone(p.nodes),
  ...(p.motion ? { motion: structuredClone(p.motion) } : {}),
});
export function syncMotionVersions(p: Project): MotionVersion[] {
  return (
    p.motionVersions?.map((v) =>
      v.id === p.activeMotionVersion ? snapshot(p, v.id, v.name) : v,
    ) || []
  );
}
export function addMotionVersion(p: Project, name: string): Project {
  let list = syncMotionVersions(p);
  if (list.length >= 6) throw Error("Maximum six alternatives");
  if (!list.length) list = [snapshot(p, uid(), "Original")];
  const v = snapshot(p, uid(), name.trim().slice(0, 60) || "Alternative");
  return { ...p, motionVersions: [...list, v], activeMotionVersion: v.id };
}
export function switchMotionVersion(p: Project, id: string): Project {
  if (id === p.activeMotionVersion) return p;
  const list = syncMotionVersions(p),
    v = list.find((v) => v.id === id);
  if (!v) return p;
  return {
    ...p,
    width: v.width,
    height: v.height,
    background: v.background,
    nodes: structuredClone(v.nodes),
    motion: v.motion ? structuredClone(v.motion) : undefined,
    motionVersions: list,
    activeMotionVersion: id,
  };
}
export function deleteMotionVersion(p: Project, id: string): Project {
  if (id === p.activeMotionVersion) return p;
  return { ...p, motionVersions: p.motionVersions?.filter((v) => v.id !== id) };
}
