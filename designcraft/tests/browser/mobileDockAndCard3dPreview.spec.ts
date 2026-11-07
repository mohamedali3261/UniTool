import { expect, test, type Page } from '@playwright/test';

const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';

async function openProjectInEditor(
  page: Page,
  project: {
    title: string;
    width: number;
    height: number;
    background?: string;
    objects?: Record<string, unknown>[];
  }
) {
  await page.addInitScript(() => {
    localStorage.setItem('unitool-lang', 'ar');
  });
  await page.goto(`${base}/designcraft.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('#designer-project-input').setInputFiles({
    name: 'qa-project.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'unitool-designcraft',
        version: 1,
        project: {
          title: project.title,
          width: project.width,
          height: project.height,
          canvasData: {
            background: project.background || '#164e3d',
            objects: project.objects || [
              {
                type: 'rect',
                left: Math.round(project.width * 0.08),
                top: Math.round(project.height * 0.1),
                width: Math.round(project.width * 0.84),
                height: Math.round(project.height * 0.8),
                rx: 28,
                ry: 28,
                fill: '#24795e',
              },
              {
                type: 'textbox',
                text: project.title,
                left: Math.round(project.width * 0.16),
                top: Math.round(project.height * 0.4),
                width: Math.round(project.width * 0.68),
                fontSize: Math.max(28, Math.round(Math.min(project.width, project.height) * 0.09)),
                fontFamily: 'Arial',
                fontWeight: 700,
                fill: '#ffffff',
                textAlign: 'center',
              },
            ],
          },
        },
      })
    ),
  });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
}

test.describe('Mobile In-Flow Sidebar Dock, TopBar Cleanup, Mobile Preview Sizing & 360° 3D Card', () => {
  test('mobile bottom tabs open as compact in-flow dock keeping canvas visible and interactive, and TopBar has no Properties button next to Preview', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    await openProjectInEditor(page, {
      title: 'تصميم السوشيال',
      width: 1080,
      height: 1080,
    });

    // 1. Verify Properties button next to Preview in #editor-top-bar is completely removed
    const topBar = page.locator('#editor-top-bar');
    await expect(topBar.getByRole('button', { name: 'معاينة' })).toBeVisible();
    await expect(
      topBar.getByRole('button', { name: /الخصائص|إظهار الخصائص|إخفاء الخصائص|Properties/i })
    ).toHaveCount(0);

    // 2. Tap bottom bar tabs and verify they open in-flow (#mobile-sidebar-dock) like Properties,
    //    keeping the canvas visible & uncovered above the dock
    const bottomNav = page.locator('#mobile-bottom-nav');
    for (const tabLabel of ['مكتبة', 'قوالب', 'النصوص', 'الأشكال', 'الخلفية', 'الطبقات']) {
      await bottomNav.getByRole('button', { name: tabLabel, exact: true }).click();
      const dock = page.locator('#mobile-sidebar-dock');
      await expect(dock).toBeVisible();

      const layoutMetrics = await page.evaluate(() => {
        const dockEl = document.getElementById('mobile-sidebar-dock')!;
        const canvasArea = document.getElementById('canvas-area-container')!;
        const dRect = dockEl.getBoundingClientRect();
        const cRect = canvasArea.getBoundingClientRect();
        const probeX = Math.round(cRect.left + cRect.width / 2);
        const probeY = Math.round(cRect.top + cRect.height * 0.42);
        const hit = document.elementFromPoint(probeX, probeY);
        return {
          dockHeight: dRect.height,
          dockTop: dRect.top,
          canvasHeight: cRect.height,
          canvasBottom: cRect.bottom,
          hitInsideWorkspace: !!hit?.closest('#canvas-workspace'),
        };
      });

      expect(layoutMetrics.dockHeight).toBeLessThanOrEqual(360);
      expect(layoutMetrics.canvasHeight).toBeGreaterThan(330);
      expect(layoutMetrics.canvasBottom).toBeLessThanOrEqual(layoutMetrics.dockTop + 2);
      expect(layoutMetrics.hitInsideWorkspace).toBe(true);

      if (tabLabel === 'النصوص') {
        await page.screenshot({ path: '.cache/touch-browser/mobile-dock-texts.png' });
      }
    }

    // 3. Switching to Properties closes #mobile-sidebar-dock and opens #mobile-properties-dock cleanly
    await bottomNav.getByRole('button', { name: 'الخصائص', exact: true }).click();
    await expect(page.locator('#mobile-sidebar-dock')).toHaveCount(0);
    await expect(page.locator('#mobile-properties-dock')).toBeVisible();

    await context.close();
  });

  test('mobile PreviewModal is compact without overflow and renders any design size as an interactive 360° 3D card', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    await openProjectInEditor(page, {
      title: 'كارت عمل احترافي',
      width: 1050,
      height: 600,
    });

    // Open Design Preview from TopBar
    await page.locator('#editor-top-bar').getByRole('button', { name: 'معاينة' }).click();
    const modal = page.locator('#preview-modal');
    await expect(modal).toBeVisible();
    const stage = modal.getByTestId('design-card-3d-stage');
    await expect(stage).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '.cache/touch-browser/mobile-preview-3d-card.png' });

    // Verify compact mobile sizing & zero header overflow
    const modalMetrics = await modal.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const header = el.querySelector('.dc-preview-modal__header') as HTMLElement;
      return {
        width: r.width,
        height: r.height,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        headerClientW: header.clientWidth,
        headerScrollW: header.scrollWidth,
      };
    });

    expect(modalMetrics.width).toBeLessThanOrEqual(375);
    expect(modalMetrics.height).toBeLessThanOrEqual(560);
    expect(modalMetrics.left).toBeGreaterThanOrEqual(8);
    expect(modalMetrics.right).toBeLessThanOrEqual(382);
    expect(modalMetrics.top).toBeGreaterThanOrEqual(60);
    expect(modalMetrics.bottom).toBeLessThanOrEqual(790);
    expect(modalMetrics.headerScrollW).toBeLessThanOrEqual(modalMetrics.headerClientW + 1);

    // Drag across the stage twice to exceed 360° rotation smoothly
    const startYaw = Number(await stage.getAttribute('data-yaw-deg'));
    const box = (await stage.boundingBox())!;

    for (let pass = 0; pass < 2; pass++) {
      await page.mouse.move(box.x + 32, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 28, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    const rotatedYaw = Number(await stage.getAttribute('data-yaw-deg'));
    expect(Math.abs(rotatedYaw - startYaw)).toBeGreaterThan(260);

    // Reset to Front, then Flip button rotates Front -> Back (180°) and Back -> Front (0°)
    await modal.getByRole('button', { name: 'إعادة ضبط الزاوية' }).click();
    await expect(modal.getByText('الوجه الأمامي')).toBeVisible();
    await modal.getByRole('button', { name: /قلب الوجه/ }).click();
    await expect(modal.getByText('الظهر')).toBeVisible();
    await expect
      .poll(async () => Math.abs(Number(await stage.getAttribute('data-yaw-deg')) % 360))
      .toBeGreaterThan(150);
    await page.screenshot({ path: '.cache/touch-browser/mobile-preview-3d-card-back.png' });

    // Cycle finish presets (ساتان -> لامع -> مطفي)
    await modal.getByRole('button', { name: 'ساتان' }).click();
    await expect(modal.getByRole('button', { name: 'لامع' })).toBeVisible();
    await modal.getByRole('button', { name: 'لامع' }).click();
    await expect(modal.getByRole('button', { name: 'مطفي' })).toBeVisible();

    // Phone frame mode also fits cleanly inside mobile PreviewModal without overflowing
    await modal.getByTestId('preview-mode-mobile').click();
    const bodyOverflow = await modal.locator('.dc-preview-modal__body > div').evaluate((el) => ({
      scrollH: el.scrollHeight,
      clientH: el.clientHeight,
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
    }));
    expect(bodyOverflow.scrollW).toBeLessThanOrEqual(bodyOverflow.clientW + 1);

    await context.close();
  });

  test('desktop PreviewModal renders custom tall/banner design sizes on realistic 3D card and desktop TopBar has no Properties button', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 820 },
    });
    const page = await context.newPage();

    await openProjectInEditor(page, {
      title: 'بوستر طولي احترافي',
      width: 900,
      height: 1600,
      background: '#1e3a2f',
    });

    // Desktop TopBar has Preview, no Properties button next to it; Properties toggle lives in #sidebar-nav-tabs
    const topBar = page.locator('#editor-top-bar');
    await expect(topBar.getByRole('button', { name: 'معاينة' })).toBeVisible();
    await expect(
      topBar.getByRole('button', { name: /الخصائص|إظهار الخصائص|إخفاء الخصائص|Properties/i })
    ).toHaveCount(0);
    await expect(
      page.locator('#sidebar-nav-tabs').getByRole('button', { name: /إظهار الخصائص|إخفاء الخصائص/ })
    ).toBeVisible();

    await topBar.getByRole('button', { name: 'معاينة' }).click();
    const modal = page.locator('#preview-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('900 × 1600 px');
    await expect(modal.getByTestId('design-card-3d-stage')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: '.cache/touch-browser/desktop-preview-3d-card.png' });

    await context.close();
  });
});
