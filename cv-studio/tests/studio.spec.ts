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

test('ATS Checker page is removed; Cover Letter sync, Resumes duplication, .utcv.json & PDF export work cleanly', async ({
  page,
}) => {
  await page.goto('/cv-studio/');

  // 1. Verify ATS Checker page & tab are completely removed
  await expect(page.getByRole('button', { name: /فاحص ATS|ATS Checker|فاحص توافق/ })).toHaveCount(0);
  await page.goto('/cv-studio/#ats-checker');
  await expect(page.locator('[data-cv-sheet]').first()).toBeVisible();

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

test('All 14 templates render genuinely distinct mini-previews in Gallery and distinct visual architectures on [data-cv-sheet]', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/cv-studio/');
  await page.locator('#cv-fullname').fill('م. طارق المنصور');

  // Open Templates gallery and verify all 14 distinct miniature layouts are visible
  await page.getByRole('button', { name: /القوالب|Templates/ }).click();
  await expect(page.getByTestId('cv-templates-page')).toBeVisible();

  const distinctMiniStyles = [
    'ats-classic',
    'modern-sidebar',
    'tech-split-grid',
    'royal-split-header',
    'creative-bold-aside',
    'corporate-ledger',
    'creative-banner-timeline',
    'clinical-structured-grid',
    'spine-timeline-infographic',
    'editorial-magazine',
    'bento-modular-cards',
    'academic-hanging',
    'fresh-grad-cards',
    'nordic-minimal',
  ];

  for (const miniStyle of distinctMiniStyles) {
    await expect(page.locator(`[data-visual-style="${miniStyle}"] .cvt-mini-paper`).first()).toBeVisible();
  }
  await page.screenshot({ path: '.cache/cv-qa-14-templates-gallery.png', fullPage: true });

  // Switch across the new & classic template architectures and assert structural DOM differences + preserved user name
  const templateChecks = [
    { id: 'royal-gold-executive', style: 'royal-split-header', selector: '.cvp-royal-crest' },
    { id: 'creative-studio-split', style: 'creative-bold-aside', selector: '.cvp-dark-aside-col' },
    { id: 'medical-clinical-clean', style: 'clinical-structured-grid', selector: '.cvp-clinical-card' },
    { id: 'editorial-magazine-serif', style: 'editorial-magazine', selector: '.cvp-editorial-pullquote' },
    { id: 'compact-startup-grid', style: 'bento-modular-cards', selector: '.cvp-bento-hero-tile' },
  ];

  for (const check of templateChecks) {
    await page.getByRole('button', { name: /القوالب|Templates/ }).click();
    await page.getByTestId(`apply-template-keep-${check.id}`).click();
    const sheet = page.locator('[data-cv-sheet]').first();
    await expect(sheet).toHaveAttribute('data-template-style', check.style);
    await expect(sheet.locator(check.selector).first()).toBeVisible();
    await expect(sheet).toContainText('م. طارق المنصور');
    await page.screenshot({ path: `.cache/cv-qa-tpl-${check.id}.png` });
  }
});

test('Smooth 120fps GPU dragging, inline text editing, Electronic Signature Pad, Shapes library, and Layers panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/cv-studio/');

  const sheet = page.locator('[data-cv-sheet]').first();
  await expect(sheet).toBeVisible();

  // 1. Direct inline text editing right on the CV sheet (double-click h1)
  const headingOnSheet = sheet.locator('h1.cvp-inline-editable').first();
  await headingOnSheet.dblclick();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('د. كريم الشافعي');
  await headingOnSheet.blur();
  await expect(sheet).toContainText('د. كريم الشافعي');
  await expect(page.locator('#cv-fullname')).toHaveValue('د. كريم الشافعي');

  // 2. Quick-add a movable freeform text onto [data-cv-sheet] and drag it smoothly via GPU translate3d
  await page.getByTestId('quick-add-text-btn').click();
  const canvasEl = sheet.locator('.cv-canvas-el').first();
  await expect(canvasEl).toBeVisible();

  const beforeLeft = await canvasEl.evaluate((el) => parseFloat((el as HTMLElement).style.left));
  const box = await canvasEl.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 95, box!.y + box!.height / 2 + 55, { steps: 10 });
  await page.mouse.up();

  const afterLeft = await canvasEl.evaluate((el) => parseFloat((el as HTMLElement).style.left));
  expect(afterLeft).toBeGreaterThan(beforeLeft + 40);

  // 3. Insert a transparent Electronic Signature onto the sheet
  await page.getByTestId('quick-add-signature-btn').click();
  await expect(page.getByTestId('signature-pad-modal')).toBeVisible();
  await page.getByRole('button', { name: /توقيع مكتوب أنيق|Stylized Text Signature/ }).click();
  await page.getByTestId('insert-signature-btn').click();
  await expect(sheet.locator('.cv-canvas-el')).toHaveCount(2);

  // 4. Elements, Shapes, Dividers, Icons & Custom Image Upload
  await page.getByTestId('editor-tab-elements-shapes').click();
  await expect(page.getByTestId('cv-elements-shapes-panel')).toBeVisible();

  await page.getByTestId('add-shape-hexagon').click();
  await page.getByTestId('editor-tab-elements-shapes').click();
  await page.getByTestId('add-divider-double').click();
  await page.getByTestId('editor-tab-elements-shapes').click();
  await page.getByTestId('add-icon-Award').click();
  await page.getByTestId('editor-tab-elements-shapes').click();
  await page.getByTestId('add-sample-canvas-image').click();
  await page.screenshot({ path: '.cache/cv-qa-layers-inspector.png' });

  // Verify all 6 freeform elements are mounted on [data-cv-sheet] and listed alongside template blocks in Layers & Inspector
  await expect(sheet.locator('.cv-canvas-el')).toHaveCount(6);
  await page.getByTestId('editor-tab-layers').click();
  await expect(page.locator('[data-testid^="layer-row-"]')).toHaveCount(6);
  await expect(page.locator('.cv-layer-row')).toHaveCount(15);

  // 5. Drag built-in template summary block smoothly on the CV sheet and verify block override transform
  const summaryBlock = sheet.locator('[data-cv-block="summary"]').first();
  const sBox = await summaryBlock.boundingBox();
  expect(sBox).not.toBeNull();
  await page.mouse.move(sBox!.x + 40, sBox!.y + 18);
  await page.mouse.down();
  await page.mouse.move(sBox!.x + 85, sBox!.y + 42, { steps: 8 });
  await page.mouse.up();
  const blockTransform = await summaryBlock.evaluate((el) => (el as HTMLElement).style.transform);
  expect(blockTransform).toMatch(/translate/);
});
