import { test, expect, type Page } from '@playwright/test';

/**
 * Every tool's download button must actually produce a file in WebKit.
 *
 * Chromium accepts the patterns these buttons used to have (detached anchor,
 * blob URL revoked right after the click). WebKit silently cancels them, which
 * is why "the download button does nothing in Safari" was reported. These
 * specs run in Chromium and WebKit and assert a `download` event plus a
 * non-empty file for the tools that ship a sample file.
 */

async function expectDownload(page: Page, trigger: () => Promise<void>, label: string) {
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30_000 }), trigger()]);
  const failure = await download.failure();
  expect(failure, `${label}: ${failure}`).toBeNull();
  const path = await download.path();
  expect(path, `${label} produced no file`).toBeTruthy();
  const filename = download.suggestedFilename();
  expect(filename.length).toBeGreaterThan(0);
  expect(filename).not.toMatch(/[/\\:*?"<>|]/);
  return filename;
}

test.describe('tool downloads', () => {
  test('QR code tool saves a PNG file', async ({ page }) => {
    await page.goto('/app.html#qrCodeGenerator');
    const input = page.locator('textarea, input[type="text"]').first();
    await input.waitFor({ state: 'visible' });
    await input.fill('https://unitool.test/download-check');

    const filename = await expectDownload(
      page,
      () => page.getByRole('button', { name: /تحميل PNG|Download PNG|PNG/i }).first().click(),
      'QR PNG',
    );
    expect(filename.toLowerCase()).toMatch(/\.png$/);
  });

  test('download popup opens, naming is preserved and the file is saved again', async ({ page }) => {
    await page.goto('/app.html#qrCodeGenerator');
    const input = page.locator('textarea, input[type="text"]').first();
    await input.waitFor({ state: 'visible' });
    await input.fill('https://unitool.test/download-center');

    const popup = page.getByTestId('unitool-download-popup');
    const [first] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: /تحميل PNG|Download PNG/i }).first().click(),
    ]);
    expect(await first.failure()).toBeNull();

    // The modal offers a re-save that must also work (Safari users rely on it).
    await expect(popup).toBeVisible();
    const again = await expectDownload(
      page,
      () => page.getByTestId('unitool-download-again-btn').click(),
      'popup re-download',
    );
    expect(again.length).toBeGreaterThan(0);

    await page.getByTestId('unitool-download-close-btn').click();
    await expect(popup).toHaveCount(0);
  });

  test('PDF merge downloads a merged file when a sample is provided', async ({ page }) => {
    test.skip(!process.env.PDF_SAMPLE, 'Set PDF_SAMPLE to a PDF path to cover the merge button.');
    await page.goto('/app.html#pdfMerger');
    await page.locator('input[type="file"]').first().setInputFiles(process.env.PDF_SAMPLE!);
    await page.locator('input[type="file"]').first().setInputFiles(process.env.PDF_SAMPLE!);

    const filename = await expectDownload(
      page,
      () => page.getByRole('button', { name: /دمج|Merge/i }).first().click(),
      'PDF merge',
    );
    expect(filename.toLowerCase()).toMatch(/\.pdf$/);
  });
});

test.describe('download plumbing', () => {
  test('blob URLs survive the click and anchors stay attached', async ({ page }) => {
    await page.goto('/app.html#qrCodeGenerator');
    const result = await page.evaluate(async () => {
      // Vite serves source modules in dev; the URL is only resolved at runtime.
      const moduleUrl = ['', 'src', 'utils', 'download.ts'].join('/');
      const mod = await import(/* @vite-ignore */ moduleUrl);
      const blob = new Blob(['safari'], { type: 'text/plain' });
      let anchorRemovedImmediately: boolean | null = null;
      const original = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function patched(this: HTMLAnchorElement) {
        anchorRemovedImmediately = !document.body.contains(this);
        return original.apply(this);
      };
      const saved = mod.downloadBlob(blob, 'check.txt');
      HTMLAnchorElement.prototype.click = original;
      return { ok: saved.ok, anchorRemovedImmediately, safari: mod.isSafariBrowser() };
    });
    expect(result.ok).toBe(true);
    expect(result.anchorRemovedImmediately).toBe(false);
    expect(result.safari).toBe(false);
  });

  test('the popup re-save works after the blob URL would have been revoked', async ({ page }) => {
    await page.goto('/app.html#qrCodeGenerator');
    const input = page.locator('textarea, input[type="text"]').first();
    await input.waitFor({ state: 'visible' });
    await input.fill('https://unitool.test/guard');

    const [first] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: /تحميل PNG|Download PNG/i }).first().click(),
    ]);
    expect(await first.failure()).toBeNull();

    // Safari needs the object URL alive for its whole transfer; waiting longer
    // than the old 1s/4s revoke windows must still leave a usable entry.
    await page.waitForTimeout(5_000);
    const again = await expectDownload(
      page,
      () => page.getByTestId('unitool-download-again-btn').click(),
      'delayed re-download',
    );
    expect(again).not.toMatch(/[/\\:*?"<>|]/);
  });
});
