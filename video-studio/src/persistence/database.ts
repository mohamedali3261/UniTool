import { assetIsUsed, type Asset, type Project } from "../types";
import { validateProjectData } from "../lib/projectIO";
export type SavedProject = {
  id: string;
  name: string;
  updatedAt: number;
  project: Project;
  assetIds: string[];
};
type StoredMedia = Omit<Asset, "url"> & {
  key: string;
  file: Blob;
  revision: string;
};
let connection: Promise<IDBDatabase> | undefined;
function db() {
  if (!connection)
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("unitool-video-studio", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("projects", { keyPath: "id" });
        request.result.createObjectStore("media", { keyPath: "key" });
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          connection = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        connection = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        connection = undefined;
        reject(new Error("أغلق نسخة الاستوديو الأخرى ثم حاول مجددًا"));
      };
    });
  return connection;
}
const result = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
const complete = (transaction: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () =>
      reject(transaction.error || new Error("تعذّر حفظ المشروع"));
  });
export async function listProjects(): Promise<SavedProject[]> {
  const database = await db();
  return (
    (await result(
      database.transaction("projects").objectStore("projects").getAll(),
    )) as SavedProject[]
  ).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function saveDraft(id: string, project: Project, assets: Asset[]) {
  const database = await db();
  const used = assets.filter((a) => assetIsUsed(project, a.id));
  const stored: StoredMedia[] = [];
  for (const asset of used) {
    const existing = (await result(
      database
        .transaction("media")
        .objectStore("media")
        .get(`${id}:${asset.id}`),
    )) as StoredMedia | undefined;
    if (existing?.revision === asset.url) continue;
    if (!/^(blob:|data:(image|video|audio)\/)/.test(asset.url))
      throw new Error("المشروع يحتوي رابط وسائط غير محلي");
    const file = await (await fetch(asset.url)).blob();
    const { url, ...metadata } = asset;
    stored.push({ ...metadata, key: `${id}:${asset.id}`, file, revision: url });
  }
  const tx = database.transaction(["projects", "media"], "readwrite");
  const done = complete(tx);
  stored.forEach((media) => tx.objectStore("media").put(media));
  tx.objectStore("projects").put({
    id,
    name: project.name,
    updatedAt: Date.now(),
    project,
    assetIds: used.map((a) => `${id}:${a.id}`),
  } satisfies SavedProject);
  const records = tx.objectStore("projects").getAll();
  records.onsuccess = () => {
    const referenced = new Set(
      (records.result as SavedProject[]).flatMap((p) => p.assetIds),
    );
    const cursor = tx.objectStore("media").openCursor();
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (row) {
        if (!referenced.has(String(row.key))) row.delete();
        row.continue();
      }
    };
  };
  await done;
}
export async function restoreDraft(
  id: string,
): Promise<{ project: Project; assets: Asset[] }> {
  const database = await db();
  const record = (await result(
    database.transaction("projects").objectStore("projects").get(id),
  )) as SavedProject;
  if (!record) throw new Error("المشروع لم يعد موجودًا");
  const media = await Promise.all(
    record.assetIds.map(
      (key) =>
        result(
          database.transaction("media").objectStore("media").get(key),
        ) as Promise<StoredMedia>,
    ),
  );
  if (media.some((m) => !(m?.file instanceof Blob)))
    throw new Error("بعض وسائط المشروع مفقودة؛ افتح النسخة الاحتياطية JSON");
  const restored = media.map(({ file, revision, key, ...metadata }) => ({
    ...metadata,
    url: URL.createObjectURL(file),
  }));
  try {
    return validateProjectData(
      { version: 1, project: record.project, assets: restored },
      true,
    );
  } catch (error) {
    restored.forEach((a) => URL.revokeObjectURL(a.url));
    throw error;
  }
}
export async function deleteDraft(id: string) {
  const database = await db();
  const tx = database.transaction(["projects", "media"], "readwrite");
  const done = complete(tx);
  tx.objectStore("projects").delete(id);
  const request = tx.objectStore("projects").getAll();
  request.onsuccess = () => {
    const used = new Set(
      (request.result as SavedProject[]).flatMap((p) => p.assetIds),
    );
    const cursor = tx.objectStore("media").openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (entry) {
        if (!used.has(String(entry.key))) entry.delete();
        entry.continue();
      }
    };
  };
  await done;
}
export async function storageInfo() {
  const estimate = await navigator.storage?.estimate?.();
  return {
    usage: estimate?.usage ?? 0,
    quota: estimate?.quota ?? 0,
    persistent: (await navigator.storage?.persisted?.()) ?? false,
  };
}
export async function requestPersistence() {
  return (await navigator.storage?.persist?.()) ?? false;
}
