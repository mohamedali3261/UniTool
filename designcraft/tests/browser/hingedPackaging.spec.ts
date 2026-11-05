import fs from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import { ALL_BOX_PRESETS } from "../../src/packaging/catalog";
import { createCartonProject } from "../../src/packaging/project";
import { cartonGeometry, MM_TO_PX } from "../../src/packaging/geometry";
import { storedProject, storedProjects, saveAndWait } from "./helpers/storage";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
async function gallery(page: Page) {
  await page.goto(base + "/designcraft.html#packaging");
  await expect(page.getByTestId("packaging-page")).toBeVisible();
}
test("sections own their presets, projects and searches; ordinary designs never show cartons", async ({
  page,
}) => {
  await gallery(page);
  const seeds = ["gift-cube", "pizza-12", "bakery-200", "mailer-medium"].map(
    (id, i) => {
      const p =
        ALL_BOX_PRESETS.find((p) => p.id === id) ||
        ALL_BOX_PRESETS[i === 0 ? 0 : i];
      return createCartonProject(
        p.size,
        ["CARTON QA", "PIZZA QA", "BAKERY QA", "MAILER QA"][i],
      );
    },
  );
  const normal = {
    ...seeds[0],
    id: "normal-qa",
    title: "NORMAL QA",
    category: "custom",
    packaging: undefined,
  };
  await page.evaluate(
    async (projects) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open("designcraft-projects", 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("projects", "readwrite"),
          store = tx.objectStore("projects");
        store.clear();
        projects.forEach((p) => store.put(p));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    [...seeds, normal],
  );
  await page.reload();
  await expect(page.locator("[data-section-project]")).toHaveCount(4);
  for (const [section, total, title] of [
    ["علب المنتجات", 12, "CARTON QA"],
    ["علب البيتزا", 9, "PIZZA QA"],
    ["علب المخبوزات", 4, "BAKERY QA"],
    ["غطاء متصل", 3, "MAILER QA"],
  ] as const) {
    await page.getByRole("button", { name: section, exact: true }).click();
    await expect(page.locator("[data-carton-preset]")).toHaveCount(total);
    await expect(page.locator("[data-section-project]")).toHaveCount(1);
    await expect(page.getByTestId("packaging-projects")).toContainText(title);
  }
  await page
    .getByRole("searchbox", { name: "بحث في مشاريع القسم", exact: true })
    .fill("PIZZA");
  await expect(page.locator("[data-section-project]")).toHaveCount(0);
  await page
    .getByRole("searchbox", { name: "بحث في مشاريع القسم", exact: true })
    .fill("");
  await page.getByRole("button", { name: /^مشاريعي/ }).click();
  await expect(
    page.getByRole("heading", { name: "NORMAL QA", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /^(CARTON|PIZZA|BAKERY|MAILER) QA$/ }),
  ).toHaveCount(0);
  expect((await storedProjects(page)).length).toBe(5);
});
test("native pizza creation, face-aware resize, 3D assembly, physical SVG and reload in its own section", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await gallery(page);
  await page.getByRole("button", { name: "علب البيتزا", exact: true }).click();
  await page.locator('[data-carton-preset="pizza-12"] button').click();
  await expect(
    page.getByRole("spinbutton", {
      name: "عرض العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("304.8");
  await expect(
    page.getByRole("spinbutton", {
      name: "ارتفاع العلبة بالملليمتر",
      exact: true,
    }),
  ).toHaveValue("40");
  await page
    .getByRole("textbox", { name: "اسم قالب العلبة", exact: true })
    .fill("MY PIZZA");
  await page
    .getByRole("textbox", { name: "اسم العلامة التجارية", exact: true })
    .fill("PIZZA QA");
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
  await saveAndWait(page, true);
  const before = await storedProject(page, "MY PIZZA");
  expect(before.packaging.kind).toBe("hinged-lid");
  expect(before.packaging.size.family).toBe("pizza");
  await page
    .getByRole("button", { name: "تعديل المقاسات", exact: true })
    .click();
  for (const [name, value] of [
    ["ارتفاع العلبة", "45"],
    ["عرض العلبة", "330"],
    ["طول القاعدة", "320"],
  ])
    await page
      .getByRole("spinbutton", { name: name + " بالملليمتر", exact: true })
      .fill(value);
  await page
    .getByRole("button", { name: "تطبيق المقاسات", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await saveAndWait(page, true);
  const after = await storedProject(page, "MY PIZZA"),
    g = cartonGeometry(after.packaging.size);
  expect(after.canvasData.objects.length).toBe(
    before.canvasData.objects.length,
  );
  expect(after.width).toBeCloseTo(g.width * MM_TO_PX, 2);
  expect(after.canvasData.objects.some((o: any) => o.text === "PIZZA QA")).toBe(
    true,
  );
  const brandBefore = before.canvasData.objects.find(
      (o: any) => o.id === "art-hinged-10",
    ),
    brandAfter = after.canvasData.objects.find(
      (o: any) => o.id === "art-hinged-10",
    );
  expect(brandAfter).toBeTruthy();
  expect(brandAfter.id).toBe(brandBefore.id);
  await page
    .getByRole("button", { name: "معاينة ثلاثية الأبعاد 360°", exact: true })
    .click();
  const stage = page.getByTestId("carton-3d-stage");
  await expect(stage).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await page.getByRole("button", { name: "فرد القالب", exact: true }).click();
  await expect(stage).toHaveAttribute("data-fold", "0");
  await page.getByRole("button", { name: "تجميع كامل", exact: true }).click();
  await expect(stage).toHaveAttribute("data-fold", "100");
  await page
    .getByRole("button", { name: "إغلاق المعاينة", exact: true })
    .click();
  await page
    .getByRole("button", { name: "تصدير للطباعة", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "صيغة ملف الطباعة", exact: true })
    .selectOption("svg");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "تنزيل ملف الطباعة", exact: true })
    .click();
  const svg = await fs.readFile((await (await download).path())!, "utf8");
  expect(svg).toContain(`width="${g.width}mm"`);
  expect(svg).toContain(`height="${g.height}mm"`);
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "تصميم العلب", exact: true }).click();
  await page.getByRole("button", { name: "علب البيتزا", exact: true }).click();
  await page.getByRole("button", { name: "فتح MY PIZZA", exact: true }).click();
  await expect(page.locator(".carton-editor-bar")).toContainText(
    "45 × 330 × 320 mm",
  );
  expect(errors).toEqual([]);
});
for (const language of ["ar", "en"])
  test(
    "custom hinged sizes belong to the chosen family on mobile " + language,
    async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(
        (lang) => localStorage.setItem("unitool-lang", lang),
        language,
      );
      await gallery(page);
      const ar = language === "ar";
      await page
        .getByRole("button", {
          name: ar ? "علب المخبوزات" : "Bakery boxes",
          exact: true,
        })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page
        .getByRole("button", {
          name: ar ? "قوالب العلب والمقاسات" : "Carton templates & dimensions",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("spinbutton", {
          name: ar ? "ارتفاع العلبة بالملليمتر" : "Box height in millimetres",
          exact: true,
        }),
      ).toHaveValue("60");
      await page
        .getByRole("button", {
          name: ar
            ? "إنشاء تصميم جديد بالقالب"
            : "Create a new design with this template",
          exact: true,
        })
        .click();
      await expect(page.locator("#editor-layout")).toBeVisible();
      await saveAndWait(page, ar);
      const project = (await storedProjects(page)).find(
        (p) => p.packaging?.size.family === "bakery",
      )!;
      expect(project.packaging.size.family).toBe("bakery");
      expect(project.packaging.kind).toBe("hinged-lid");
    },
  );
test("visible gallery cards use actual textured 3D renders without persisting mockup images", async ({
  page,
}) => {
  await gallery(page);
  const before = JSON.stringify(await storedProjects(page));
  await page.getByRole("button", { name: "علب البيتزا", exact: true }).click();
  const card = page.locator('[data-carton-preset="pizza-6"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("[data-photo-ready=true]")).toBeVisible({
    timeout: 30000,
  });
  const image = card.locator("img");
  expect(await image.getAttribute("src")).toMatch(/^blob:/);
  expect(
    await image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBe(600);
  await page.screenshot({
    path: ".cache/touch-browser/pizza-realistic-cards.png",
  });
  expect(JSON.stringify(await storedProjects(page))).toBe(before);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) =>
        /thumbnail|mockup|preview-image/i.test(k),
      ),
    ),
  ).toBe(false);
});
