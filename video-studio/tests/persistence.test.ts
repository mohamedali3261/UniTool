import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import {
  saveDraft,
  listProjects,
  restoreDraft,
  deleteDraft,
} from "../src/persistence/database";
import { blankProject, newClip, type Asset } from "../src/types";
const asset: Asset = {
  id: "same-id",
  name: "image.png",
  type: "image",
  duration: 5,
  url: "data:image/png;base64,AA==",
};
const project = {
  ...blankProject(),
  name: "الحفظ الأول",
  clips: [newClip(asset)],
};
test("IndexedDB stores actual blobs and restores editable project after URLs change", async () => {
  const id = crypto.randomUUID();
  await saveDraft(id, project, [asset]);
  assert.ok((await listProjects()).some((p) => p.id === id));
  const restored = await restoreDraft(id);
  assert.deepEqual(restored.project, project);
  assert.ok(restored.assets[0].url.startsWith("blob:"));
  assert.equal((await (await fetch(restored.assets[0].url)).blob()).size, 1);
  URL.revokeObjectURL(restored.assets[0].url);
  await deleteDraft(id);
  await assert.rejects(restoreDraft(id));
});
test("same asset IDs in different projects cannot overwrite another saved file", async () => {
  const a = crypto.randomUUID(),
    b = crypto.randomUUID();
  await saveDraft(a, project, [asset]);
  await saveDraft(b, { ...project, name: "نسخة ثانية" }, [
    { ...asset, url: "data:image/png;base64,AQID" },
  ]);
  const first = await restoreDraft(a),
    second = await restoreDraft(b);
  assert.equal((await (await fetch(first.assets[0].url)).blob()).size, 1);
  assert.equal((await (await fetch(second.assets[0].url)).blob()).size, 3);
  await deleteDraft(b);
  assert.ok((await listProjects()).some((p) => p.id === a));
  URL.revokeObjectURL(first.assets[0].url);
  URL.revokeObjectURL(second.assets[0].url);
  await deleteDraft(a);
});
test("overlay-only assets are included and unused files are not persisted", async () => {
  const id = crypto.randomUUID();
  const logo = { ...asset, id: "logo" };
  const p = {
    ...project,
    overlays: [
      {
        id: "layer",
        assetId: "logo",
        at: 0,
        start: 0,
        end: 2,
        x: 50,
        y: 50,
        width: 30,
        opacity: 1,
        rotation: 0,
        volume: 0,
      },
    ],
  };
  await saveDraft(id, p, [asset, logo, { ...asset, id: "unused" }]);
  const restored = await restoreDraft(id);
  assert.equal(restored.assets.length, 2);
  assert.equal(restored.project.overlays?.length, 1);
  restored.assets.forEach((a) => URL.revokeObjectURL(a.url));
  await deleteDraft(id);
});
test("failed media fetch cannot leave a half-written project", async () => {
  const id = crypto.randomUUID();
  await assert.rejects(
    saveDraft(id, project, [
      { ...asset, url: "https://example.com/private.png" },
    ]),
  );
  assert.ok(!(await listProjects()).some((p) => p.id === id));
});
