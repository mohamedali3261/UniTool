/**
 * Site-integration tests: the new page is wired into every entry point and the
 * studio keeps the house rules (RTL, brand green, no purple, no navbar back btn).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('the page is registered in the shared navigation and the build', () => {
  assert.ok(read('src/config/sitePages.ts').includes('/font-lab/'));
  assert.ok(read('src/components/navbarSections.ts').includes('/font-lab/'));
  assert.ok(read('vite.config.ts').includes("font-lab/index.html"));
  assert.ok(read('src/pages/ToolsHome/data.ts').includes("href: '/font-lab/'"));
  assert.ok(fs.existsSync(path.join(root, 'font-lab/index.html')));
  assert.ok(fs.existsSync(path.join(root, 'font-lab/main.tsx')));
});

test('the navbar section list only names pages that exist in sitePages', async () => {
  const { navbarSections } = await import('../../src/components/navbarSections');
  const hrefs = navbarSections.flatMap((section) => section.pages.map((page) => page.href));
  assert.ok(hrefs.includes('/font-lab/'));
  for (const section of navbarSections) {
    assert.equal(section.pages.length, section.hrefs.length);
  }
});

test('every section of the studio lives in its own folder and file', () => {
  const expected = [
    'topbar/TopBar.tsx',
    'glyphrail/GlyphRail.tsx',
    'inspector/Inspector.tsx',
    'library/FontLibrary.tsx',
    'preview/PreviewDesk.tsx',
    'metrics/MetricsPanel.tsx',
    'shapes/ShapeLibrary.tsx',
    'kerning/KerningStudio.tsx',
    'export/ExportPanel.tsx',
    'history/HistoryPanel.tsx',
    'projects/ProjectsPanel.tsx',
    'checks/FidelityPanel.tsx',
    'docs/DocsPanel.tsx',
    'shortcuts/ShortcutBar.tsx',
  ];
  for (const file of expected) {
    const full = path.join(root, 'font-lab/sections', file);
    assert.ok(fs.existsSync(full), `missing section ${file}`);
    assert.ok(fs.statSync(full).size > 400, `${file} looks empty`);
  }
  // the stage is its own folder too
  assert.ok(fs.existsSync(path.join(root, 'font-lab/canvas/stage/OutlineStage.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'font-lab/canvas/stage/StageOverlay.tsx')));
});

test('the studio is RTL-first, brand green and free of purple', () => {
  const html = read('font-lab/index.html');
  assert.ok(html.includes('lang="ar"'));
  assert.ok(html.includes('dir="rtl"'));
  const css = read('font-lab/styles/lab.css');
  assert.ok(css.includes('#24795e'), 'brand green');
  assert.ok(!/purple|violet|indigo|fuchsia/i.test(css), 'no purple family');
  const files = fs.readdirSync(path.join(root, 'font-lab'), { recursive: true }) as string[];
  for (const file of files) {
    if (!/\.(tsx?|css)$/.test(file)) continue;
    const content = fs.readFileSync(path.join(root, 'font-lab', file), 'utf8');
    assert.ok(!/(purple|violet|fuchsia)-\d{3}/.test(content), `purple utility in ${file}`);
  }
});

test('the bundled fonts keep their licences next to them', () => {
  const fonts = fs.readdirSync(path.join(root, 'font-lab/assets/fonts'));
  assert.ok(fonts.some((file) => file.endsWith('.ttf')));
  assert.ok(fonts.includes('Cairo-OFL.txt'));
  assert.ok(fonts.includes('Amiri-OFL.txt'));
  assert.ok(fonts.includes('LICENSE_FONT'));
  for (const file of fonts.filter((name) => name.endsWith('.ttf'))) {
    const size = fs.statSync(path.join(root, 'font-lab/assets/fonts', file)).size;
    assert.ok(size > 10000, `${file} is a real font file`);
  }
});

test('the test scripts are wired for local runs', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['test:font-lab'], 'tsx --test font-lab/tests/*.test.ts font-lab/tests/*.test.tsx');
  assert.ok(pkg.scripts['test:font-lab:browser'].includes('font-lab/tests/playwright.config.ts'));
});
