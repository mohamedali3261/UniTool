import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { resolvePhysicalKey } from '../src/app/useShortcuts';
import { applyInstantAtsFix, evaluateAts, extractJobKeywords } from '../src/core/atsEngine';
import { buildPlainTextAtsResume } from '../src/core/exportEngine';
import { computeOnePageAdjustments, getPaperDimensions, paginateResume } from '../src/core/pagination';
import {
  deleteResumeRecord,
  loadSavedResumes,
  parseUtcvProject,
  saveResumeRecord,
  serializeUtcvProject,
} from '../src/core/storage';
import {
  applyTemplatePreservingData,
  createBlankResume,
  createDefaultStarterResume,
  createResumeFromTemplate,
  CV_TEMPLATES,
} from '../src/data/templates';

test('physical keyboard resolver supports both Arabic and English keyboard layouts', () => {
  assert.equal(resolvePhysicalKey({ code: 'KeyZ', key: 'ئ' }), 'z');
  assert.equal(resolvePhysicalKey({ code: 'KeyY', key: 'غ' }), 'y');
  assert.equal(resolvePhysicalKey({ code: 'KeyS', key: 'س' }), 's');
  assert.equal(resolvePhysicalKey({ code: 'KeyZ', key: 'z' }), 'z');
});

test('template switching preserves 100% of user written data while updating layout and design', () => {
  const starter = createDefaultStarterResume('ar');
  starter.personal.fullName = 'محمد علي';
  starter.personal.jobTitle = 'مهندس برمجيات أول';
  starter.summary = 'ملخص خاص بالمستخدم لا يجب أن يضيع عند تبديل القالب.';
  starter.customSections = [
    {
      id: 'c1',
      title: 'الجوائز المهنية',
      visible: true,
      items: [{ id: 'i1', heading: 'جائزة الابتكار', subheading: 'القاهرة', date: '2025', description: '' }],
    },
  ];

  const bannerTemplate = CV_TEMPLATES.find((t) => t.id === 'modern-banner-creative')!;
  const switched = applyTemplatePreservingData(starter, bannerTemplate);

  assert.equal(switched.personal.fullName, 'محمد علي');
  assert.equal(switched.summary, 'ملخص خاص بالمستخدم لا يجب أن يضيع عند تبديل القالب.');
  assert.equal(switched.customSections.length, 1);
  assert.equal(switched.design.templateId, 'modern-banner-creative');
  assert.equal(switched.design.layoutMode, 'modern');
});

test('ATS evaluator, JD keyword matcher, and one-click fixes improve score deterministically', () => {
  const doc = createDefaultStarterResume('en');
  doc.design.layoutMode = 'modern';
  doc.design.modernVariant = 'sidebar';
  doc.design.skillDisplay = 'bars';
  doc.personal.photoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0ioAAAAASUVORK5CYII=';
  doc.personal.showPhoto = true;
  doc.jobDescription =
    'Looking for a Senior Engineer skilled in TypeScript, Kubernetes, GraphQL, Terraform, and CI/CD pipelines.';

  const keywords = extractJobKeywords(doc.jobDescription);
  assert.ok(keywords.some((k) => k.toLowerCase() === 'kubernetes'));
  assert.ok(keywords.some((k) => k.toLowerCase() === 'graphql'));

  const before = evaluateAts(doc);
  assert.ok(before.hasJobDescription);
  assert.ok(before.missingKeywords.length > 0);

  let fixed = applyInstantAtsFix(doc, 'switch-ats-mode');
  fixed = applyInstantAtsFix(fixed, 'hide-photo');
  fixed = applyInstantAtsFix(fixed, 'skills-comma');
  fixed = applyInstantAtsFix(fixed, 'add-missing-keywords');

  const after = evaluateAts(fixed);
  assert.ok(after.totalScore > before.totalScore);
  assert.equal(fixed.design.layoutMode, 'ats');
  assert.equal(fixed.personal.showPhoto, false);
  assert.equal(fixed.design.skillDisplay, 'comma');
});

test('A4 & Letter geometry, One-Page Fit scaling, and Multi-Page Academic pagination work accurately', () => {
  const a4 = getPaperDimensions('a4');
  const letter = getPaperDimensions('letter');
  assert.equal(a4.widthPx, 794);
  assert.equal(a4.heightPx, 1123);
  assert.equal(letter.widthPx, 816);
  assert.equal(letter.heightPx, 1056);

  const academicTpl = CV_TEMPLATES.find((t) => t.id === 'academic-multipage')!;
  const longDoc = createResumeFromTemplate(academicTpl, 'ar');
  // Add extra roles so multi-page splitter spans >= 2 sheets
  longDoc.experience = [
    ...longDoc.experience,
    ...longDoc.experience.map((e, i) => ({ ...e, id: `extra-exp-${i}` })),
    ...longDoc.experience.map((e, i) => ({ ...e, id: `extra-exp-b-${i}` })),
  ];
  longDoc.design.layoutMode = 'detailed';

  const multiPages = paginateResume(longDoc);
  assert.ok(multiPages.length >= 2);
  assert.equal(multiPages[0].includeHeader, true);
  assert.equal(multiPages[1].includeHeader, false);

  // Switching to one-page mode forces single sheet + compacted adjustments
  longDoc.design.layoutMode = 'one-page';
  const onePageSheets = paginateResume(longDoc);
  assert.equal(onePageSheets.length, 1);
  const adj = computeOnePageAdjustments(longDoc);
  assert.ok(adj.effectiveFontScale <= longDoc.design.fontScale);
});

test('UTCV project export/import and IndexedDB CRUD round-trip safely', async () => {
  Object.defineProperty(globalThis, 'indexedDB', { value: new IDBFactory(), configurable: true });

  const blank = createBlankResume('ar');
  blank.title = 'سيرة تجريبية للحفظ';
  blank.personal.fullName = 'سارة محمود';

  const savedOk = await saveResumeRecord(blank);
  assert.equal(savedOk, true);

  const loaded = await loadSavedResumes();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].personal.fullName, 'سارة محمود');

  const rawJson = serializeUtcvProject(loaded[0]);
  const parsed = parseUtcvProject(rawJson);
  assert.equal(parsed.title, 'سيرة تجريبية للحفظ');
  assert.equal(parsed.personal.fullName, 'سارة محمود');

  const plainText = buildPlainTextAtsResume(parsed);
  assert.ok(plainText.includes('سارة محمود'));

  assert.throws(() => parseUtcvProject('{"format":"wrong"}'));

  await deleteResumeRecord(blank.id);
  const afterDelete = await loadSavedResumes();
  assert.equal(afterDelete.length, 0);
});
