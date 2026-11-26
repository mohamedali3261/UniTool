import { parseProject, type Project } from "./model";
export interface SavedProject {
  id: string;
  name: string;
  date: number;
  thumbnail: string;
  project: Project;
}
function db() {
  return new Promise<IDBDatabase>((res, rej) => {
    const request = indexedDB.open("unitool-product-library", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("projects", { keyPath: "id" });
    request.onsuccess = () => res(request.result);
    request.onerror = () => rej(request.error);
  });
}
async function request<T>(
  mode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest<T>,
) {
  const d = await db();
  try {
    return await new Promise<T>((res, rej) => {
      const tx = d.transaction("projects", mode),
        r = action(tx.objectStore("projects"));
      tx.oncomplete = () => res(r.result);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  } finally {
    d.close();
  }
}
export const listProjects = () =>
  request<SavedProject[]>("readonly", (s) => s.getAll());
export const saveProject = (p: SavedProject) =>
  request("readwrite", (s) => s.put(p));
export const deleteProject = (id: string) =>
  request("readwrite", (s) => s.delete(id));
export const restoreProject = (p: SavedProject) =>
  parseProject(JSON.stringify(p.project));
