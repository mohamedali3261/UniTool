/**
 * Engine tests — every core module is exercised against the real bundled fonts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { loadFont, readSignature, sortGlyphs, glyphLabel, cloneShape, type LoadedFont } from '../core/fontEngine';
import { arabicFormFor, buildIndex, formGlyphName, isCombiningMark, readSubstitutions, scriptCoverage } from '../core/glyphIndex';
import {
  bboxOf,
  mirrorShape,
  nodeKey,
  SHAPE_PRESETS,
  translate,
  unionContours,
  pointsInPolygon,
  insidePolygon,
  nearestPoint,
  subtractContours,
  intersectContours,
  excludeContours,
  reverseContour,
  removeContour,
} from '../core/geometry';
import {
  alignPoints,
  contourCommands,
  contoursToPathData,
  dedupeContours,
  deletePoints,
  distributePoints,
  insertPoint,
  nodeStats,
  simplifyContours,
  smoothContours,
  snapPoints,
  toggleClosed,
} from '../core/outline';
import { canRedo, canUndo, commit, createHistory, current, listHistory, redo, undo } from '../core/history';
import {
  createDocument,
  glyphState,
  parseProject,
  saveProjectToList,
  serializeProject,
  setKerning,
  withOverride,
  withoutOverride,
  readStoredProjects,
  writeStoredProjects,
  editedCount,
  describeDocument,
  getKerning,
} from '../core/project';
import { exportFont, kerningReport, previewSvg, escapeXml, commandsForContours } from '../core/exporter';
import { canPatch, checksum, encodeSimpleGlyph, patchTruetype, readTableDirectory } from '../core/ttfWriter';
import { autoPairs, pairGap, suggestKerning, targetGapFor } from '../core/kerning';
import { LIBRARY, fidelityReport, reportScore, urlFor } from '../core/library';
import {
  arabicNameFor,
  displayName,
  filterGlyphs,
  glyphNameFor,
  matchesQuery,
  unicodeHex,
  GLYPH_GROUPS,
} from '../core/naming';
import { initialState, reduce } from '../state/labStore';

const here = path.dirname(fileURLToPath(import.meta.url));
const fontPath = (file: string) => path.join(here, '..', 'assets', 'fonts', file);

function load(file: string): LoadedFont {
  const bytes = fs.readFileSync(fontPath(file));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return loadFont(buffer, file);
}

const cairo = load('Cairo_700Bold.ttf');
const inter = load('Inter_400Regular.ttf');
const amiri = load('Amiri_400Regular.ttf');

function rect(): ReturnType<typeof SHAPE_PRESETS[number]['build']> {
  return SHAPE_PRESETS.find((preset) => preset.id === 'square')!.build({ x1: 0, y1: 0, x2: 500, y2: 700 });
}

/* ------------------------------------------------------------------ font */

test('fonts parse with real metrics, glyphs and tables', () => {
  assert.equal(cairo.summary.unitsPerEm, 1000);
  assert.equal(inter.summary.unitsPerEm, 2048);
  assert.ok(cairo.summary.glyphCount > 800);
  assert.ok(cairo.drawn.length > 700);
  assert.equal(cairo.summary.outlineFormat, 'truetype');
  assert.ok(cairo.summary.scripts.includes('arab'));
  assert.ok(cairo.summary.features.includes('init'));
  assert.ok(amiri.summary.glyphCount > 6000);
});

test('unicode lookup and glyph ordering are stable', () => {
  const beh = cairo.byUnicode.get(0x0628);
  assert.ok(beh);
  assert.equal(glyphLabel(cairo.glyphs.get(beh!)!), 'ب');
  const sorted = sortGlyphs(cairo, 'unicode');
  assert.equal(sorted.length, cairo.drawn.length);
  const byPoints = sortGlyphs(cairo, 'points');
  assert.ok((cairo.glyphs.get(byPoints[0])?.points.length ?? 0) >= (cairo.glyphs.get(byPoints[1])?.points.length ?? 0));
});

