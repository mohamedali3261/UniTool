import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

test.describe('CV Studio — Appearance, Paper Isolation & Responsive Layout', () => {
  for (const mobile of [false, true]) {
    test(`${mobile ? 'mobile 390px' : 'desktop 1440px'}: day/night identity, white paper invariance, and zero overflow`, async ({
      page,
    }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(String(err)));

      await page.goto('/cv-studio/');
      await expect(page.locator('[data-site-navbar]')).toBeVisible();
      await expect(page.locator('[data-site-navbar] img')).toHaveAttribute('src', '/UniTool_logo.png');

      // On mobile, switch to preview tab to inspect the live A4 paper sheet
      if (mobile) {
        await page.getByRole('button', { name: /معاينة الورقة|Sheet Preview/ }).click();
      }
      const paper = page.locator('[data-cv-sheet]').first();
      await expect(paper).toBeVisible();

      const themeToggle = page.locator('[data-testid$="theme-toggle"]').first();
      for (const mode of ['light', 'dark'] as const) {
        if ((await page.locator('html').getAttribute('data-site-theme')) !== mode) {
          await themeToggle.click();
        }
        await expect(page.locator('.cv-studio-app')).toHaveCSS(
          'background-color',
          mode === 'dark' ? 'rgb(16, 16, 16)' : 'rgb(245, 247, 244)',
        );
        await expect(page.locator('.ut-site-nav')).toHaveCSS(
          'background-color',
          mode === 'dark' ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)',
        );
        // CV Paper MUST stay natural print white in BOTH day & night modes
        await expect(paper).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await expect(page.locator('.cv-btn.primary').first()).toHaveCSS(
          'background-color',
          'rgb(36, 121, 94)',
        );

        await page.screenshot({
          path: `.cache/cv-qa-${mobile ? 'mobile' : 'desktop'}-${mode}.png`,
          fullPage: false,
        });
      }

      // Unified green SVG cursor check
      const bodyCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
      expect(bodyCursor).toContain('data:image/svg+xml');

      // Zero horizontal overflow
      const noOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      );
      expect(noOverflow).toBe(true);
      expect(errors).toEqual([]);
    });
  }
});

test('Editor modes, independent paper RTL/LTR, template switching without data loss, and Arabic physical Ctrl+Z/Y', async ({
  page,
}) => {
  await page.goto('/cv-studio/');
  const nameInput = page.locator('#cv-fullname');
  await nameInput.fill('عمر خالد الفاروق');
  await expect(page.locator('[data-cv-sheet]').first()).toContainText('عمر خالد الفاروق');

  // Blur input and trigger physical KeyZ / KeyY with Arabic characters ('ئ' / 'غ')
  await nameInput.blur();
  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyZ', key: 'ئ', ctrlKey: true, bubbles: true }),
    );
  });
  await expect(page.locator('[data-cv-sheet]').first()).not.toContainText('عمر خالد الفاروق');

  await page.evaluate(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { code: 'KeyY', key: 'غ', ctrlKey: true, bubbles: true }),
    );
  });
  await expect(page.locator('[data-cv-sheet]').first()).toContainText('عمر خالد الفاروق');

  // Open Design & Modes modal: switch paper language to English LTR while UI remains Arabic RTL
  await page.getByTestId('open-design-modal-btn').click();
  await page.getByTestId('paper-lang-en').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('[data-cv-sheet]').first()).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('[data-cv-sheet]').first()).toContainText('Work Experience');

  // Switch between the 4 layout modes
  for (const mode of ['modern', 'one-page', 'detailed', 'ats'] as const) {
    await page.getByTestId(`layout-mode-${mode}`).click();
  }
  await page.keyboard.press('Escape');

  // Switch template on TemplatesPage and verify typed name is 100% preserved
  await page.getByRole('button', { name: /القوالب|Templates/ }).click();
  await expect(page.getByTestId('cv-templates-page')).toBeVisible();
  await page.screenshot({ path: '.cache/cv-qa-templates-ar.png' });
  await page.getByTestId('apply-template-keep-modern-banner-creative').click();
  await expect(page.locator('[data-cv-sheet]').first()).toContainText('عمر خالد الفاروق');
});

