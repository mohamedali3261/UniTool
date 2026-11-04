import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elementKind, BLEND_MODES } from '../src/utils/elementStyle';
import { EXTRA_TEXT_PRESETS } from '../src/data/extraTextPresets';
import { EXTRA_SHAPES } from '../src/data/extraShapes';
import { TEXT_PRESETS } from '../src/data/presets';
import { SHAPES_CATALOG, SHAPE_CATEGORIES } from '../src/data/shapesCatalog';
test('formatting routes text, images, lines, groups and geometry to their own controls', () => {
  for (const type of ['text', 'textbox', 'i-text'])
    assert.equal(elementKind(type), 'text');
  for (const type of ['line', 'polyline'])
    assert.equal(elementKind(type), 'line');
  for (const type of ['group', 'activeSelection'])
    assert.equal(elementKind(type), 'group');
  assert.equal(elementKind('image'), 'image');
  assert.equal(elementKind('ellipse'), 'shape');
  assert.equal(elementKind('custom'), 'object');
  assert.equal(BLEND_MODES.length, 6);
});
test('24 new text presets are uniquely registered, bilingual and readable by default', () => {
  assert.equal(EXTRA_TEXT_PRESETS.length, 24);
  assert.equal(
    new Set(TEXT_PRESETS.map((p) => p.id)).size,
    TEXT_PRESETS.length,
  );
  for (const preset of EXTRA_TEXT_PRESETS) {
    assert.ok(
      preset.label && preset.labelAr && preset.text && preset.fontFamily,
    );
    assert.equal(preset.fill, '#000000');
    assert.ok(TEXT_PRESETS.includes(preset));
    assert.ok(preset.fontSize >= 18);
  }
});
test('16 additional vector shapes are registered in real categories with no external media', () => {
  assert.equal(EXTRA_SHAPES.length, 16);
  assert.equal(
    new Set(SHAPES_CATALOG.map((p) => p.id)).size,
    SHAPES_CATALOG.length,
  );
  for (const shape of EXTRA_SHAPES) {
    assert.ok(SHAPES_CATALOG.includes(shape));
    assert.ok(SHAPE_CATEGORIES.some((c) => c.id === shape.category));
    assert.match(shape.svgPath!, /^M/);
    assert.ok(shape.name && shape.nameAr);
    assert.equal(shape.viewBox, '0 0 100 100');
  }
});
