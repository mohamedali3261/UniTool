import test from "node:test";
import assert from "node:assert/strict";
import module from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  formatCartonDims,
  formatSheetDims,
  formatUnitNumber,
  mmToUnit,
  unitAriaSuffix,
  unitShortLabel,
  unitToMm,
} from "../src/packaging/units";
import { DEFAULT_CARTON, cartonGeometry } from "../src/packaging/geometry";
import { DEFAULT_PRINT } from "../src/advanced/core/faces";
import { isPackagingProject, packagingProjects } from "../src/packaging/projectScope";
import { createCartonProject } from "../src/packaging/project";

if ("registerHooks" in module && typeof (module as any).registerHooks === "function") {
  (module as any).registerHooks({
    load(url: string, context: unknown, nextLoad: Function) {
      if (url.endsWith(".css")) {
        return { format: "module", shortCircuit: true, source: "" };
      }
      return nextLoad(url, context);
    },
  });
}

test("converts exact decimal values between mm and cm without floating-point drift", () => {
  assert.equal(mmToUnit(105, "cm"), 10.5);
  assert.equal(mmToUnit(65, "cm"), 6.5);
  assert.equal(mmToUnit(35, "cm"), 3.5);
  assert.equal(mmToUnit(120, "mm"), 120);

  assert.equal(unitToMm(10.5, "cm"), 105);
  assert.equal(unitToMm(6.5, "cm"), 65);
  assert.equal(unitToMm(3.5, "cm"), 35);
  assert.equal(unitToMm(1.25, "cm"), 12.5);
  assert.equal(unitToMm(120, "mm"), 120);
});

test("formats carton and sheet dimensions cleanly in Arabic and English", () => {
  const sample = { height: 120, width: 65, depth: 45, glue: 14, tuck: 15 };
  assert.equal(formatUnitNumber(120, "cm"), "12");
  assert.equal(formatUnitNumber(65, "cm"), "6.5");
  assert.equal(formatCartonDims(sample, "cm", true), "12 × 6.5 × 4.5 سم");
  assert.equal(formatCartonDims(sample, "cm", false), "12 × 6.5 × 4.5 cm");
  assert.equal(formatCartonDims(sample, "mm", true), "120 × 65 × 45 mm");
  assert.equal(formatSheetDims(262, 234, "cm", true), "26.2 × 23.4 سم");
  assert.equal(unitShortLabel("cm", true), "سم");
  assert.equal(unitAriaSuffix("cm", true), " بالسنتيمتر");
  assert.equal(unitAriaSuffix("mm", true), " بالملليمتر");
});

test("CartonResizeDialog and PackagingDialog support both mm default mode and cm (سم) editing mode", async () => {
  const { CartonResizeDialog } = await import("../src/packaging/CartonResizeDialog");
  const { PackagingDialog } = await import("../src/packaging/PackagingDialog");

  const mmHtml = renderToStaticMarkup(
    React.createElement(CartonResizeDialog, {
      size: DEFAULT_CARTON,
      initialUnit: "mm",
      onClose: () => {},
      onApply: async () => {},
    }),
  );
  assert.match(mmHtml, /طول العلبة بالملليمتر/);
  assert.match(mmHtml, /عرض العلبة بالملليمتر/);
  assert.match(mmHtml, /عمق العلبة بالملليمتر/);
  assert.match(mmHtml, /resize-unit-cm/);

  const cmHtml = renderToStaticMarkup(
    React.createElement(CartonResizeDialog, {
      size: { height: 120, width: 65, depth: 45, glue: 14, tuck: 15 },
      initialUnit: "cm",
      onClose: () => {},
      onApply: async () => {},
    }),
  );
  assert.match(cmHtml, /طول العلبة بالسنتيمتر/);
  assert.match(cmHtml, /عرض العلبة بالسنتيمتر/);
  assert.match(cmHtml, /عمق العلبة بالسنتيمتر/);
  assert.match(cmHtml, /value="12"/);
  assert.match(cmHtml, /value="6\.5"/);
  assert.match(cmHtml, /value="4\.5"/);

  const pkgDialogCmHtml = renderToStaticMarkup(
    React.createElement(PackagingDialog, {
      initial: DEFAULT_CARTON,
      initialUnit: "cm",
      onClose: () => {},
      onCreate: () => {},
    }),
  );
  assert.match(pkgDialogCmHtml, /طول العلبة بالسنتيمتر/);
  assert.match(pkgDialogCmHtml, /262 × 234 mm/);
  assert.match(pkgDialogCmHtml, /26\.2 × 23\.4 سم/);
});

