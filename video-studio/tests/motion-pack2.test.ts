import { test } from "node:test";
import assert from "node:assert/strict";
import { motionPack2 } from "../src/creative/pack2/catalog";
import {
  creativeCatalog,
  textCreativeIds,
  validCreative,
} from "../src/creative/catalog";
import { loadElements } from "../../src/pages/Elements/registry";
import { drawPack2 } from "../src/creative/pack2/render";
import { packText } from "../src/creative/pack2/text";

test("pack two adds sixty unique registered designs across six families", () => {
  assert.equal(motionPack2.length, 60);
  assert.equal(new Set(motionPack2.map((x) => x[0])).size, 60);
  for (const family of ["text", "bg", "shape", "ui", "data", "icon"])
    assert.equal(
      motionPack2.filter((x) => x[0].startsWith(`p2-${family}-`)).length,
      10,
    );
  assert.equal(creativeCatalog.length, 96);
  assert.equal(loadElements().length, 626);
  for (const [id, , category] of motionPack2) {
    const item = loadElements().find((i) => i.id === `creative-${id}`)!;
    assert.ok(item);
    assert.equal(item.category, category);
    assert.equal(item.animated, true);
    assert.ok(validCreative(item.layer?.creative));
    assert.equal(textCreativeIds.has(id), category === "typography");
  }
});
test("every new renderer produces drawing commands without overwriting parent opacity", () => {
  for (const [id] of motionPack2) {
    let calls = 0;
    const gradient = { addColorStop() {} };
    const target = {
      globalAlpha: 0.4,
      measureText: () => ({ width: 300 }),
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
    };
    const c = new Proxy(target, {
      get: (obj, key) =>
        key in obj
          ? Reflect.get(obj, key)
          : () => {
              calls++;
            },
    }) as unknown as CanvasRenderingContext2D;
    const settings = { id, speed: 1, strength: 1, pointerX: 50, pointerY: 50 };
    if (id.startsWith("p2-text-"))
      packText(c, id.slice(8), "عنوان عربي Hello", 45, 600, 1, "#63dfba");
    else drawPack2(c, id, 1, "#63dfba", "عنوان عربي", settings);
    assert.ok(calls > 0, id);
    assert.ok(c.globalAlpha >= 0 && c.globalAlpha <= 0.4, id);
  }
});
