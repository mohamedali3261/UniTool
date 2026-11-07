import { test, expect } from '@playwright/test';
const pages = [
  { id: 'home', url: '/index.html', surface: '.home-page' },
  { id: 'excel', url: '/excel-studio/', surface: '.xs-app' },
  { id: 'cv', url: '/cv-studio/', surface: '.cv-studio-app' },
  { id: 'teacherBoard', url: '/teacher-board/', surface: '.tb-app' },
  { id: 'logo', url: '/logo-designer/', surface: '.ld-app' },
  { id: 'reader', url: '/the-audio-reader.html', surface: '.reader-app' },
  { id: 'svg', url: '/unitool-svg.html', surface: 'body' },
  { id: 'storage', url: '/storage.html', surface: '.storage-app' },
];
for (const mobile of [false, true]) test.describe(mobile ? 'mobile' : 'desktop', () => {
  test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });
  for (const entry of pages) test(`${entry.id}: day/night, persistence, neutral panels`, async ({ page }, info) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(String(error)));
    await page.addInitScript(() => { localStorage.setItem('logo-designer-tour','done'); });
    await page.goto(entry.url);
    const toggle = page.locator('[data-testid$="theme-toggle"]').first();
    await expect(toggle).toBeVisible();
    for (const mode of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-site-theme') !== mode) await toggle.click();
      await expect(page.locator(entry.surface)).toHaveCSS('background-color', mode === 'dark' ? 'rgb(16, 16, 16)' : 'rgb(245, 247, 244)');
      await expect(page.locator('.ut-site-nav')).toHaveCSS('background-color', mode === 'dark' ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)');
      if (entry.id === 'svg') await expect(page.frameLocator('iframe').locator('html')).toHaveAttribute('data-theme', mode === 'dark' ? 'nuit' : 'jour');
      if (entry.id === 'reader') await expect(page.locator('.reader-help-strip')).toHaveCSS('background-color', mode === 'dark' ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)');
      if (entry.id === 'excel' && mode === 'dark') await expect(page.locator('.xs-sidebar')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
      await page.screenshot({path: info.outputPath(`${mode}.png`)});
    }
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-site-theme', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
});

test('spreadsheet retains authored cell colors and values through every section', async ({ page }) => {
  await page.goto('/excel-studio/');
  const cell = page.locator('[data-ref="A2"]');
  await expect(cell).toBeVisible();
  const snapshot = await cell.evaluate(el => ({style:el.getAttribute('style'),text:el.textContent}));
  const toggle = page.getByTestId('site-theme-toggle'); await toggle.click();
  expect(await cell.evaluate(el => ({style:el.getAttribute('style'),text:el.textContent}))).toEqual(snapshot);
  for (const hash of ['functions','templates','analytics','editor']) {
    await page.goto(`/excel-studio/#${hash}`);
    await expect(page.getByTestId('site-theme-toggle')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-site-theme', 'dark');
    await expect(page.locator('.xs-sidebar')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
  }
});

test('logo native SVG artwork and project content do not change with appearance', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('logo-designer-tour','done'));
  await page.goto('/logo-designer/');
  const art = page.locator('.ld-artboard > svg');
  await expect(art).toBeVisible();
  // Selection guides/hit targets rescale when the viewport settles; only the
  // authored ProjectGraphic groups belong in this invariance assertion.
  const drawing = art.locator(':scope > g[opacity="1"]');
  const before = await drawing.evaluateAll(nodes => nodes.map(node => node.outerHTML));
  await page.getByTestId('site-theme-toggle').click();
  expect(await drawing.evaluateAll(nodes => nodes.map(node => node.outerHTML))).toEqual(before);
  await expect(page.locator('.ld-top-actions .ld-primary')).toHaveCSS('background-color', 'rgb(36, 121, 94)');
});

test('SVG inner settings sync back to header and untrusted messages are ignored', async ({ page }) => {
  await page.goto('/unitool-svg.html');
  const toggle = page.locator('[data-testid$="theme-toggle"]');
  await expect(toggle).toBeVisible();
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('html')).toHaveAttribute('data-theme','jour');
  // Settings writes its existing preference through the public reactive theme.
  const child = page.frames().find(f => f.url().includes('/unitool-svg-editor/index.html'))!;
  await child.evaluate(() => {
    // Native settings control is exercised below, not a fabricated parent message.
    const event = new MessageEvent('message',{origin:'https://untrusted.example',data:{type:'unitool-appearance-change',theme:'dark'}});
    window.dispatchEvent(event);
  });
  await expect(frame.locator('html')).toHaveAttribute('data-theme','jour');
  await frame.getByRole('button', {name: /الإعدادات|Settings|Réglages/i}).click();
  await frame.getByRole('radio', {name: /ليلي|Night|Nuit/i}).click();
  await expect(page.locator('html')).toHaveAttribute('data-site-theme','dark');
  await expect(toggle).toHaveAttribute('aria-pressed','true');
});