test("CartonStudioTab renders cm live resizer, 6 carton faces, and packaging stamps", async () => {
  const { CartonStudioTab } = await import(
    "../src/components/Editor/Sidebar/CartonStudioTab"
  );
  const sample = { height: 120, width: 65, depth: 45, glue: 14, tuck: 15 };
  const g = cartonGeometry(sample);
  const html = renderToStaticMarkup(
    React.createElement(CartonStudioTab, {
      size: sample,
      canvas: null,
      printSettings: DEFAULT_PRINT,
      onUpdatePrintSettings: () => {},
      onResizeCarton: () => {},
      onOpenResizeModal: () => {},
      onFocusFace: () => {},
      onOpen3D: () => {},
      onOpenPrint: () => {},
      onCanvasMutated: () => {},
    }),
  );

  assert.match(html, /carton-studio-tab/);
  assert.match(html, /value="12"/);
  assert.match(html, /value="6\.5"/);
  assert.match(html, /value="4\.5"/);
  assert.match(html, new RegExp(formatSheetDims(g.width, g.height, "cm", true)));
  assert.match(html, /carton-face-btn-front/);
  assert.match(html, /carton-face-btn-back/);
  assert.match(html, /stamp-barcode/);
  assert.match(html, /stamp-recycle/);
  assert.match(html, /stamp-origin/);
});

test("TemplatesTab and CanvasProperties cleanly separate Packaging vs Graphic Studios", async () => {
  const { TemplatesTab } = await import(
    "../src/components/Editor/Sidebar/TemplatesTab"
  );
  const { CanvasProperties } = await import(
    "../src/components/Editor/PropertiesPanel/CanvasProperties"
  );
  const sample = { height: 120, width: 65, depth: 45, glue: 14, tuck: 15 };

  const pkgTplHtml = renderToStaticMarkup(
    React.createElement(TemplatesTab, {
      onApplyTemplate: () => {},
      packagingSize: sample,
      onApplyCartonTheme: () => {},
    }),
  );
  assert.match(pkgTplHtml, /packaging-templates-panel/);
  assert.match(pkgTplHtml, /carton-theme-emerald-atelier/);

  const graphicTplHtml = renderToStaticMarkup(
    React.createElement(TemplatesTab, {
      onApplyTemplate: () => {},
    }),
  );
  assert.doesNotMatch(graphicTplHtml, /packaging-templates-panel/);

  const pkgPropsHtml = renderToStaticMarkup(
    React.createElement(CanvasProperties, {
      width: 1000,
      height: 800,
      isPackaging: true,
      packagingSize: sample,
      backgroundColor: "#ffffff",
      onResizeCanvas: () => {},
      onResizeCarton: () => {},
      onSetBackgroundColor: () => {},
      onSetBackgroundGradient: () => {},
    }),
  );
  assert.match(pkgPropsHtml, /packaging-properties-panel/);
  assert.match(pkgPropsHtml, /كرافت طبيعي/);

  const graphicPropsHtml = renderToStaticMarkup(
    React.createElement(CanvasProperties, {
      width: 1080,
      height: 1080,
      isPackaging: false,
      backgroundColor: "#ffffff",
      onResizeCanvas: () => {},
      onSetBackgroundColor: () => {},
      onSetBackgroundGradient: () => {},
    }),
  );
  assert.doesNotMatch(graphicPropsHtml, /packaging-properties-panel/);
});

test("packaging and graphic projects stay strictly separated across studio shelves", async () => {
  const { PackagingPage } = await import("../src/packaging/PackagingPage");

  const boxProj = createCartonProject(DEFAULT_CARTON, "Perfume Box Luxury");
  const graphicProj = {
    id: "graphic-1",
    title: "Social Post Campaign",
    width: 1080,
    height: 1080,
    canvasData: { objects: [] },
    category: "social",
    createdAt: 1,
    updatedAt: 1,
  };
  assert.equal(isPackagingProject(boxProj), true);
  assert.equal(isPackagingProject(graphicProj), false);
  assert.equal(packagingProjects([boxProj, graphicProj], "all").length, 1);
  assert.equal(
    [boxProj, graphicProj].filter((p) => !isPackagingProject(p)).length,
    1,
  );

  // Render PackagingPage with mixed projects: must display Templates + Dimensions + Saved Box ONLY
  const allBoxHtml = renderToStaticMarkup(
    React.createElement(PackagingPage, {
      onCreate: () => {},
      projects: [boxProj, graphicProj],
      sectionView: "all",
    }),
  );
  assert.match(allBoxHtml, /packaging-section-pills/);
  assert.match(allBoxHtml, /packaging-quick-builder/);
  assert.match(allBoxHtml, /قوالب العلب الجاهزة/);
  assert.match(allBoxHtml, /packaging-projects/);
  assert.match(allBoxHtml, /Perfume Box Luxury/);
  assert.doesNotMatch(allBoxHtml, /Social Post Campaign/);

  // Saved-only section view inside PackagingPage
  const savedOnlyBoxHtml = renderToStaticMarkup(
    React.createElement(PackagingPage, {
      onCreate: () => {},
      projects: [boxProj, graphicProj],
      sectionView: "saved",
    }),
  );
  assert.match(savedOnlyBoxHtml, /packaging-projects/);
  assert.match(savedOnlyBoxHtml, /Perfume Box Luxury/);
  assert.doesNotMatch(savedOnlyBoxHtml, /packaging-quick-builder/);
  assert.doesNotMatch(savedOnlyBoxHtml, /Social Post Campaign/);
});
