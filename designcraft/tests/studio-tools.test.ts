import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSnap } from '../src/utils/smartGuides';
import { collectDesignColors, mergeBrandColors, normalizeBrandColor, parseBrandColors } from '../src/utils/brandKit';
import { createProjectFile, parseProjectFile, projectFileName, MAX_PROJECT_FILE_BYTES } from '../src/utils/projectFile';
import type { ProjectItem } from '../src/types';
import { dcTranslations } from '../src/translations';

const bounds = (left: number, top: number, width = 100, height = 80) => ({ left, top, width, height });
const project: ProjectItem = {
  id: 'original', title: 'حملة الصيف', width: 800, height: 600, category: 'social', createdAt: 1, updatedAt: 2,
  canvasData: { version: '5.3.0', background: '#FFFFFF', objects: [
    { type: 'rect', id: 'shape', left: 100, top: 100, width: 200, height: 100, fill: '#0EA5E9', lockMovementX: true },
    { type: 'textbox', id: 'text', left: 200, top: 300, width: 200, height: 80, text: 'أهلاً', fill: '#F97316' },
  ] },
};

test('smart guides snap the nearest edge/center in design coordinates', () => {
  const result = calculateSnap(bounds(347, 20), [], 800, 600, 6);
  assert.equal(result.dx, 3);
  assert.equal(result.dy, 0);
  assert.deepEqual(result.guides, [{ axis: 'x', position: 400, source: 'canvas' }]);
  assert.deepEqual(calculateSnap(bounds(10, 10), [], 800, 600, 6), { dx: 0, dy: 0, guides: [] });
});

test('smart guides include object edges and both axes without mutating bounds', () => {
  const moving = bounds(97, 197);
  const result = calculateSnap(moving, [bounds(100, 200)], 800, 600, 6);
  assert.equal(result.dx, 3);
  assert.equal(result.dy, 3);
  assert.equal(result.guides.length, 2);
  assert.ok(result.guides.every(guide => guide.source === 'object'));
  assert.deepEqual(moving, bounds(97, 197));
});

test('zoom-adjusted tolerance keeps the same screen-space snapping threshold', () => {
  assert.equal(calculateSnap(bounds(395, 20), [], 800, 600, 6 / 0.5).dx, 5);
  assert.equal(calculateSnap(bounds(395, 20), [], 800, 600, 6 / 2).dx, 0);
});

test('brand colors normalize, deduplicate, preserve order and enforce capacity', () => {
  assert.equal(normalizeBrandColor('#abc'), '#AABBCC');
  assert.equal(normalizeBrandColor('javascript:alert(1)'), null);
  assert.deepEqual(parseBrandColors('["#abc","#AABBCC",4,"#fff"]'), ['#AABBCC', '#FFFFFF']);
  assert.deepEqual(parseBrandColors('{broken'), []);
  const result = mergeBrandColors(Array.from({ length: 23 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`), ['#FFFFFF', '#FFFFFF', '#000000', '#123456']);
  assert.equal(result.added, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.colors.length, 24);
});

test('palette extraction reads nested vectors and ignores image payloads', () => {
  assert.deepEqual(collectDesignColors({ background: '#fff', objects: [
    { type: 'group', objects: [{ fill: '#123456', stroke: '#abcdef' }] },
    { type: 'image', src: '#999999', _originalSrc: '#888888' },
    { fill: { colorStops: [{ color: '#112233' }, { color: '#123456' }] } },
  ] }), ['#FFFFFF', '#123456', '#ABCDEF', '#112233']);
});

test('editable project backup round-trips Arabic text, metadata and locks with a fresh id', () => {
  const text = createProjectFile(project);
  const imported = parseProjectFile(text);
  assert.notEqual(imported.id, project.id);
  assert.equal(imported.title, project.title);
  assert.deepEqual(imported.canvasData, project.canvasData);
  assert.equal(imported.canvasData.objects[0].lockMovementX, true);
  assert.ok(!text.includes('thumbnail'));
  assert.equal(projectFileName('a/b:c*?'), 'a-b-c--.unitool.json');
});

test('backup preserves embedded images and gradient backgrounds', () => {
  const value = { ...project, canvasData: {
    background: { type: 'linear', colorStops: [{ offset: 0, color: '#fff' }, { offset: 1, color: '#000' }] },
    objects: [{ type: 'image', src: 'data:image/png;base64,AA==', width: 10, height: 10 }],
  } };
  assert.deepEqual(parseProjectFile(createProjectFile(value)).canvasData, value.canvasData);
});

test('backup accepts Fabric image filters with serialized camel-case names', () => {
  const value = { ...project, canvasData: { objects: [{ type: 'image', src: 'data:image/png;base64,AA==', filters: [
    { type: 'HueRotation', rotation: 0.2 }, { type: 'BlendColor', color: '#FF0000', mode: 'multiply' }, { type: 'RemoveColor', color: '#FFFFFF', distance: 0.1 },
  ] }] } };
  assert.deepEqual(parseProjectFile(createProjectFile(value)).canvasData, value.canvasData);
});

test('imports reject foreign formats, future versions, invalid dimensions and corrupt JSON', () => {
  for (const text of ['{broken', '{}', JSON.stringify({ format: 'other', version: 1 }), createProjectFile(project).replace('"version":1', '"version":2')]) {
    assert.throws(() => parseProjectFile(text));
  }
  assert.throws(() => parseProjectFile(createProjectFile({ ...project, width: 0 })));
  assert.throws(() => parseProjectFile(' '.repeat(MAX_PROJECT_FILE_BYTES + 1)));
});

test('imports reject unsafe sources, unknown fabric classes and excessive nesting', () => {
  for (const source of ['javascript:alert(1)', 'file:///etc/passwd', 'blob:http://localhost/id', 'data:image/svg+xml,<svg onload="alert(1)"></svg>', 'data:image/svg+xml,<svg><image href="https://example.com/a.png"/></svg>']) {
    const value = { ...project, canvasData: { objects: [{ type: 'image', src: source }] } };
    assert.throws(() => createProjectFile(value));
  }
  assert.throws(() => createProjectFile({ ...project, canvasData: { objects: [{ type: 'custom-executable' }] } }));
  let nested: any = { type: 'rect' };
  for (let i = 0; i < 23; i++) nested = { type: 'group', objects: [nested] };
  assert.throws(() => createProjectFile({ ...project, canvasData: { objects: [nested] } }));
});

test('Arabic and English dictionaries expose the same studio keys', () => {
  assert.deepEqual(Object.keys(dcTranslations.ar).sort(), Object.keys(dcTranslations.en).sort());
});
