import { test, expect, type Page } from "@playwright/test";
async function open(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem("excel-studio.lang", "ar"),
  );
  await page.goto("/excel-studio/");
  await expect(page.locator(".xs-grid")).toBeVisible();
}
async function go(page: Page, range: string) {
  const input = page.getByRole("textbox", {
    name: "انتقال إلى خلية أو نطاق",
    exact: true,
  });
  await input.fill(range);
  await input.press("Enter");
}
test("mouse drag keeps the range after release, Delete clears all and undo restores it", async ({
  page,
}) => {
  await open(page);
  const start = await page.locator('[data-ref="B2"]').boundingBox(),
    end = await page.locator('[data-ref="D4"]').boundingBox();
  await page.mouse.move(
    start!.x + start!.width / 2,
    start!.y + start!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(end!.x + end!.width / 2, end!.y + end!.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    9,
  );
  await expect(page.locator('[data-ref="D4"]')).toBeFocused();
  const original = await page.locator('[data-ref="B2"]').innerText();
  await page.keyboard.press("Delete");
  await expect(page.locator('[data-ref="B2"]')).toHaveText("");
  await expect(page.locator('[data-ref="C3"]')).toHaveText("");
  await page.getByRole("button", { name: "تراجع", exact: true }).click();
  await expect(page.locator('[data-ref="B2"]')).toHaveText(original.trim());
});
test("column, row and all headers select complete rectangles; shift and keyboard extend ranges", async ({
  page,
}) => {
  await open(page);
  const rows = await page.locator(".xs-grid tbody tr").count(),
    cols = (await page.locator(".xs-grid thead th").count()) - 1;
  await page
    .getByRole("button", { name: "تحديد العمود B", exact: true })
    .click();
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    rows,
  );
  await page.getByRole("button", { name: "تحديد الصف 3", exact: true }).click();
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    cols,
  );
  await page
    .getByRole("button", { name: "تحديد كل الخلايا", exact: true })
    .click();
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    rows * cols,
  );
  await go(page, "B2");
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    4,
  );
  await page.keyboard.press("Escape");
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    1,
  );
  await page.keyboard.press("Control+Home");
  await expect(page.locator('[data-ref="A1"]')).toBeFocused();
  await page.keyboard.press("Control+a");
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    rows * cols,
  );
});
test("fill right translates formulas and clear formatting leaves raw values intact", async ({
  page,
}) => {
  await open(page);
  await go(page, "A8");
  await page.locator('[data-ref="A8"]').dblclick();
  await page
    .getByRole("textbox", { name: "تعديل A8", exact: true })
    .fill("=A2+$B$2");
  await page
    .getByRole("textbox", { name: "تعديل A8", exact: true })
    .press("Enter");
  await go(page, "A8:C8");
  await page.getByRole("button", { name: "تعبئة لليمين", exact: true }).click();
  // Verify via the actual formula bar, independent of autosave timing.
  await go(page, "C8");
  await expect(page.locator("#xs-formula-input")).toHaveValue("=C2+$B$2");
  await page
    .getByRole("button", { name: "مسح التنسيق فقط", exact: true })
    .click();
  await expect(page.locator("#xs-formula-input")).toHaveValue("=C2+$B$2");
  await page
    .getByRole("button", { name: "ضبط عرض الأعمدة", exact: true })
    .click();
  await expect(
    page.locator(".xs-grid th").filter({
      has: page.getByRole("button", { name: "تحديد العمود C", exact: true }),
    }),
  ).toBeVisible();
});
test("invalid ranges do not change selection and mobile tools stay inside viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await go(page, "A9999");
  await expect(
    page.locator('.xs-selection-tools [role="alert"]'),
  ).toBeVisible();
  expect(
    await page
      .locator(".xs-selection-tools")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
});
test("Ctrl/Shift Space select headers and clipboard copy serializes the whole range", async ({
  page,
}) => {
  await open(page);
  await go(page, "B2:C3");
  const copied = await page.locator('[data-ref="C3"]').evaluate((el) => {
    const data = new DataTransfer();
    el.dispatchEvent(
      new ClipboardEvent("copy", {
        bubbles: true,
        cancelable: true,
        clipboardData: data,
      }),
    );
    return data.getData("text/plain");
  });
  expect(copied.split("\n")).toHaveLength(2);
  expect(copied.split("\n").every((row) => row.split("\t").length === 2)).toBe(
    true,
  );
  await page.keyboard.press("Shift+Space");
  const cols = (await page.locator(".xs-grid thead th").count()) - 1;
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    cols,
  );
  await go(page, "B2");
  await page.keyboard.press("Control+Space");
  const rows = await page.locator(".xs-grid tbody tr").count();
  await expect(page.locator('.xs-grid td[aria-selected="true"]')).toHaveCount(
    rows,
  );
});
test("dragging at the edge auto-scrolls and stops scrolling after release", async ({
  page,
}) => {
  await open(page);
  await page
    .locator(".xs-grid-scroll")
    .evaluate((el) => ((el as HTMLElement).style.maxHeight = "180px"));
  const start = await page.locator('[data-ref="B2"]').boundingBox(),
    rect = await page.locator(".xs-grid-scroll").boundingBox();
  await page.mouse.move(start!.x + 20, start!.y + 10);
  await page.mouse.down();
  await page.mouse.move(start!.x + 20, rect!.y + rect!.height - 5, {
    steps: 8,
  });
  await expect
    .poll(() => page.locator(".xs-grid-scroll").evaluate((e) => e.scrollTop))
    .toBeGreaterThan(0);
  await page.mouse.up();
  const top = await page
    .locator(".xs-grid-scroll")
    .evaluate((e) => e.scrollTop);
  await page.mouse.move(rect!.x + 20, rect!.y + rect!.height - 5);
  expect(
    await page.locator(".xs-grid-scroll").evaluate((e) => e.scrollTop),
  ).toBe(top);
  await expect(
    page.locator('.xs-grid td[aria-selected="true"]'),
  ).not.toHaveCount(1);
});