test('cloneShape is a deep copy', () => {
  const shape = cairo.glyphs.get(cairo.drawn[0])!;
  const copy = cloneShape(shape);
  copy.points[0].x += 12;
  copy.contours[0].points[0].y += 5;
  assert.notEqual(copy.points[0].x, shape.points[0].x);
  assert.notEqual(copy.contours[0].points[0].y, shape.contours[0].points[0].y);
});

test('unreadable and WOFF2 files raise a bilingual error', () => {
  assert.throws(() => loadFont(new Uint8Array([1, 2, 3, 4]).buffer as ArrayBuffer, 'broken.ttf'), /تعذر قراءة الخط|Could not read the font/);
  assert.equal(readSignature(new Uint8Array([0x4f, 0x54, 0x54, 0x4f]).buffer as ArrayBuffer), 'OTTO');
  const fake = new Uint8Array(64);
  fake.set([0x77, 0x4f, 0x46, 0x32], 0); // 'wOF2'
  assert.throws(() => loadFont(fake.buffer as ArrayBuffer, 'compressed.woff2'), /WOFF2/);
});

/* ------------------------------------------------------------------ GSUB */

test('arabic positional forms come from the real GSUB table', () => {
  const index = buildIndex(cairo);
  const beh = index.find((entry) => entry.unicode === 0x0628)!;
  assert.ok(beh.forms.initial && beh.forms.medial && beh.forms.final);
  assert.notEqual(beh.forms.initial, beh.name);
  assert.equal(formGlyphName(beh, 'medial'), beh.forms.medial);
  assert.equal(formGlyphName(beh, 'isolated'), beh.name);
  const subs = readSubstitutions(cairo);
  assert.ok((subs.get(beh.name) || []).length >= 3);
});

test('joining rules follow the Arabic algorithm', () => {
  assert.equal(arabicFormFor(0x0628, 0x0645), 'medial');
  assert.equal(arabicFormFor(null, 0x0645), 'initial');
  assert.equal(arabicFormFor(0x0645, null), 'final');
  assert.equal(arabicFormFor(null, null), 'isolated');
  // alef never joins forward
  assert.equal(arabicFormFor(null, 0x0627), 'isolated');
  assert.equal(arabicFormFor(0x0645, 0x0627), 'final');
  // a mark is not a joining neighbour
  assert.equal(arabicFormFor(0x064e, 0x0645), 'initial');
  assert.ok(isCombiningMark(0x0651));
  assert.ok(!isCombiningMark(0x0628));
});

test('coverage percentages add up', () => {
  const coverage = scriptCoverage(buildIndex(inter));
  assert.equal(coverage.arabicPct + coverage.latinPct + coverage.otherPct >= 99, true);
  assert.ok(coverage.latin > 100);
});

/* ------------------------------------------------------------------ geometry */

test('shape presets produce closed contours inside the requested box', () => {
  for (const preset of SHAPE_PRESETS) {
    const contours = preset.build({ x1: 40, y1: 20, x2: 540, y2: 720 });
    assert.ok(contours.length >= 1, preset.id);
    const box = bboxOf(contours.flatMap((contour) => contour.points));
    // a star/diamond is narrower than its box, but nothing may leave it
    assert.ok(box.x1 >= 39 && box.x2 <= 541, `${preset.id} x ${box.x1}..${box.x2}`);
    assert.ok(box.y1 >= 19 && box.y2 <= 721, `${preset.id} y ${box.y1}..${box.y2}`);
    for (const contour of contours) assert.ok(contour.points.length >= 3, preset.id);
  }
});

test('translate only moves the selected nodes', () => {
  const contours = rect();
  const moved = translate(contours, 10, -5, new Set([nodeKey(0, 0)]));
  assert.deepEqual(moved[0].points[0], { ...contours[0].points[0], x: contours[0].points[0].x + 10, y: contours[0].points[0].y - 5 });
  assert.equal(moved[0].points[1].x, contours[0].points[1].x);
  const all = translate(contours, 3, 3, null);
  assert.equal(all[0].points[1].x, contours[0].points[1].x + 3);
});

