import { test, expect, type Page } from "@playwright/test";
import {
  cartonGeometry,
  DEFAULT_CARTON,
  MM_TO_PX,
} from "../../src/packaging/geometry";
import { storedProjects } from "./helpers/storage";
const base = process.env.DESIGN_QA_URL || "http://localhost:3000";
async function create(page: Page) {
  await page.goto(base + "/designcraft.html");
  await expect(
    page.getByRole("button", {
      name: "معاينة ثلاثية الأبعاد 360°",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
    .click();
await page
    .getByRole("button", { name: "قوالب العلب والمقاسات", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "اسم قالب العلبة", exact: true })
    .fill("3D QA");
  await page
    .getByRole("button", { name: "إنشاء تصميم جديد بالقالب", exact: true })
    .click();
  await expect(page.locator("#editor-layout")).toBeVisible();
}
async function preview(page: Page) {
  await page
    .getByRole("button", { name: "معاينة ثلاثية الأبعاد 360°", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "معاينة العلبة ثلاثية الأبعاد" }),
  ).toBeVisible({timeout:20000});
  await expect(page.getByTestId("carton-3d-stage")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  await expect(
    page.getByTestId("carton-3d-stage").locator("canvas"),
  ).toHaveCount(1);
}
test("carton only: all directions, mouse orbit, fold/unfold and cleanup without saving rasters", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await create(page);
  const before = (await storedProjects(page))[0];
  await preview(page);
  const stage = page.getByTestId("carton-3d-stage"),
    canvas = stage.locator("canvas");
  for (const name of [
    "الأمام",
    "اليمين",
    "الخلف",
    "اليسار",
    "الأعلى",
    "الأسفل",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "الأمام", exact: true }).click();
  const front = await canvas.screenshot();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, {
    steps: 12,
  });
  await page.mouse.up();
  await expect
    .poll(async () => Buffer.compare(front, await canvas.screenshot()))
    .not.toBe(0);
  await canvas.focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("+");
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "فرد القالب", exact: true }).click();
  await expect(stage).toHaveAttribute("data-fold", "0");
  await page.screenshot({ path: ".cache/touch-browser/carton3d-flat.png" });
  await page.getByRole("button", { name: "تجميع كامل", exact: true }).click();
  await expect(stage).toHaveAttribute("data-fold", "100");
  await page.screenshot({ path: ".cache/touch-browser/carton3d-closed.png" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await storedProjects(page))[0].canvasData).toEqual(before.canvasData);
  await preview(page);
  await page
    .getByRole("button", { name: "إغلاق المعاينة", exact: true })
    .click();
  expect(errors).toEqual([]);
});
test("actual sheet artwork maps to all six faces, without horizontal mirroring", async ({
  page,
}) => {
  await create(page);
  const g = cartonGeometry(DEFAULT_CARTON),
    s = DEFAULT_CARTON;
  const rect = (x: number, y: number, w: number, h: number, fill: string) => ({
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    left: x * MM_TO_PX,
    top: y * MM_TO_PX,
    width: w * MM_TO_PX,
    height: h * MM_TO_PX,
    fill,
    strokeWidth: 0,
    id: "art-" + fill,
  });
  const fixture = [
    ...g.panels.map((p, i) =>
      rect(
        p.x,
        p.y,
        p.width,
        p.height,
        ["#ee2233", "#eeee22", "#3344ee", "#22eeee"][i],
      ),
    ),
    rect(
      g.panels[0].x + s.width / 2,
      g.panels[0].y,
      s.width / 2,
      s.height,
      "#22ee44",
    ),
    rect(g.panels[0].x, g.panels[0].y - s.depth, s.width, s.depth, "#ee33dd"),
    rect(g.panels[2].x, g.panels[2].y + s.height, s.width, s.depth, "#ee9922"),
  ];
  await page.evaluate(async (fixture) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("designcraft-projects", 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("projects", "readwrite"),
        store = tx.objectStore("projects"),
        r = store.getAll();
      r.onsuccess = () => {
        const p = r.result.find((p: any) => p.title === "3D QA");
        p.canvasData.objects.push(...fixture);
        store.put(p);
      };
      tx.oncomplete = () => resolve();
    });
    db.close();
  }, fixture);
  await page.reload();
  await page.getByRole("button", { name: /مشاريعي/ }).click();
  await page.getByRole("heading", { name: "3D QA", exact: true }).click();
  await preview(page);
  async function pixels(name: string) {
    await page.getByRole("button", { name, exact: true }).click();
    const png = await page
      .getByTestId("carton-3d-stage")
      .locator("canvas")
      .screenshot();
    return page.evaluate(async (data) => {
      const bitmap = await createImageBitmap(
          await (await fetch("data:image/png;base64," + data)).blob(),
        ),
        c = document.createElement("canvas");
      c.width = bitmap.width;
      c.height = bitmap.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let red = 0,
        green = 0,
        rx = 0,
        gx = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 150 && d[i] > d[i + 1] * 1.5 && d[i] > d[i + 2] * 1.5) {
          red++;
          rx += (i / 4) % c.width;
        }
        if (
          d[i + 1] > 150 &&
          d[i + 1] > d[i] * 1.5 &&
          d[i + 1] > d[i + 2] * 1.5
        ) {
          green++;
          gx += (i / 4) % c.width;
        }
      }
      const index =
        (Math.floor(c.height / 2) * c.width + Math.floor(c.width / 2)) * 4;
      return {
        center: Array.from(d.slice(index, index + 3)),
        red,
        green,
        redX: rx / red,
        greenX: gx / green,
      };
    }, png.toString("base64"));
  }
  const front = await pixels("الأمام");
  expect(front.red).toBeGreaterThan(500);
  expect(front.green).toBeGreaterThan(500);
  expect(front.redX).toBeLessThan(front.greenX);
  const right = (await pixels("اليمين")).center;
  expect(right[0]).toBeGreaterThan(right[2] * 1.25);
  expect(right[1]).toBeGreaterThan(right[2] * 1.25);
  const back = (await pixels("الخلف")).center;
  expect(back[2]).toBeGreaterThan(back[0] * 1.25);
  const left = (await pixels("اليسار")).center;
  expect(left[1]).toBeGreaterThan(left[0] * 1.25);
  expect(left[2]).toBeGreaterThan(left[0] * 1.25);
  const top = (await pixels("الأعلى")).center;
  expect(top[0]).toBeGreaterThan(top[1] * 1.25);
  expect(top[2]).toBeGreaterThan(top[1] * 1.25);
  const bottom = (await pixels("الأسفل")).center;
  expect(bottom[0]).toBeGreaterThan(bottom[2] * 1.25);
  expect(bottom[1]).toBeGreaterThan(bottom[2] * 1.25);
});
test("mobile touch view stays inside viewport and fold controls work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await create(page);
  await preview(page);
  const dialog = page.getByRole("dialog");
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  const canvas = page.getByTestId("carton-3d-stage").locator("canvas"),
    box = (await canvas.boundingBox())!,
    before = await canvas.screenshot();
  const session = await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * 0.4, y: box.y + box.height * 0.5 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: box.x + box.width * 0.7, y: box.y + box.height * 0.7 }],
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () => Buffer.compare(before, await canvas.screenshot()))
    .not.toBe(0);
  await page.getByRole("button", { name: "فرد القالب", exact: true }).click();
  await page.getByRole("button", { name: "تجميع كامل", exact: true }).click();
  await page.getByRole("button", { name: "الأسفل", exact: true }).click();
  await page.screenshot({ path: ".cache/touch-browser/carton3d-mobile.png" });
  await page
    .getByRole("button", { name: "إغلاق المعاينة", exact: true })
    .click();
});
test("WebGL unavailable has an actionable fallback, and can close safely", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: any,
      ...args: any[]
    ) {
      if (String(type).includes("webgl")) return null;
      return original.call(this, type, ...args);
    } as any;
  });
  await create(page);
  await page
    .getByRole("button", { name: "معاينة ثلاثية الأبعاد 360°", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("WebGL");
  await expect(
    page.getByRole("button", { name: "إعادة التحميل", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "إغلاق المعاينة", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("isolated artwork atlas preserves image crop, source viewport/selection, physical mask and excludes guides", async ({
  page,
}) => {
  await page.goto(base + "/designcraft.html");
  const result = await page.evaluate(async () => {
    const modulePath = "/designcraft/src/packaging/preview3d/atlas.ts",
      fabricPath = "/node_modules/.vite/deps/fabric.js",
      geometryPath = "/designcraft/src/packaging/geometry.ts",
      boundaryPath = "/designcraft/src/packaging/boundary.ts";
    const { cartonAtlas } = await import(modulePath),
      { fabric } = (await import(fabricPath)).default,
      {
        DEFAULT_CARTON: size,
        cartonGeometry,
        MM_TO_PX: px,
      } = await import(geometryPath),
      { applyCartonBoundary } = await import(boundaryPath);
    const g = cartonGeometry(size),
      p = g.panels[0],
      source = new fabric.Canvas(null, {
        width: g.width * px,
        height: g.height * px,
        backgroundColor: "#fff",
        enableRetinaScaling: false,
      });
    const image = document.createElement("canvas");
    image.width = 128;
    image.height = 64;
    const ctx = image.getContext("2d")!;
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#b41edc";
    ctx.fillRect(64, 0, 64, 64);
    const object = new fabric.Image(image, {
      left: p.x * px,
      top: p.y * px,
      width: 64,
      height: 64,
      cropX: 64,
      scaleX: (size.width * px) / 64,
      scaleY: (size.height * px) / 64,
    });
    source.add(object);
    const guide = new fabric.Rect({
      left: p.x * px,
      top: p.y * px,
      width: size.width * px,
      height: size.height * px,
      fill: "red",
      id: "packaging-qa-guide",
      strokeWidth: 0,
    });
    source.add(guide);
    applyCartonBoundary(source, size);
    source.setActiveObject(object);
    source.setViewportTransform([0.4, 0, 0, 0.4, -231, 38]);
    const before = JSON.stringify(source.toJSON(["id"])),
      viewport = [...source.viewportTransform];
    const atlas = await cartonAtlas(
      source,
      size,
      g.width * px,
      g.height * px,
      512,
    );
    const at = (x: number, y: number) =>
      Array.from(
        atlas.image
          .getContext("2d")
          .getImageData(
            Math.floor(x * atlas.pixelsPerMm),
            Math.floor(y * atlas.pixelsPerMm),
            1,
            1,
          ).data,
      );
    const result = {
      inside: at(p.x + size.width / 2, p.y + size.height / 2),
      outside: at(5, 5),
      unchanged: JSON.stringify(source.toJSON(["id"])) === before,
      selected: source.getActiveObject() === object,
      viewport:
        JSON.stringify(source.viewportTransform) === JSON.stringify(viewport),
      maxEdge: Math.max(atlas.image.width, atlas.image.height),
    };
    atlas.dispose();
    source.dispose();
    return result;
  });
  expect(result.inside).toEqual([180, 30, 220, 255]);
  expect(result.outside[3]).toBe(0);
  expect(result.unchanged).toBe(true);
  expect(result.selected).toBe(true);
  expect(result.viewport).toBe(true);
  expect(result.maxEdge).toBeLessThanOrEqual(512);
});

test("English labels and recovering after WebGL context loss", async ({
  page,
}) => {
  await create(page);
  await page.evaluate(() => {
    localStorage.setItem("unitool-lang", "en");
    window.dispatchEvent(
      new CustomEvent("unitool-lang-change", { detail: "en" }),
    );
  });
  await page
    .getByRole("button", { name: "3D preview · 360°", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "3D carton preview", exact: true }),
  ).toBeVisible({timeout:20000});
  await expect(page.getByTestId("carton-3d-stage")).toHaveAttribute(
    "data-ready",
    "true",
    {timeout:30000},
  );
  await page.getByRole("button", { name: "Bottom", exact: true }).click();
  await page
    .getByTestId("carton-3d-stage")
    .locator("canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(page.getByRole("alert")).toContainText("context was lost");
  await page
    .getByRole("button", { name: "Reload preview", exact: true })
    .click();
  await expect(page.getByTestId("carton-3d-stage")).toHaveAttribute(
    "data-ready",
    "true",
    {timeout:30000},
  );
  await expect(
    page.getByTestId("carton-3d-stage").locator("canvas"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Close preview", exact: true })
    .click();
});
