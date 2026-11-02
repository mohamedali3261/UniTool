import { type Project, uid, bounds } from "./types";
import { validateProject } from "./storage";
import { pasteNodes } from "./clipboard";
export type PersonalAsset = {
  id: string;
  name: string;
  project: Project;
  updated: number;
};
let connection: Promise<IDBDatabase>;
const db = () =>
  (connection ||= new Promise((resolve, reject) => {
    const r = indexedDB.open("unitool-logo-personal-assets", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("assets", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
export async function listAssets() {
  const d = await db();
  return new Promise<PersonalAsset[]>((resolve, reject) => {
    const r = d.transaction("assets").objectStore("assets").getAll();
    r.onsuccess = () =>
      resolve(
        r.result.sort(
          (a: PersonalAsset, b: PersonalAsset) => b.updated - a.updated,
        ),
      );
    r.onerror = () => reject(r.error);
  });
}
export async function saveAsset(asset: PersonalAsset) {
  validateProject(asset.project);
  if (JSON.stringify(asset).length > 12 * 1024 * 1024)
    throw new Error("Asset exceeds 12MB");
  const d = await db();
  return new Promise<void>((resolve, reject) => {
    const t = d.transaction("assets", "readwrite");
    t.objectStore("assets").put(asset);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
export async function removeAsset(id: string) {
  const d = await db();
  return new Promise<void>((resolve, reject) => {
    const t = d.transaction("assets", "readwrite");
    t.objectStore("assets").delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
export function selectionAsset(
  p: Project,
  ids: string[],
  name: string,
): PersonalAsset {
  const selected = p.nodes.filter((n) => ids.includes(n.id) && !n.hidden);
  if (!selected.length) throw new Error("Select visible elements first");
  const b = bounds(selected),
    scale = Math.min(1, 600 / Math.max(b.w, b.h)),
    nodes = pasteNodes(selected, { x: 400, y: 300 }).map((n) => ({
      ...n,
      x: 400 + (n.x - 400) * scale,
      y: 300 + (n.y - 300) * scale,
      w: n.w * scale,
      h: n.h * scale,
      fontSize: Math.max(4, n.fontSize * scale),
    }));
  return {
    id: uid(),
    name: name.slice(0, 80) || "My mark",
    updated: Date.now(),
    project: {
      ...p,
      id: uid(),
      name: name.slice(0, 80),
      width: 800,
      height: 600,
      background: "",
      nodes,
      variants: undefined,
      activeVariant: undefined,
    },
  };
}