test('mirroring around an axis flips coordinates', () => {
  const contours = rect();
  const box = bboxOf(contours.flatMap((contour) => contour.points));
  const flipped = mirrorShape(contours, 'y', { x: 250, y: 0 });
  const flippedBox = bboxOf(flipped.flatMap((contour) => contour.points));
  assert.equal(Math.round(flippedBox.x1), Math.round(500 - box.x2));
  assert.equal(Math.round(flippedBox.x2), Math.round(500 - box.x1));
});

test('boolean helpers merge, subtract, intersect and exclude', () => {
  const contours = rect();
  assert.equal(unionContours([contours, contours]).length, 1);
  const cutter = { x1: 100, y1: 300, x2: 400, y2: 600 };
  const circle = SHAPE_PRESETS.find((preset) => preset.id === 'circle')!.build(cutter);
  const cut = subtractContours(contours, cutter);
  assert.equal(cut[0].points.length, contours[0].points.length); // corners sit outside the cutter
  const kept = intersectContours(circle, cutter);
  assert.ok(kept[0].points.length > 0 && kept[0].points.length <= circle[0].points.length);
  assert.ok(excludeContours(contours, circle).length >= 1);
  const reversed = reverseContour(contours[0]);
  assert.equal(reversed.points[0].x, contours[0].points.at(-1)!.x);
  assert.equal(removeContour(contours, 0).length, 0);
  assert.equal(toggleClosed(contours, 0)[0].closed, false);
});

test('simplify removes collinear nodes and dedupe removes doubles', () => {
  const contour = {
    closed: true,
    points: [
      { x: 0, y: 0, onCurve: true, contour: 0, index: 0, contourIndex: 0 },
      { x: 100, y: 0, onCurve: true, contour: 0, index: 1, contourIndex: 1 },
      { x: 200, y: 0, onCurve: true, contour: 0, index: 2, contourIndex: 2 },
      { x: 200, y: 200, onCurve: true, contour: 0, index: 3, contourIndex: 3 },
    ],
  };
  const simplified = simplifyContours([contour], 1);
  assert.equal(simplified.removed, 1);
  assert.equal(simplified.contours[0].points.length, 3);

  const doubled = { closed: true, points: [contour.points[0], { ...contour.points[0] }, contour.points[3]] };
  const deduped = dedupeContours([doubled], 0.5);
  assert.equal(deduped.removed, 1);
  assert.equal(deduped.contours[0].points.length, 2);
});

test('node operations: insert, delete, align, distribute, snap, smooth', () => {
  const contours = rect();
  const inserted = insertPoint(contours, 0, 0);
  assert.ok(inserted[0].points.length > contours[0].points.length);

  const selected = new Set([nodeKey(0, 0), nodeKey(0, 1)]);
  const aligned = alignPoints(contours, selected, 'y', 'min');
  assert.equal(aligned[0].points[0].y, aligned[0].points[1].y);

  const distributed = distributePoints(contours, new Set([nodeKey(0, 0), nodeKey(0, 1), nodeKey(0, 2)]), 'y');
  assert.ok(distributed.length === contours.length);

  const snapped = snapPoints(contours, new Set([nodeKey(0, 0)]), 50);
  assert.equal(snapped[0].points[0].x % 50, 0);

  const smoothed = smoothContours(contours, new Set([nodeKey(0, 0)]));
  assert.equal(smoothed.length, contours.length);

  const deleted = deletePoints(contours, new Set([nodeKey(0, 0), nodeKey(0, 1), nodeKey(0, 2)]));
  assert.equal(deleted.length, 0); // a 1-point contour is not an outline

  assert.ok(insidePolygon([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }], 5, 5));
  const lasso = pointsInPolygon(contours, [{ x: -10, y: -10 }, { x: 600, y: -10 }, { x: 600, y: 800 }, { x: -10, y: 800 }]);
  assert.equal(lasso.length, 4);
  const near = nearestPoint(contours, 2, 2, 10);
  assert.equal(near?.point.x, 0);
  assert.equal(nearestPoint(contours, 5000, 5000, 10), null);
});

/* ------------------------------------------------------------------ outline */

