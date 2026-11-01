import { type Project } from "./types";
/** IndexedDB يحفظ الصور المضمّنة بدون حد localStorage الصغير. */
let connection: Promise<IDBDatabase>;
function db() {
  return (connection ||= new Promise((resolve, reject) => {
    const r = indexedDB.open("unitool-logo-designer", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("projects", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  }));
}
export async function allProjects() {
  const d = await db();
  return new Promise<Project[]>((resolve, reject) => {
    const r = d.transaction("projects").objectStore("projects").getAll();
    r.onsuccess = () =>
      resolve((r.result as Project[]).sort((a, b) => b.updated - a.updated));
    r.onerror = () => reject(r.error);
  });
}
export async function saveProject(p: Project) {
  const d = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction("projects", "readwrite");
    tx.objectStore("projects").put({ ...p, updated: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function deleteProject(id: string) {
  const d = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = d.transaction("projects", "readwrite");
    tx.objectStore("projects").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export function validateProject(value: unknown): Project {
  const p = value as Project;
  const num = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const color = (s: unknown) =>
    typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s);
  if (
    !p ||
    p.version !== 1 ||
    typeof p.id !== "string" ||
    !p.id ||
    typeof p.name !== "string" ||
    p.name.length > 160 ||
    !num(p.width, 64, 4096) ||
    !num(p.height, 64, 4096) ||
    (!color(p.background) && p.background !== "") ||
    !Array.isArray(p.nodes) ||
    p.nodes.length > 500
  )
    throw new Error("Invalid project");
  if (p.variants !== undefined) {
    if (
      !Array.isArray(p.variants) ||
      !p.variants.length ||
      p.variants.length > 8 ||
      new Set(p.variants.map((v) => v.id)).size !== p.variants.length ||
      !p.variants.some((v) => v.id === p.activeVariant)
    )
      throw new Error("Invalid variants");
    for (const v of p.variants) {
      if (
        typeof v.id !== "string" ||
        typeof v.name !== "string" ||
        v.name.length > 80
      )
        throw new Error("Invalid variant");
      validateProject({
        ...p,
        variants: undefined,
        activeVariant: undefined,
        background: v.background,
        nodes: v.nodes,
      });
    }
  }
  const ids = new Set();
  for (const n of p.nodes) {
    if (
      !n ||
      typeof n.id !== "string" ||
      ids.has(n.id) ||
      !["shape", "icon", "text", "image", "vector"].includes(n.kind) ||
      typeof n.asset !== "string" ||
      typeof n.name !== "string" ||
      typeof n.text !== "string" ||
      n.text.length > 3000 ||
      typeof n.font !== "string" ||
      !/^[a-z0-9 -]+$/i.test(n.font) ||
      !num(n.x, -20000, 20000) ||
      !num(n.y, -20000, 20000) ||
      !num(n.w, 1, 20000) ||
      !num(n.h, 1, 20000) ||
      !num(n.rotation, -3600, 3600) ||
      !num(n.opacity, 0, 1) ||
      !color(n.fill) ||
      !color(n.fill2) ||
      !color(n.stroke) ||
      !num(n.fontSize, 4, 600) ||
      !num(n.weight, 100, 900) ||
      !num(n.spacing, -20, 80) ||
      !num(n.lineHeight, 0.5, 4) ||
      !num(n.curve, -100, 100) ||
      !num(n.strokeWidth, 0, 40) ||
      !num(n.radius, 0, 1000) ||
      !num(n.shadow, 0, 80) ||
      !num(n.blur, 0, 30) ||
      !["start", "middle", "end"].includes(n.align) ||
      ["hidden", "locked", "flipX", "flipY", "gradient"].some(
        (k) => typeof n[k] !== "boolean",
      )
    )
      throw new Error("Invalid element");
    ids.add(n.id);
    if (
      n.kind === "image" &&
      !/^data:image\/(png|jpeg|webp);base64,/i.test(n.asset)
    )
      throw new Error("Only embedded raster images are allowed");
    if (
      n.kind === "vector" &&
      (!Array.isArray(n.paths) ||
        n.paths.length > 100 ||
        n.paths.some(
          (v) =>
            !color(v.fill) ||
            typeof v.d !== "string" ||
            v.d.length > 600000 ||
            !/^[MmLlHhVvCcSsQqTtAaZz0-9.,+eE\s-]+$/.test(v.d),
        ))
    )
      throw new Error("Invalid vector");
  }
  return p;
}
