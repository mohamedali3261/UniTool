import { test, expect } from "@playwright/test";
import {
  blankProject,
  newClip,
  type Asset,
} from "../../../../video-studio/src/types";
test.setTimeout(20000);
const base = process.env.HOME_QA_URL || "http://localhost:3000";
async function openEditor(page: import("@playwright/test").Page, suffix = "") {
  const a: Asset = {
    id: "base",
    name: "Existing.svg",
    type: "image",
    url:
      "data:image/svg+xml," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="#263124"/></svg>',
      ),
    duration: 10,
    width: 960,
    height: 540,
  };
  await page.goto(base + "/video-studio.html" + suffix);
  await page.locator('input[accept=".json"]').setInputFiles({
    name: "existing.unitool.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        project: {
          ...blankProject(),
          name: "Existing project",
          clips: [{ ...newClip(a), id: "original", end: 10 }],
        },
        assets: [a],
      }),
    ),
  });
  await expect(page.locator(".editor-shell")).toBeVisible();
}
async function elements(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "وسائط", exact: true }).click();
  await page.getByRole("button", { name: "العناصر", exact: true }).click();
  await expect(page.locator(".studio-elements-grid article")).toHaveCount(12);
}
test("insert a real text layer, edit it immediately, undo and preserve existing project", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openEditor(page);
  await elements(page);
  await page
    .locator(".studio-elements")
    .getByLabel("القسم", { exact: true })
    .selectOption("typography");
  await page.locator(".studio-elements-grid button").first().click();
  const content = page.getByRole("textbox", {
    name: "محتوى النص",
    exact: true,
  });
  await expect(content).toBeVisible();
  await content.fill("تعديل العنصر على التايم لاين");
  await expect(content).toHaveValue("تعديل العنصر على التايم لاين");
  await expect(
    page.getByRole("textbox", { name: "اسم المشروع", exact: true }),
  ).toHaveValue("Existing project");
  await page
    .getByRole("button", { name: "تراجع", exact: true })
    .first()
    .click();
  await expect(content).not.toHaveValue("تعديل العنصر على التايم لاين");
  expect(errors).toEqual([]);
});
test("SVG adds an overlay, supports source editing and rejects executable content", async ({
  page,
}) => {
  await openEditor(page);
  await elements(page);
  await page
    .locator(".studio-elements")
    .getByLabel("القسم", { exact: true })
    .selectOption("backgrounds");
  await page
    .locator(".studio-elements")
    .getByLabel("القالب", { exact: true })
    .selectOption("nova");
  await page.locator(".studio-elements-grid button").first().click();
  await expect(page.locator("#studio-layers")).toHaveAttribute("open", "");
  await page.locator(".studio-svg-editor summary").click();
  const select = page.getByLabel("عنصر SVG للتعديل", { exact: true });
  const id = await select.locator("option").last().getAttribute("value");
  await select.selectOption(id!);
  const code = page.getByRole("textbox", { name: "كود SVG القابل للتعديل" });
  await code.fill(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><script>alert(1)</script></svg>',
  );
  await page
    .getByRole("button", { name: "تطبيق تعديل SVG", exact: true })
    .click();
  await expect(page.locator(".studio-svg-editor")).toContainText(
    "بدون سكربتات",
  );
  await code.fill(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#ff7700"/></svg>',
  );
  await page
    .getByRole("button", { name: "تطبيق تعديل SVG", exact: true })
    .click();
  await expect(page.locator(".studio-svg-editor")).toContainText(
    "تم تطبيق SVG",
  );
  await expect(
    page.getByRole("textbox", { name: "اسم المشروع", exact: true }),
  ).toHaveValue("Existing project");
});
test("code scene appends and scene/accent controls remain editable", async ({
  page,
}) => {
  await openEditor(page);
  await elements(page);
  await page
    .locator(".studio-elements")
    .getByLabel("القسم", { exact: true })
    .selectOption("scenes");
  await page.locator(".studio-elements-grid button").first().click();
  await expect(page.locator("#studio-inspector")).toContainText("مشهد الواجهة");
  await expect(
    page.getByRole("textbox", { name: "اسم المشروع", exact: true }),
  ).toHaveValue("Existing project");
});
test("standalone library links to non-destructive project choice before insertion", async ({
  page,
}) => {
  await page.goto(base + "/elements.html");
  await page.locator(".element-inspect").first().click();
  const link = page.getByRole("link", {
    name: /إضافة للتايم لاين في الاستوديو/,
  });
  const url = await link.getAttribute("href");
  expect(url).toContain("?element=");
  await page.goto(base + url);
  await expect(page.locator(".element-handoff")).toBeVisible();
  await openEditor(page, url!.slice(url!.indexOf("?")));
  await expect(
    page.getByRole("textbox", { name: "محتوى النص", exact: true }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/element=/);
});
for (const width of [320, 390])
  test(`mobile ${width}: add and edit a real layer without overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await openEditor(page);
    await elements(page);
    await page
      .locator(".studio-elements")
      .getByLabel("القسم", { exact: true })
      .selectOption("typography");
    await page.locator(".studio-elements-grid button").first().click();
    const content = page.getByRole("textbox", {
      name: "محتوى النص",
      exact: true,
    });
    await expect(content).toBeVisible();
    await content.fill("عنصر قابل للتعديل");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: `test-results/elements-mobile-${width}.png`,
    });
  });