test('contours convert to valid M/L/Q/Z command streams', () => {
  const commands = contourCommands(rect()[0]);
  assert.equal(commands[0].type, 'M');
  assert.equal(commands.at(-1)!.type, 'Z');
  assert.ok(commands.some((command) => command.type === 'L'));

  const circle = SHAPE_PRESETS.find((preset) => preset.id === 'circle')!.build({ x1: 0, y1: 0, x2: 400, y2: 400 });
  const circleCommands = contourCommands(circle[0]);
  assert.ok(circleCommands.some((command) => command.type === 'Q'));

  const path = contoursToPathData(rect(), 1000);
  assert.ok(path.startsWith('M'));
  assert.ok(path.endsWith('Z'));
  assert.ok(!path.includes('NaN'));
  assert.equal(nodeStats(rect()).contours, 1);
  assert.equal(commandsForContours(rect()).length, commands.length);
});

/* ------------------------------------------------------------------ history */

test('history supports undo, redo, truncation and limits', () => {
  let history = createHistory({ value: 0 }, { maxEntries: 4 });
  assert.equal(canUndo(history), false);
  for (let step = 1; step <= 6; step += 1) history = commit(history, { value: step }, `خطوة ${step}`, `Step ${step}`);
  assert.ok(history.entries.length <= 4);
  assert.equal(current(history).value, 6);
  history = undo(history);
  assert.equal(current(history).value, 5);
  assert.ok(canRedo(history));
  history = redo(history);
  assert.equal(current(history).value, 6);
  history = commit(history, { value: 99 }, 'فرع جديد', 'New branch');
  assert.equal(canRedo(history), false);
  const list = listHistory(history);
  assert.equal(list[0].active, true);
  assert.equal(list.length, history.entries.length);
});

/* ------------------------------------------------------------------ project */

test('documents capture edits and reset cleanly', () => {
  const doc = createDocument(cairo);
  assert.equal(doc.metrics.unitsPerEm, 1000);
  assert.equal(editedCount(doc), 0);
  const name = cairo.drawn[0];
  const edited = withOverride(doc, name, { contours: rect(), advanceWidth: 640 });
  assert.equal(editedCount(edited), 1);
  assert.equal(glyphState(edited, cairo.glyphs.get(name)!).advanceWidth, 640);
  const reset = withoutOverride(edited, name);
  assert.equal(editedCount(reset), 0);
  assert.equal(glyphState(reset, cairo.glyphs.get(name)!).advanceWidth, cairo.glyphs.get(name)!.advanceWidth);
});

test('projects serialize, parse and reject garbage', () => {
  const doc = withOverride(createDocument(cairo), cairo.drawn[0], { contours: rect(), advanceWidth: 500 });
  const round = parseProject(serializeProject(doc));
  assert.equal(round.fontKey, doc.fontKey);
  assert.equal(Object.keys(round.overrides).length, 1);
  assert.equal(round.overrides[cairo.drawn[0]].contours.length, 1);
  assert.throws(() => parseProject('{'), /مشروع خط صالح/);
  assert.throws(() => parseProject('{"fontKey": 5}'), /مشروع|Project/);
  assert.throws(() => parseProject('{"fontKey":"x","metrics":{"unitsPerEm":0}}'), /upm/);
});

test('kerning pairs serialize and are pruned at zero', () => {
  const doc = setKerning(createDocument(cairo), 'a', 'b', -40);
  assert.equal(getKerning(doc, 'a', 'b'), -40);
  assert.equal(setKerning(doc, 'a', 'b', 0).kerning['a|b'], undefined);
  assert.equal(kerningReport(doc).count, 1);
  assert.equal(kerningReport(doc).pairs[0].value, -40);
});

test('local project storage round-trips through a stub Storage', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  } as unknown as Storage;
  let list = saveProjectToList([], 'My font', createDocument(cairo));
  assert.equal(writeStoredProjects(list, storage), true);
  list = readStoredProjects(storage);
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'My font');
  assert.ok(describeDocument(list[0].document).includes('upm'));
  writeStoredProjects([], storage);
  assert.deepEqual(readStoredProjects(storage), []);
});

/* ------------------------------------------------------------------ export */

