import test from "node:test";
import assert from "node:assert/strict";
import { loadElements, categories } from "../registry";
import { elementProject, elementCode } from "../lib/export";
import { validateProjectData } from "../../../../video-studio/src/lib/projectIO";
import { readFavorites, saveFavorites } from "../lib/preferences";
import { novaArt } from "../../../../video-studio/src/templates/nova/art";
import { orbitElements } from "../../../../video-studio/src/templates/orbit-launch";
const items = loadElements();
test("all nine template sources and six nonempty, disjoint maintenance categories", () => {
  assert.equal(categories.length, 6);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  assert.deepEqual(
    [...new Set(items.map((i) => i.source))].sort(),
    [
      "orbit-launch",
      "paper-stories",
      "cloudflare-checklist",
      "nova",
      "interface-flow",
      "reel",
      "product",
      "quote",
      "slideshow",
    ].sort(),
  );
  for (const c of categories)
    assert.ok(
      items.some((i) => i.category === c.id),
      c.id,
    );
  assert.ok(items.length > 300);
});
test("library uses real source artwork and layers, not placeholder copies", () => {
  assert.equal(items.find((i) => i.id === "nova-art-0")?.svg, novaArt(0));
  const original = orbitElements()
    .flat()
    .find((l) => l.name === "اسم العلامة")!;
  assert.equal(
    items.find((i) => i.source === "orbit-launch" && i.name === "اسم العلامة")
      ?.layer?.text,
    original.text,
  );
  assert.equal(items.filter((i) => i.kind === "scene").length, 7);
  assert.ok(
    items.some(
      (i) => i.name === "صورة الحساب الافتراضية" && i.svg?.includes("<circle"),
    ),
  );
});
test("every portable project passes the editor importer; fitting and color never mutate sources", () => {
  // Font measurement only: browser coverage separately uses the real Canvas renderer.
  const old = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => ({
        getContext: () => ({
          save() {},
          restore() {},
          measureText: (text: string) => ({ width: text.length * 15 }),
        }),
      }),
    },
  });
  try {
    for (const item of items) {
      const before = JSON.stringify(item);
      const data = elementProject(item, "#22aa88");
      const restored = validateProjectData(JSON.parse(JSON.stringify(data)));
      assert.ok(
        restored.assets.every((a) =>
          a.url.startsWith("data:image/svg+xml;base64,"),
        ),
      );
      assert.equal(restored.project.clips.length, 1);
      if (item.kind === "layer") {
        assert.equal(restored.project.texts[0].color, "#22aa88");
        assert.equal(restored.project.texts[0].x, 50);
      }
      if (item.kind === "scene")
        assert.equal(restored.project.clips[0].designScene, item.scene);
      assert.equal(JSON.stringify(item), before);
    }
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: old,
    });
  }
});
test("SVG and scene code preserve source and procedural provenance", () => {
  const svg = items.find((i) => i.kind === "svg")!,
    scene = items.find((i) => i.kind === "scene")!;
  assert.equal(elementCode(svg), svg.svg);
  assert.ok(elementCode(scene).includes("drawInterfaceScene(ctx,"));
});
test("favorites tolerate corrupt/disabled storage and filter malformed values", () => {
  const old = globalThis.localStorage;
  let value = "invalid json";
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => value,
      setItem: (_key: string, next: string) => {
        value = next;
      },
    },
  });
  try {
    assert.deepEqual(readFavorites(), []);
    value = '["good",false,3]';
    assert.deepEqual(readFavorites(), ["good"]);
    saveFavorites(["persist"]);
    assert.deepEqual(readFavorites(), ["persist"]);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem() {
          throw new Error();
        },
        setItem() {
          throw new Error();
        },
      },
    });
    assert.deepEqual(readFavorites(), []);
    assert.doesNotThrow(() => saveFavorites(["safe"]));
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: old,
    });
  }
});