test('ATS Checker JD keyword matcher, Cover Letter sync, Resumes duplication, .utcv.json & PDF export', async ({
  page,
}) => {
  await page.goto('/cv-studio/');

  // 1. ATS Checker & JD Keyword Matcher
  await page.getByRole('button', { name: /فاحص ATS|ATS Checker/ }).click();
  await expect(page.getByTestId('cv-ats-page')).toBeVisible();
  await page.getByTestId('sample-jd-jd-frontend-en').click();
  await expect(page.getByTestId('jd-match-results')).toBeVisible();
  await page.screenshot({ path: '.cache/cv-qa-ats-ar.png' });

  const missingBtn = page.locator('.cva-kw-missing').first();
  if ((await missingBtn.count()) > 0) {
    const kwText = (await missingBtn.textContent())!.trim();
    await missingBtn.click();
    await expect(page.locator('.cva-kw-matched').filter({ hasText: kwText })).toBeVisible();
  }

  // 2. Cover Letter preset & live synced sheet
  await page.getByRole('button', { name: /خطاب التقديم|Cover Letter/ }).click();
  await expect(page.getByTestId('cv-cover-letter-page')).toBeVisible();
  await page.locator('[data-testid^="cl-preset-"]').first().click();
  await expect(page.locator('[data-cl-sheet]')).toBeVisible();
  await expect(page.locator('[data-cl-sheet]')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.screenshot({ path: '.cache/cv-qa-cover-letter-ar.png' });

  // 3. Resumes management: Duplicate for company + .utcv.json round-trip + real PDF export
  await page.getByRole('button', { name: /سيرتي والتصدير|My Resumes/ }).click();
  await expect(page.getByTestId('cv-resumes-page')).toBeVisible();

  await page.locator('[data-testid^="duplicate-cv-"]').first().click();
  await page.getByTestId('dup-title-input').fill('سيرة مخصصة لشركة مايكروسوفت');
  await page.getByTestId('dup-company-input').fill('Microsoft');
  await page.getByTestId('confirm-duplicate-btn').click();
  await expect(page.getByText('سيرة مخصصة لشركة مايكروسوفت').first()).toBeVisible();

  // Export .utcv.json and re-import it
  const utcvDownloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-utcv-btn').click();
  const utcvDownload = await utcvDownloadPromise;
  expect(utcvDownload.suggestedFilename()).toContain('.utcv.json');
  const utcvBytes = await fs.readFile((await utcvDownload.path())!);
  const parsedUtcv = JSON.parse(utcvBytes.toString('utf-8'));
  expect(parsedUtcv.format).toBe('unitool-cv-studio');

  // Export crisp PDF and verify %PDF- header
  const pdfDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /تصدير السيرة PDF|Export CV PDF/ }).click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename().endsWith('.pdf')).toBe(true);
  const pdfBytes = await fs.readFile((await pdfDownload.path())!);
  expect(pdfBytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(pdfBytes.byteLength).toBeGreaterThan(2000);
});

test('Blocked browser storage resilience: studio remains interactive without uncaught errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        value: () => {
          throw new DOMException('Blocked', 'SecurityError');
        },
      });
    }
  });

  await page.goto('/cv-studio/');
  await expect(page.locator('[data-cv-sheet]').first()).toBeVisible();
  await page.locator('#cv-fullname').fill('اختبار بدون تخزين');
  await expect(page.locator('[data-cv-sheet]').first()).toContainText('اختبار بدون تخزين');
  expect(errors).toEqual([]);
});

test('Homepage animated CvStudioArt, Tools catalog animated preview, and /storage.html ZIP backup/restore', async ({
  browser,
}) => {
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();

  // 1. Homepage animated studio card
  await pageA.goto('/index.html');
  await expect(pageA.locator('#cv .cv-studio-art-svg')).toBeVisible();
  await pageA.locator('#cv').screenshot({ path: '.cache/cv-qa-home-card.png' });

  // 2. Tools list (/app.html) animated preview & click navigation
  await pageA.goto('/app.html');
  const tilePreview = pageA.getByTestId('cv-studio-tile-preview');
  await expect(tilePreview).toBeVisible();
  await tilePreview.click();
  await pageA.waitForURL('**/cv-studio/**');

  // 3. Author a custom CV, wait for autosave, then export full site ZIP from /storage.html
  await pageA.locator('#cv-fullname').fill('د. ليلى عبد الرحمن');
  await expect(pageA.locator('.cv-save-pill')).toContainText(/محفوظ تلقائياً|Autosaved/);

  await pageA.goto('/storage.html');
  const dlPromise = pageA.waitForEvent('download');
  await pageA.getByRole('button', { name: /تنزيل نسخة ZIP كاملة|Download full ZIP backup/ }).click();
  const zipBytes = await fs.readFile((await (await dlPromise).path())!);

  // 4. Restore into a clean second browser context and verify CV Studio loads the restored resume
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await pageB.goto('/storage.html');
  await pageB.getByTestId('backup-input').setInputFiles({
    name: 'cv-backup.zip',
    mimeType: 'application/zip',
    buffer: zipBytes,
  });
  await expect(pageB.getByTestId('backup-preview')).toContainText('cv / unitool-cv-studio');
  await pageB.getByRole('checkbox').check();
  await pageB.getByRole('button', { name: /تأكيد الاستعادة الآمنة|Confirm safe restore/ }).click();
  await expect(pageB.getByRole('status')).toContainText(/اكتملت الاستعادة|Restore complete/);

  await pageB.goto('/cv-studio/');
  await expect(pageB.locator('[data-cv-sheet]').first()).toContainText('د. ليلى عبد الرحمن');

  await ctxA.close();
  await ctxB.close();
});
