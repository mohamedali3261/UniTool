import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStarterLesson,
  parseLessonFile,
  serializeLessonFile,
} from '../src/core/storage';
import {
  getElementBounds,
  hitTestElement,
  translateElement,
} from '../src/core/boardRenderer';
import { SUBJECT_TEMPLATES } from '../src/data/subjectTemplates';
import { SURFACE_PALETTES } from '../src/data/boardModes';
import { FORMULA_PRESETS } from '../src/data/mathScienceSymbols';

test('lesson file serializes and round-trips slides, surface, grid, and elements safely', () => {
  const lesson = createStarterLesson('ar');
  lesson.title = 'حصة الجبر';
  lesson.slides[0].surface = 'chalk-green';
  lesson.slides[0].grid = 'axes';
  lesson.slides[0].elements.push({
    id: 'st-1',
    kind: 'stroke',
    style: 'pen',
    color: '#ffffff',
    size: 4,
    points: [
      { x: 100, y: 120 },
      { x: 220, y: 240 },
    ],
  });

  const raw = serializeLessonFile(lesson);
  const restored = parseLessonFile(raw);
  assert.equal(restored.title, 'حصة الجبر');
  assert.equal(restored.slides.length, 1);
  assert.equal(restored.slides[0].surface, 'chalk-green');
  assert.equal(restored.slides[0].grid, 'axes');
  assert.equal(restored.slides[0].elements.length, 1);
});

test('hitTestElement and translateElement accurately locate and move strokes and cards', () => {
  const stroke = {
    id: 's1',
    kind: 'stroke' as const,
    style: 'pen' as const,
    color: '#182620',
    size: 5,
    points: [
      { x: 50, y: 60 },
      { x: 150, y: 60 },
    ],
  };
  const sticky = {
    id: 'n1',
    kind: 'sticky' as const,
    x: 300,
    y: 200,
    w: 240,
    h: 120,
    text: 'ملاحظة هامة',
    color: '#182620',
    bgColor: '#fef3c7',
    fontSize: 18,
  };

  const hit1 = hitTestElement([stroke, sticky], 52, 61);
  assert.equal(hit1?.id, 's1');

  const hit2 = hitTestElement([stroke, sticky], 350, 240);
  assert.equal(hit2?.id, 'n1');

  const moved = translateElement(sticky, 40, -20);
  const bounds = getElementBounds(moved);
  assert.equal(bounds.x, 340);
  assert.equal(bounds.y, 180);
});

test('all subject templates and surface modes provide complete bilingual teaching setups', () => {
  assert.ok(SUBJECT_TEMPLATES.length >= 8);
  for (const tpl of SUBJECT_TEMPLATES) {
    assert.ok(tpl.titleAr.length > 3 && tpl.titleEn.length > 3);
    assert.ok(SURFACE_PALETTES[tpl.surface]);
    const arEls = tpl.buildElements(true);
    const enEls = tpl.buildElements(false);
    assert.ok(arEls.length >= 2);
    assert.ok(enEls.length >= 2);
  }
  assert.ok(FORMULA_PRESETS.length >= 10);
});
