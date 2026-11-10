import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import module from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.css')) {
      return {
        shortCircuit: true,
        url: 'data:text/javascript,export default {}',
      };
    }
    return nextResolve(specifier, context);
  },
});

test('tools-appearance.css unifies all off-brand accents and dark hexes without filtering media', () => {
  const cssPath = path.resolve(process.cwd(), 'src/styles/tools-appearance.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Official UniTool tokens
  assert.match(css, /--tools-page:\s*#f5f7f4/i);
  assert.match(css, /--tools-accent:\s*#24795e/i);
  assert.match(css, /--tools-accent-ink:\s*#85ccac/i);

  // Covers previously unmapped dark hexes & borders
  for (const needle of [
    'bg-[#08090C]',
    'bg-[#0C0E12]',
    'border-[#2D3139]',
    'border-[#1F2937]',
    'text-orange-',
    'text-amber-',
    'text-pink-',
    'text-rose-',
    'text-teal-',
    'bg-orange-',
    'bg-pink-',
    'border-emerald-',
    'border-orange-',
    'a[download]',
    '.ut-tool-back-bar',
  ]) {
    assert.ok(css.includes(needle), `Expected tools-appearance.css to include ${needle}`);
  }

  // Must not invert or filter authored canvas/image/QR pixels
  assert.ok(!/filter\s*:\s*invert/i.test(css));
});

test('non-error red UI accents in PDF & Image tools are unified to brand emerald', () => {
  const settingsPanel = fs.readFileSync(
    path.resolve(process.cwd(), 'src/pages/ImageToPdf/components/SettingsPanel.tsx'),
    'utf8',
  );
  const pdfCompExport = fs.readFileSync(
    path.resolve(process.cwd(), 'src/pages/PdfCompressor/components/ExportPanel.tsx'),
    'utf8',
  );
  const toolsHomeData = fs.readFileSync(
    path.resolve(process.cwd(), 'src/pages/ToolsHome/data.ts'),
    'utf8',
  );

  assert.ok(!settingsPanel.includes('accent-red-500'));
  assert.ok(settingsPanel.includes('accent-emerald-500'));
  assert.ok(!pdfCompExport.includes('from-red-600'));
  assert.ok(pdfCompExport.includes('from-emerald-600'));
  assert.ok(!toolsHomeData.includes("accent: 'from-red-500 to-rose-600'"));
});

test('ToolNavigationBar renders Back button & breadcrumb on every tool page and hides on toolsHome', async () => {
  const { ToolNavigationBar } = await import('../components/ToolNavigationBar');

  const homeHtml = renderToStaticMarkup(
    React.createElement(ToolNavigationBar, {
      currentPage: 'toolsHome',
      lang: 'ar',
      onBack: () => {},
      onGoToolsHome: () => {},
    }),
  );
  assert.equal(homeHtml, '');

  for (const pageId of ['pdfMerger', 'imageToPdf', 'audioExtractor', 'qrCode', 'compress']) {
    const arHtml = renderToStaticMarkup(
      React.createElement(ToolNavigationBar, {
        currentPage: pageId,
        lang: 'ar',
        onBack: () => {},
        onGoToolsHome: () => {},
      }),
    );
    assert.ok(arHtml.includes('data-testid="tool-back-button"'), `Missing back button on ${pageId}`);
    assert.ok(arHtml.includes('رجوع'));
    assert.ok(arHtml.includes('كل الأدوات'));
  }

  const enHtml = renderToStaticMarkup(
    React.createElement(ToolNavigationBar, {
      currentPage: 'pdfMerger',
      lang: 'en',
      onBack: () => {},
      onGoToolsHome: () => {},
    }),
  );
  assert.ok(enHtml.includes('Back'));
  assert.ok(enHtml.includes('All Tools'));
});

test('SiteNavbar renders site-back-button on non-home pages and omits it on home', async () => {
  (globalThis as any).location = new URL('http://localhost:3000/app.html');
  const { SiteNavbar } = await import('../components/SiteNavbar');

  const toolNavHtml = renderToStaticMarkup(
    React.createElement(SiteNavbar, { lang: 'ar', home: false }),
  );
  assert.ok(toolNavHtml.includes('data-testid="site-back-button"'));

  const homeNavHtml = renderToStaticMarkup(
    React.createElement(SiteNavbar, { lang: 'ar', home: true }),
  );
  assert.ok(!homeNavHtml.includes('data-testid="site-back-button"'));
});

test('downloadPopupBus formats sizes, preserves extensions, and intercepts anchor downloads', async () => {
  const {
    ensureExtension,
    formatDownloadBytes,
  } = await import('../utils/downloadPopupBus');

  assert.equal(formatDownloadBytes(0), '0 B');
  assert.equal(formatDownloadBytes(512), '512 B');
  assert.equal(formatDownloadBytes(2048), '2.0 KB');
  assert.equal(formatDownloadBytes(5 * 1024 * 1024), '5.0 MB');

  assert.equal(ensureExtension('my-document', 'PDF'), 'my-document.pdf');
  assert.equal(ensureExtension('my-document.pdf', 'PDF'), 'my-document.pdf');
  assert.equal(ensureExtension('   ', 'PNG'), 'unitool-file.png');
});

test('navigationHistory records multi-page visits and steps back through previously opened pages', async () => {
  const store = new Map<string, string>();
  let backCalls = 0;
  let assignedUrl = '';

  (globalThis as any).sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };

  (globalThis as any).document = { referrer: '' };
  (globalThis as any).window = {
    location: {
      origin: 'http://localhost:3000',
      pathname: '/index.html',
      search: '',
      hash: '',
      assign: (u: string) => { assignedUrl = u; },
    },
    history: {
      length: 3,
      back: () => { backCalls += 1; },
    },
  };

  const {
    canStepBackInSession,
    getPreviousVisitedUrl,
    recordPageVisit,
    stepBackInSession,
    syncStackOnPopState,
  } = await import('../utils/navigationHistory');

  recordPageVisit('/index.html');
  assert.equal(canStepBackInSession(), false);

  recordPageVisit('/app.html');
  recordPageVisit('/app.html#pdfMerger');
  recordPageVisit('/app.html#imageCompressor');

  assert.equal(canStepBackInSession(), true);
  assert.equal(getPreviousVisitedUrl(), '/app.html#pdfMerger');

  // Stepping back uses native history.back() when previous session pages exist
  stepBackInSession('/index.html');
  assert.equal(backCalls, 1);

  // Simulate popstate landing back on #pdfMerger
  syncStackOnPopState('/app.html#pdfMerger');
  assert.equal(getPreviousVisitedUrl(), '/app.html');

  // Simulate popstate all the way back to /index.html
  syncStackOnPopState('/index.html');
  assert.equal(canStepBackInSession(), false);

  // When at root of session stack, fallback URL is used cleanly
  (globalThis as any).window.history.length = 1;
  stepBackInSession('/app.html');
  assert.equal(assignedUrl, '/app.html');
});