test('editing a glyph then exporting keeps every table and the new outline', () => {
  const doc = withOverride(createDocument(cairo), cairo.byUnicode.get(0x0628)!, {
    contours: rect(),
    advanceWidth: 700,
  });
  const result = exportFont(cairo, doc);
  assert.equal(result.format, 'truetype');
  assert.ok(result.fileName.endsWith('.ttf'));
  const reparsed = opentype.parse(result.buffer);
  assert.equal(reparsed.glyphs.length, cairo.parsed.glyphs.length);
  assert.ok(reparsed.tables.gsub, 'GSUB survives');
  assert.ok(reparsed.tables.gpos, 'GPOS survives');
  const edited = reparsed.charToGlyph('ب');
  assert.equal(edited.advanceWidth, 700);
  assert.ok(edited.path.commands.length >= 4);
  const before = readTableDirectory(cairo.buffer).tables;
  const after = readTableDirectory(result.buffer).tables;
  for (const tag of before.keys()) assert.ok(after.has(tag), `table ${tag} preserved`);
});

test('export works for all three bundled fonts and does not mutate the source', () => {
  for (const font of [cairo, inter, amiri]) {
    const name = font.drawn[0];
    const before = font.parsed.glyphs.get(font.nameIndex.get(name)!)!.advanceWidth;
    const doc = withOverride(createDocument(font), name, { contours: rect(), advanceWidth: before + 111 });
    const result = exportFont(font, doc);
    assert.ok(result.bytes > 1000);
    const reparsed = opentype.parse(result.buffer);
    assert.ok(reparsed.glyphs.length >= font.parsed.glyphs.length);
    assert.equal(font.parsed.glyphs.get(font.nameIndex.get(name)!)!.advanceWidth, before);
  }
});

test('ttf writer encodes points and rebuilds the sfnt directory', () => {
  assert.equal(canPatch(cairo), true);
  const bytes = encodeSimpleGlyph(rect());
  assert.ok(bytes.length > 20);
  const view = new DataView(bytes.buffer);
  assert.equal(view.getInt16(0), 1); // one contour
  assert.equal(checksum(new Uint8Array([0, 0, 0, 0])), 0);
  const patched = patchTruetype(cairo, withOverride(createDocument(cairo), cairo.drawn[0], { contours: rect(), advanceWidth: 500 }));
  assert.equal(patched.patchedGlyphs, 1);
  assert.ok(readTableDirectory(patched.buffer).tables.get('glyf')!.length > 0);
  const reparsed = loadFont(patched.buffer, 'patched.ttf');
  assert.equal(reparsed.parsed.glyphs.length, cairo.parsed.glyphs.length);
});

test('SVG preview escapes content and keeps direction', () => {
  const svg = previewSvg({ text: '<b>A&B</b>', size: 40, color: '#000', background: '#fff', script: 'latin' }, 'Font, sans');
  assert.ok(svg.includes('&lt;b&gt;'));
  assert.ok(!svg.includes('<b>'));
  assert.ok(svg.includes('direction="ltr"'));
  const rtl = previewSvg({ text: 'بسم', size: 40, color: '#000', background: '#fff', script: 'arabic' }, 'Font');
  assert.ok(rtl.includes('direction="rtl"'));
  assert.equal(escapeXml(`a'b"c`), 'a&apos;b&quot;c');
});

/* ------------------------------------------------------------------ kerning */

test('kerning suggestions use the real side bearings', () => {
  const beh = cairo.glyphs.get(cairo.byUnicode.get(0x0628)!)!;
  const meem = cairo.glyphs.get(cairo.byUnicode.get(0x0645)!)!;
  const suggestion = suggestKerning({ shape: beh, advance: beh.advanceWidth }, { shape: meem }, 1000);
  assert.ok(Number.isFinite(suggestion.suggested));
  assert.equal(targetGapFor(1000), 60);
  assert.equal(pairGap({ shape: beh, advance: beh.advanceWidth }, { shape: meem }, 0) >= 0, true);
  const pairs = autoPairs([beh, meem], 1000, createDocument(cairo), 4);
  assert.ok(Array.isArray(pairs));
  assert.ok(pairs.length <= 4);
});

/* ------------------------------------------------------------------ library */

