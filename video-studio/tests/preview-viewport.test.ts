import test from "node:test";
import assert from "node:assert/strict";
import { boundView, FIT_VIEW } from "../src/pages/Editor/preview/geometry";
test("preview view clamps zoom and prevents panning the frame out of sight", () => {
  assert.deepEqual(
    boundView(
      { zoom: 2, x: 10000, y: -10000 },
      { width: 400, height: 225 },
      { width: 500, height: 300 },
    ),
    { zoom: 2, x: 150, y: -75 },
  );
  assert.deepEqual(
    boundView(
      { zoom: 0.5, x: 100, y: 200 },
      { width: 400, height: 225 },
      { width: 500, height: 300 },
    ),
    { zoom: 0.5, x: 0, y: 0 },
  );
  assert.equal(
    boundView(
      { zoom: 900, x: 0, y: 0 },
      { width: 400, height: 225 },
      { width: 500, height: 300 },
    ).zoom,
    4,
  );
  assert.equal(
    boundView(
      { zoom: -2, x: 0, y: 0 },
      { width: 400, height: 225 },
      { width: 500, height: 300 },
    ).zoom,
    0.25,
  );
  assert.equal(
    boundView(
      { zoom: NaN, x: 0, y: 0 },
      { width: 400, height: 225 },
      { width: 500, height: 300 },
    ).zoom,
    1,
  );
});
test("fit is a non-mutating view operation with a stable neutral state", () => {
  const view = { ...FIT_VIEW };
  boundView(view, { width: 400, height: 225 }, { width: 500, height: 300 });
  assert.deepEqual(view, FIT_VIEW);
});