for (const entry of pages) test(`${entry.id}: blocked storage and keyboard theme toggle`, async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem','setItem']) Object.defineProperty(Storage.prototype,method,{configurable:true,value:()=>{throw new DOMException('Blocked','SecurityError');}});
  });
  await page.goto(entry.url);
  const toggle = page.locator('[data-testid$="theme-toggle"]').first(); await expect(toggle).toBeVisible();
  const previous = await page.locator('html').getAttribute('data-site-theme');
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-site-theme', previous === 'dark' ? 'light' : 'dark');
});

test('reader day/night and warm paper preserve Arabic text and settings', async ({ page }) => {
  await page.goto('/the-audio-reader.html');
  await page.locator('#create-new-book-btn').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input').fill('كتاب تجريبي');
  await dialog.locator('textarea').fill('نَصّ عَرَبِيّ للاختبار. نحافظ على الكلمات والتشكيل.');
  await dialog.getByRole('button', {name:'إنشاء الكتاب',exact:true}).click();
  const canvas = page.locator('#reader-text-canvas');
  await expect(canvas).toContainText('نَصّ عَرَبِيّ'.normalize('NFKC'));
  const content = await canvas.textContent();
  await page.getByTestId('site-theme-toggle').click();
  expect(await canvas.textContent()).toBe(content);
  await page.locator('nav button[title="إعدادات القراءة والمظهر"]').click();
  await page.getByRole('dialog').getByRole('button', {name: /ورق دافئ للقراءة/}).click();
  await page.keyboard.press('Escape');
  await expect(canvas).toHaveCSS('background-color','rgb(251, 244, 230)');
  await expect(page.locator('.reader-help-strip')).toHaveCSS('background-color','rgb(23, 23, 23)');
  expect(await canvas.textContent()).toBe(content);
  await page.reload();
  // New books reopen from the existing recent-documents list after reload.
  if (!await canvas.isVisible()) await page.getByText('كتاب تجريبي', {exact:true}).click();
  await expect(canvas).toHaveCSS('background-color','rgb(251, 244, 230)');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sawti_reader_settings_v1')!).theme)).toBe('sepia');
});

test('unified green arrow cursor and all companion cursor icons apply across site pages and themes', async ({ page }) => {
  for (const url of ['/index.html', '/app.html', '/designcraft.html', '/excel-studio/', '/cv-studio/', '/teacher-board/', '/logo-designer/', '/video-studio.html', '/storage.html', '/the-audio-reader.html', '/unitool-svg.html']) {
    await page.goto(url);
    await expect(page.locator('button:not(:disabled), a[href]').first()).toBeVisible();
    const cursors = await page.evaluate(() => {
      const body = getComputedStyle(document.body).cursor;
      const interactive = getComputedStyle(document.querySelector('button:not(:disabled), a[href]')!).cursor;
      return { body, interactive };
    });
    expect(cursors.body, `${url} default arrow`).toContain('data:image/svg+xml');
    expect(cursors.body, `${url} arrow hotspot`).toContain('4 4');
    expect(cursors.interactive, `${url} pointer companion`).toContain('data:image/svg+xml');
    expect(cursors.interactive, `${url} pointer hotspot`).toContain('8 2');
  }

  // Verify light (#24795e) vs dark (#85ccac) adaptation and all companion cursor tokens
  await page.goto('/index.html');
  const lightVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ut-cursor-default'));
  expect(lightVar.toLowerCase()).toContain('%2324795e');
  const companionStates = [
    'pointer', 'text', 'vertical-text', 'grab', 'grabbing', 'move', 'crosshair',
    'cell', 'ew-resize', 'ns-resize', 'nwse-resize', 'nesw-resize', 'col-resize',
    'row-resize', 'not-allowed', 'zoom-in', 'zoom-out', 'help', 'wait', 'progress', 'copy',
  ];
  const probeResults = await page.evaluate((states) => {
    return states.every((state) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(`--ut-cursor-${state}`);
      return val.includes('data:image/svg+xml');
    });
  }, companionStates);
  expect(probeResults).toBe(true);

  await page.getByTestId('site-theme-toggle').click();
  const darkVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ut-cursor-default'));
  expect(darkVar.toLowerCase()).toContain('%2385ccac');
});

