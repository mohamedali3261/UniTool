import { test, expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { toolCategories } from '../pages/ToolsHome/data';
import { TOOLS_THEME_KEY } from '../hooks/useToolsAppearance';

const routes = ['toolsHome', ...new Set(toolCategories.flatMap(category => category.tools.filter(tool => !tool.href).map(tool => tool.id)))];

function navySurfaces() {
  return [...document.querySelectorAll<HTMLElement>('.tools-app-shell *')].flatMap(element => {
    if (element.closest('canvas,video,img,svg,[data-theme-art]')) return [];
    const bounds = element.getBoundingClientRect();
    if (bounds.width < 60 || bounds.height < 20 || bounds.top >= innerHeight || bounds.bottom <= 0) return [];
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return [];
    const rgba = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
    return rgba && (rgba[3] ?? 1) > .5 && rgba[2] > rgba[0] + 9 && rgba[2] > rgba[1] + 4 && rgba[0] < 90
      ? [{ classes: element.className, background: style.backgroundColor }] : [];
  });
}

for (const mobile of [false, true]) {
  test.describe(mobile ? 'mobile' : 'desktop', () => {
    test.use({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });
    for (const route of routes) test(`${route}: neutral night, light day and saved toggle`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.addInitScript(key => localStorage.setItem(key, 'dark'), TOOLS_THEME_KEY);
      await page.goto(`/app.html#${route}`);
      const toggle = page.getByTestId('tools-theme-toggle');
      await expect(toggle).toBeVisible();
      await expect(page.locator('.tools-app-shell')).toHaveCSS('background-color', 'rgb(16, 16, 16)');
      await expect(page.locator('.ut-site-nav')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
      await expect.poll(() => page.evaluate(navySurfaces)).toEqual([]);
      if (route === 'toolsHome') {
        await expect(page.locator('[data-tool-card]').first()).toHaveCSS('background-color', 'rgb(32, 32, 32)');
        await page.waitForTimeout(1200);
        await page.screenshot({ path: testInfo.outputPath('night.png') });
      }
      await toggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-tools-theme', 'light');
      await expect(page.locator('.tools-app-shell')).toHaveCSS('background-color', 'rgb(245, 247, 244)');
      await expect(page.locator('.ut-site-nav')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      expect(await page.evaluate(key => localStorage.getItem(key), TOOLS_THEME_KEY)).toBe('light');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
      if (route === 'toolsHome') {
        await expect(page.locator('[data-tool-card]').first()).toHaveCSS('background-color', 'rgb(245, 247, 244)');
        await page.screenshot({ path: testInfo.outputPath('day.png') });
      }
    });
  });
}

test('catalog navigation, keyboard toggle, persistence and independent studio preferences', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('theme-test-initialized')) {
      localStorage.setItem('theme-test-initialized', 'yes');
      localStorage.setItem('designcraft_theme_v1', 'dark');
      localStorage.setItem('unitool-lang', 'en');
    }
  });
  await page.goto('/app.html');
  const toggle = page.getByTestId('tools-theme-toggle');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-tools-theme', 'light');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('designcraft_theme_v1'))).toBe('dark');
  await page.getByPlaceholder('Search for a tool...', {exact: false}).fill('QR Generator');
  const card = page.locator('[data-tool-card]').filter({ has: page.getByRole('heading', { name: 'QR Generator', exact: true }) });
  await expect(card).toHaveCount(1);
  await card.click();
  await expect(page).toHaveURL(/#qrCode$/);
  await expect(page.getByRole('heading', { name: 'QR Code Generator', exact: true })).toBeVisible();
});

test('blocked storage still allows language and theme controls', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem']) Object.defineProperty(Storage.prototype, method, { configurable: true, value: () => { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('/app.html#toolsHome');
  const toggle = page.getByTestId('tools-theme-toggle');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-tools-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'All Tools', exact: true })).toBeVisible();
});

test('QR pixels and white paper stay unchanged across themes; export works', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('unitool-lang', 'en'));
  await page.goto('/app.html#qrCode');
  await expect(page.getByTestId('tools-theme-toggle')).toBeVisible();
  await page.getByPlaceholder('https://example.com', {exact:true}).fill('https://example.com/theme-test');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(() => canvas.evaluate(node => (node as HTMLCanvasElement).width)).toBeGreaterThan(0);
  await page.waitForTimeout(300);
  const pixels = await canvas.evaluate(node => (node as HTMLCanvasElement).toDataURL());
  await page.getByTestId('tools-theme-toggle').click();
  await expect(canvas.locator('..')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await canvas.evaluate(node => (node as HTMLCanvasElement).toDataURL())).toBe(pixels);
  const png = page.getByRole('button', { name: 'Download PNG', exact: true });
  await expect(png).toBeEnabled();
  await expect(png).toHaveCSS('background-color', 'rgb(36, 121, 94)');
  await png.hover();
  await expect(png).toHaveCSS('background-color', 'rgb(29, 99, 75)');
  await page.mouse.down();
  await expect(png).toHaveCSS('background-color', 'rgb(23, 78, 58)');
  const download = page.waitForEvent('download');
  await page.mouse.up();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
});

test('PDF merging still produces a valid two-page PDF with green action styling', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('unitool-lang', 'en'));
  await page.goto('/app.html#pdfMerger');
  await expect(page.getByTestId('tools-theme-toggle')).toBeVisible();
  const pdf = await PDFDocument.create(); pdf.addPage([100, 100]);
  const buffer = Buffer.from(await pdf.save());
  await page.locator('input[type="file"]').setInputFiles([{ name: 'one.pdf', mimeType: 'application/pdf', buffer }, { name: 'two.pdf', mimeType: 'application/pdf', buffer }]);
  const merge = page.getByRole('button', { name: 'Merge 2 files', exact: true });
  await expect(merge).toBeEnabled();
  await expect(merge).toHaveCSS('background-color', 'rgb(36, 121, 94)');
  const download = page.waitForEvent('download'); await merge.click();
  const path = await (await download).path();
  expect((await PDFDocument.load(await readFile(path!))).getPageCount()).toBe(2);
});