test('library entries resolve to bundled files and report real checks', () => {
  assert.equal(LIBRARY.length, 3);
  for (const entry of LIBRARY) {
    assert.ok(fs.existsSync(fontPath(entry.file)), entry.file);
    assert.ok(fs.existsSync(path.join(here, '..', 'assets', 'fonts', entry.licenceFile)), entry.licenceFile);
    assert.ok(urlFor(entry.id)?.includes(entry.file));
  }
  const checks = fidelityReport(cairo, 0, 0);
  assert.ok(checks.some((check) => check.id === 'outlines' && check.status === 'pass'));
  assert.ok(checks.some((check) => check.id === 'arabic-forms' && check.status === 'pass'));
  const score = reportScore(checks);
  assert.ok(score > 0 && score <= 100);
  const failing = reportScore([{ id: 'x', ar: '', en: '', status: 'fail', detailAr: '', detailEn: '' }]);
  assert.equal(failing, 0);
});

/* ------------------------------------------------------------------ naming */

test('arabic names, search and glyph filters work', () => {
  const index = buildIndex(cairo);
  const beh = index.find((entry) => entry.unicode === 0x0628)!;
  assert.equal(arabicNameFor(0x0628), 'باء');
  assert.equal(displayName(beh, 'ar'), 'باء');
  assert.equal(unicodeHex(0x0628), 'U+0628');
  assert.ok(matchesQuery(beh, 'باء'));
  assert.ok(matchesQuery(beh, 'uni0628'));
  assert.ok(matchesQuery(beh, 'U+0628'));
  assert.ok(matchesQuery(beh, ''));
  assert.ok(!matchesQuery(beh, 'zzzz'));

  const arabicOnly = filterGlyphs(index, 'arabic', 'all', '', new Set());
  assert.ok(arabicOnly.every((entry) => entry.script === 'arabic'));
  const drawn = filterGlyphs(index, 'arabic', 'drawn', '', new Set([beh.name]));
  assert.deepEqual(drawn.map((entry) => entry.name), [beh.name]);
  const latin = filterGlyphs(buildIndex(inter), 'latin', 'digits', '', new Set());
  assert.ok(latin.every((entry) => entry.unicode != null && entry.unicode >= 0x30 && entry.unicode <= 0x39));
  assert.ok(GLYPH_GROUPS.some((group) => group.id === 'all'));

  const taken = new Set(['uni0628']);
  assert.equal(glyphNameFor(0x0628, taken), 'uni0628.1');
  assert.equal(glyphNameFor(0x0629, taken), 'uni0629');
});

/* ------------------------------------------------------------------ reducer */

test('the studio reducer keeps document and history in sync', () => {
  let state = initialState(createDocument(cairo));
  assert.equal(state.doc.family, 'Cairo');
  const name = cairo.drawn[0];
  state = reduce(state, { type: 'contours', name, contours: rect(), labelAr: 'حركة', labelEn: 'Move' });
  assert.equal(state.edited.length, 1);
  assert.equal(state.dirty, true);
  state = reduce(state, { type: 'undo' });
  assert.equal(state.edited.length, 0);
  state = reduce(state, { type: 'redo' });
  assert.equal(state.edited.length, 1);
  state = reduce(state, { type: 'kerning', left: 'a', right: 'b', value: -30 });
  assert.equal(state.doc.kerning['a|b'], -30);
  state = reduce(state, { type: 'metrics', metrics: { xHeight: 520 }, labelAr: 'x', labelEn: 'x' });
  assert.equal(state.doc.metrics.xHeight, 520);
  state = reduce(state, { type: 'zoom', value: 100 });
  assert.equal(state.zoom, 8);
  state = reduce(state, { type: 'zoom', value: 0 });
  assert.equal(state.zoom, 0.2);
  state = reduce(state, { type: 'tool', value: 'pen' });
  assert.equal(state.tool, 'pen');
  state = reduce(state, { type: 'resetGlyph', name });
  assert.equal(state.edited.length, 0);
  state = reduce(state, { type: 'saved', count: 3 });
  assert.equal(state.dirty, false);
  assert.equal(state.savedProjects, 3);
});
