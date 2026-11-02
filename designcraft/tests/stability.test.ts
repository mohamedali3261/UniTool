import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fabric } from 'fabric';
import { initFabricDefaults } from '../src/utils/fabricHelpers';
import { installTextPathRevival } from '../src/utils/textPathRevival';

test('repeated canvas setup does not accumulate style serializer wrappers', () => {
  initFabricDefaults();
  const util = fabric.util as any;
  const to = util.stylesToArray, from = util.stylesFromArray;
  for (let i = 0; i < 200; i++) initFabricDefaults();
  assert.equal(util.stylesToArray, to);
  assert.equal(util.stylesFromArray, from);
  assert.deepEqual(util.stylesToArray(undefined, 'safe'), []);
  assert.deepEqual(util.stylesFromArray(undefined, 'safe'), {});
});
test('text path revival installation is idempotent', () => {
  installTextPathRevival();
  const box = fabric.Textbox.fromObject, text = fabric.IText.fromObject;
  for (let i = 0; i < 200; i++) installTextPathRevival();
  assert.equal(fabric.Textbox.fromObject, box);
  assert.equal(fabric.IText.fromObject, text);
});

test('raster allocations reject oversized, nonfinite and invalid dimensions before rendering', async () => {
  const { rasterWithinBudget: fits } = await import('../src/utils/rasterBudget');
  assert.equal(fits(800, 600, 3), true);
  assert.equal(fits(8000, 5000), true);
  assert.equal(fits(8000, 5000, 2), false);
  assert.equal(fits(20000, 1), false);
  assert.equal(fits(100, 100, Infinity), false);
  assert.equal(fits(NaN, 100), false);
  assert.equal(fits(100, 100, -1), false);
});

test('physical shortcut keys survive Arabic layout without translating typed text', async () => {
  const { shortcutKey } = await import('../src/utils/keyboard');
  assert.equal(shortcutKey({ code: 'KeyS', key: 'س' }), 's');
  assert.equal(shortcutKey({ code: 'KeyZ', key: 'ئ' }), 'z');
  assert.equal(shortcutKey({ code: 'KeyC', key: 'ؤ' }), 'c');
  assert.equal(shortcutKey({ code: 'BracketRight', key: 'د' }), ']');
  assert.equal(shortcutKey({ code: '', key: 'S' }), 's');
});

test('floating controls clamp to viewport edges including small and offset viewports', async () => {
  const { popoverBounds } = await import('../src/components/Common/FloatingPopover');
  for (const view of [{ left: 0, top: 0, width: 320, height: 480 }, { left: 0, top: 0, width: 390, height: 280 }, { left: 12, top: 90, width: 280, height: 220 }]) {
    for (const left of [-30, 0, 240, 370]) {
      const p = popoverBounds({ left, right: left + 80, top: 350, bottom: 380 }, view, 500);
      assert.ok(p.left >= view.left);
      assert.ok(p.top >= view.top);
      assert.ok(p.left + p.width <= view.left + view.width);
      assert.ok(p.top + p.maxHeight <= view.top + view.height);
    }
  }
});
