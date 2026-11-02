import { test } from "node:test";
import assert from "node:assert/strict";
import { closestAlignment } from "../src/utils/alignmentGuides";
import { resetEmptyText, normalTextFill } from "../src/utils/textReset";
import { parseProjectFile } from "../src/utils/projectFile";
const fixture = () => ({
  format: "unitool-designcraft",
  version: 1,
  project: {
    title: "Editable",
    width: 800,
    height: 600,
    category: "custom",
    canvasData: {
      objects: [
        { type: "textbox", text: "Hello", styles: {}, left: 20, top: 30 },
      ],
    },
  },
});
test("aligns nearby physical edges and centers and ignores distant objects", () => {
  const result = closestAlignment(
    { left: 102, top: 49, width: 40, height: 40 },
    [{ left: 100, top: 50, width: 40, height: 40 }],
    5,
  );
  assert.equal(result.dx, -2);
  assert.equal(result.dy, 1);
  assert.equal(
    closestAlignment(
      { left: 1000, top: 500, width: 40, height: 40 },
      [{ left: 100, top: 50, width: 40, height: 40 }],
      5,
    ).x,
    null,
  );
});
test("project file preserves editable objects and assigns a new identity", () => {
  const file = fixture(),
    a = parseProjectFile(file),
    b = parseProjectFile(file);
  assert.deepEqual(a.canvasData, file.project.canvasData);
  assert.notEqual(a.id, b.id);
});
test("unsafe resources, executable patterns, prototypes and invalid versions are rejected", () => {
  for (const obj of [
    { type: "image", src: "https://example.com/x.png" },
    { type: "image", src: "data:image/svg+xml;base64,AAA=" },
    { type: "rect", fill: { type: "pattern", source: "function(){alert(1)}" } },
    JSON.parse('{"type":"rect","__proto__":{"evil":true}}'),
  ]) {
    const f = fixture() as any;
    f.project.canvasData.objects = [obj];
    assert.throws(() => parseProjectFile(f));
  }
  assert.throws(() => parseProjectFile({ ...fixture(), version: 99 }));
});
test("only fully empty text resets formatting and it never changes another text box", () => {
  const a: any = {
    type: "textbox",
    text: "",
    fontSize: 88,
    left: 123,
    styles: { 0: { 0: { fill: "red" } } },
    set(v: any) {
      Object.assign(this, v);
    },
    initDimensions() {},
  };
  assert.equal(resetEmptyText(a), true);
  assert.equal(a.fontWeight, 400);
  assert.equal(a.fontFamily, "Cairo");
  assert.deepEqual(a.styles, {});
  assert.equal(a.left, 123);
  assert.equal(a.fontSize, 88);
  const b = { ...a, text: "Keep my style", fontWeight: 700 };
  assert.equal(resetEmptyText(b), false);
  assert.equal(b.fontWeight, 700);
  assert.equal(normalTextFill("#111111"), "#FFFFFF");
  assert.equal(normalTextFill("#fff"), "#0F172A");
});
