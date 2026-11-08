import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
  CV_TEMPLATE_MODULES,
  resolveTemplateModuleForDoc,
} from '../src/data/templates';
import {
  buildImageFilterCss,
  buildImageTransformCss,
  createCanvasBadgeElement,
  createCanvasDividerElement,
  createCanvasIconElement,
  createCanvasImageElement,
  createCanvasRatingElement,
  createCanvasShapeElement,
  createCanvasTextElement,
  DEFAULT_IMAGE_FILTERS,
  getImageShapeFrameStyle,
} from '../src/pages/editor/canvas/canvasDefaults';

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

test('every built-in CV template lives in its own separate file, has a unique visual architecture, and ATS Checker page is removed', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const templatesDir = path.resolve(__dirname, '../src/templates');
  const atsCheckerDir = path.resolve(__dirname, '../src/pages/ats-checker');

  assert.equal(fs.existsSync(atsCheckerDir), false, 'ATS Checker page directory must be removed');

  const standaloneTemplateFiles = [
    'atsStandard.tsx',
    'modernEmeraldExec.tsx',
    'techOnePage.tsx',
    'royalGoldExecutive.tsx',
    'creativeStudioSplit.tsx',
    'financeCorporate.tsx',
    'modernBannerCreative.tsx',
    'medicalClinicalClean.tsx',
    'infographicTimelinePro.tsx',
    'editorialMagazineSerif.tsx',
    'compactStartupGrid.tsx',
    'academicMultipage.tsx',
    'freshGradStarter.tsx',
    'minimalistNordic.tsx',
  ];

  for (const filename of standaloneTemplateFiles) {
    const fullPath = path.join(templatesDir, filename);
    assert.ok(fs.existsSync(fullPath), `Expected standalone template file ${filename} to exist`);
  }

  assert.equal(CV_TEMPLATES.length, 14);
  assert.equal(CV_TEMPLATE_MODULES.length, 14);

  const uniqueVisualStyles = new Set(CV_TEMPLATES.map((t) => t.design.visualStyle));
  assert.equal(uniqueVisualStyles.size, 14, 'Every built-in template must have a distinct visualStyle');

  const uniqueTagsEn = new Set(CV_TEMPLATES.map((t) => t.structureTagEn));
  assert.equal(uniqueTagsEn.size, 14, 'Every built-in template must have a distinct structural tag');

  for (const tpl of CV_TEMPLATES) {
    const doc = createResumeFromTemplate(tpl, 'ar');
    const resolvedMod = resolveTemplateModuleForDoc(doc);
    assert.equal(resolvedMod.preset.id, tpl.id);
  }
});

test('interactive canvas elements, image filters, shapes, and block overrides serialize cleanly', () => {
  const doc = createDefaultStarterResume('ar');
  const txtEl = createCanvasTextElement('heading', {
    paperLang: 'ar',
    paperDir: 'rtl',
    fontFamily: 'Cairo, sans-serif',
    accentColor: '#24795e',
    pageIndex: 0,
  });
  const imgEl = createCanvasImageElement(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    { name: 'صورة توقيع', shape: 'hexagon', accentColor: '#24795e', pageIndex: 0 },
  );
  const shapeEl = createCanvasShapeElement('hexagon', { accentColor: '#24795e', pageIndex: 0 });
  const divEl = createCanvasDividerElement('double', { accentColor: '#24795e', pageIndex: 0 });
  const badgeEl = createCanvasBadgeElement({
    paperLang: 'ar',
    paperDir: 'rtl',
    fontFamily: 'Cairo, sans-serif',
    accentColor: '#24795e',
    pageIndex: 0,
  });
  const ratingEl = createCanvasRatingElement({ accentColor: '#24795e', pageIndex: 0 });
  const iconEl = createCanvasIconElement('award', { accentColor: '#24795e', pageIndex: 0 });

  imgEl.imageFilters = {
    ...DEFAULT_IMAGE_FILTERS,
    brightness: 112,
    contrast: 108,
    grayscale: 25,
    zoom: 1.35,
    flipX: true,
  };

  doc.canvasElements = [txtEl, imgEl, shapeEl, divEl, badgeEl, ratingEl, iconEl];
  doc.blockStyles = {
    header: { dx: 14, dy: -6, bgColor: '#f0fdf4', borderRadius: 8 },
    'section:experience': { dx: 0, dy: 12, padding: 10 },
  };
  doc.personal.photoShape = 'diamond';

  const filterCss = buildImageFilterCss(imgEl.imageFilters);
  assert.ok(filterCss.includes('brightness(112%)'));
  assert.ok(filterCss.includes('grayscale(25%)'));

  const transformCss = buildImageTransformCss(imgEl.imageFilters);
  assert.ok(transformCss.includes('scale(-1.35, 1.35)'));

  const hexFrame = getImageShapeFrameStyle('hexagon');
  assert.ok(String(hexFrame.clipPath || '').includes('polygon'));

  const json = serializeUtcvProject(doc);
  const roundTripped = parseUtcvProject(json);
  assert.equal(roundTripped.canvasElements?.length, 7);
  assert.equal(roundTripped.canvasElements?.[1].imageShape, 'hexagon');
  assert.equal(roundTripped.canvasElements?.[1].imageFilters?.zoom, 1.35);
  assert.equal(roundTripped.blockStyles?.header?.dx, 14);
  assert.equal(roundTripped.personal.photoShape, 'diamond');
});
