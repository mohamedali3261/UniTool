import { expect, test } from '@playwright/test';

test.describe('Teacher Smartboard Studio — Modular Pages, Modes, Tools & Anti-Clutter UX', () => {
  test('desktop smartboard supports drawing, undo/redo, multi-slides, surfaces, grids, split board, geometry kit, formulas, and focus mode without clutter', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.setViewportSize({ width: 1366, height: 840 });
    await page.goto('/teacher-board/');

    const canvas = page.getByTestId('tb-main-canvas');
    await expect(canvas).toBeVisible();

    // Verify spacious uncluttered board: canvas occupies majority of viewport and zero overflow
    const metrics = await page.evaluate(() => {
      const c = document.querySelector('[data-testid="tb-main-canvas"]')!.getBoundingClientRect();
      return {
        canvasAreaRatio: (c.width * c.height) / (window.innerWidth * window.innerHeight),
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
      };
    });
    expect(metrics.canvasAreaRatio).toBeGreaterThan(0.62);
    expect(metrics.noOverflow).toBe(true);

    // Draw stroke on board and verify undo/redo
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 180, box.y + 180);
    await page.mouse.down();
    await page.mouse.move(box.x + 420, box.y + 260, { steps: 8 });
    await page.mouse.up();

    await expect(page.getByRole('button', { name: 'تراجع' })).toBeEnabled();
    await page.getByRole('button', { name: 'تراجع' }).click();
    await expect(page.getByRole('button', { name: 'إعادة' })).toBeEnabled();
    await page.getByRole('button', { name: 'إعادة' }).click();

    // Switch Board Modes: Green Chalkboard + Coordinate Axes + Split Board + Curtain
    await page.getByTestId('tb-dock-modes').click();
    await page.getByTestId('tb-surface-chalk-green').click();
    await page.getByTestId('tb-grid-axes').click();
    await page.getByTestId('tb-toggle-split').click();
    await expect(page.getByTestId('tb-split-canvas')).toBeVisible();
    await page.screenshot({ path: '.cache/touch-browser/tb-desktop-split-chalk.png' });

    // Close split board, open Geometry Tools (Ruler + Protractor) & STEM Formula
    await page.getByTestId('tb-toggle-split').click();
    await page.getByTestId('tb-dock-geometry').click();
    await page.getByTestId('tb-toggle-ruler').click();
    await page.getByTestId('tb-toggle-protractor').click();
    await expect(page.getByTestId('tb-geometry-ruler')).toBeVisible();
    await expect(page.getByTestId('tb-geometry-protractor')).toBeVisible();

    await page.getByTestId('tb-dock-insert').click();
    await page.getByRole('button', { name: 'نظرية فيثاغورس' }).click();
    await page.screenshot({ path: '.cache/touch-browser/tb-desktop-geometry-stem.png' });

    // Multi-slide deck + Focus Mode
    await page.getByTestId('tb-add-slide').click();
    await expect(page.getByTestId('tb-slide-counter')).toHaveText('2 / 2');

    await page.getByTestId('tb-focus-toggle').click();
    await expect(page.getByTestId('tb-studio-header')).toHaveCount(0);
    await expect(page.getByTestId('tb-exit-focus')).toBeVisible();
    await page.getByTestId('tb-exit-focus').click();
    await expect(page.getByTestId('tb-studio-header')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('templates, classroom tools, and lessons pages work seamlessly on mobile and desktop', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    await page.goto('/teacher-board/');
    await expect(page.getByTestId('tb-main-canvas')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    ).toBe(true);

    // 1. Subject Templates Page -> Load Arabic Grammar template onto board
    await page.getByTestId('tb-tab-templates').click();
    await expect(page.getByTestId('tb-templates-page')).toBeVisible();
    await page.screenshot({ path: '.cache/touch-browser/tb-mobile-templates.png' });
    await page
      .getByTestId('tb-tpl-arabic-irab-tree')
      .getByRole('button', { name: 'فتح القالب على السبورة' })
      .click();
    await expect(page.getByTestId('tb-board-page')).toBeVisible();
    await page.screenshot({ path: '.cache/touch-browser/tb-mobile-board.png' });

    // 2. Classroom Tools Page -> Timer, Random Student Picker & Team Scoreboard
    await page.getByTestId('tb-tab-classroom').click();
    await expect(page.getByTestId('tb-classroom-page')).toBeVisible();
    await page.getByRole('button', { name: 'اختيار طالب عشوائي' }).click();
    await expect(page.getByTestId('tb-picked-student')).not.toContainText('اضغط');
    await page.screenshot({ path: '.cache/touch-browser/tb-mobile-classroom.png' });

    // 3. Lessons & Export Page -> Create new lesson
    await page.getByTestId('tb-tab-lessons').click();
    await expect(page.getByTestId('tb-lessons-page')).toBeVisible();
    await page.getByRole('button', { name: 'إنشاء الدرس' }).click();
    await expect(page.getByTestId('tb-board-page')).toBeVisible();

    await context.close();
  });
});
