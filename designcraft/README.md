# Design Craft / المصمم

The editable graphics and carton workspace at `/designcraft.html`.

## Export controls and editable files

The ordinary Export dialog now includes **Include cut and crease lines** for carton projects. This applies to PNG/JPG/WebP, copied PNG, SVG and PDF. The physical **Print export** dialog also retains its guide option. Hiding guides affects only the output: object visibility and export flags are restored even if rendering fails. SVG omits the manufacturing objects entirely, while preserving the silhouette clip; PDF keeps actual-size geometry. Editable project files always retain the guides and carton metadata.

Choose **Editable project / مشروع قابل للتعديل** to download a `.unitool.json` file. Use **Import editable project / استيراد مشروع قابل للتعديل** on the dashboard or editor to open it in a separate design tab. Objects, text, styling, transforms, layers, canvas dimensions and carton metadata remain editable. Raster image originals are embedded as PNG data so the project does not depend on a temporary object URL or external image host. This is a project format, not an image/vector/print interchange standard. Font family names are retained; custom fonts themselves are not embedded and must remain available on the destination device/browser.

Imports require the versioned `unitool-designcraft` envelope. Validation rejects remote image URLs, SVG image data, executable pattern sources, prototype-related keys, unsupported object/filter types, nonfinite/oversized numeric values, and excessive nesting/complexity. Maximum input/output size is 32 MB; individual exported image sources are limited to 16 MP, with a 40 MP document-area cap and 1500 top-level imported objects. Origin-tainted images or unsupported resources produce an export error rather than an incomplete project. Browser-local storage quotas may be much smaller than 32 MB: if storing an import fails, the current design is not replaced and an explicit storage error is shown. Existing dashboard storage remains browser/profile-local; keep downloaded project files as backups. Original projects are not overwritten on import (a new ID is assigned). This format currently represents the active design canvas, not an archive of all open project tabs or external font files.

## Drag alignment and rulers

While dragging objects, a screen-only ruler displays **design-space pixels** (not manufacturing millimetres), adapting tick intervals to zoom. Pink alignment guides snap nearby left/center/right and top/center/bottom bounds to other visible objects or the canvas. Tolerance is 5 screen pixels, converted through zoom. Hold **Alt** to bypass snapping; the ruler remains visible. Locked axes are respected; carton manufacturing guides and members of an active multi-selection are excluded as reference targets. Guides/rulers are drawn on the interactive overlay, never serialized, included in undo history, or exported. They disappear on release. This is bounding-box alignment, not equal-gap distribution or glyph-baseline alignment.

## Independent text formatting

A new ordinary text object has an independent style map and no inherited shadow, outline, italic, underline or character-spacing state. Explicit heading/preset choices can still be bold/styled intentionally. Clearing **all characters** in an editable text box (or its properties editor) resets its formatting to ordinary Cairo, regular weight and a contrasting fill, removing per-character styles, effects and text curves. The box's position and font size are preserved, and unrelated text objects are unchanged. Partial edits preserve the existing formatting. Deleting a selected text object also resets the custom-text panel's previous font/color override choices before inserting the next ordinary text.

## Checks

```sh
npm run lint
npm run test:designcraft
npm run build
npm run test:designcraft:browser
```

For an existing preview, set `DESIGN_QA_URL=http://localhost:4173`; sandbox browser binaries can be selected through `STUDIO_CHROMIUM_PATH` and `LD_LIBRARY_PATH`. Browser checks exercise real drag alignment, full text deletion/retyping, project download/import including raster filters and carton metadata, unsafe imports, actual hidden-guide PNG pixels and SVG omission, physical print exports, and responsive dialogs.

## Advanced designer tools

Open **Advanced designer tools / أدوات المصمم المتقدمة** in the editor:

1. Distribute three or more objects with equal horizontal or vertical gaps.
2. Align edges and centers relative to the canvas or the selected objects.
3. Group, ungroup, and ungroup/edit/regroup individual members; operations support undo.
4. Set X/Y, bounding width/height and rotation numerically, with aspect locking and carton mm units. Unsupported skewed or mathematically ambiguous resizes are rejected rather than silently distorted.
5. Select and focus the six named carton faces.
6. Configure safe and bleed guides (0–8 mm). These overlays never appear in artwork exports. Physical print export has an explicit, initially unchecked bleed option; artwork must already extend into the bleed region.
7. Inspect a rotatable assembled-box preview textured with current artwork. This is a visual aid, not material, collision or fold certification.
8. Run preflight for hidden/outside objects, estimated image DPI, text safety near cuts/folds and text overflow. Findings are advisory, not print-shop certification.
9. Copy/paste text formatting without replacing words.
10. Clear formatting without deleting text.
11. Choose shrink-font, grow-box or overflow-warning text containment.
12. Reuse browser-local brand colors, available fonts and a raster logo across projects.
13. Browse automatic IndexedDB recovery snapshots (five per project, twenty overall, at most 8 MB each), restore or delete them. Recovery is debounced and storage can fail or be cleared; download editable projects for durable backups.
14. See dirty/saved/recovery status and receive unsaved-change navigation/exit warnings where supported by the browser. Failed saves do not clear the warning.
15. Download background/transparent PNG variants or 1–10 saved designs as a ZIP. Batch limits: 16 MP per design, 40 MB image data. Batch exports omit manufacturing guides.

The brand kit and recovery history are local to this browser/profile, not a cloud sync service. Fonts are referenced by family, not embedded. Text fitting is bounded (8–300 px), and overflow warnings should still be reviewed before print.

Verified for this expansion: **34 unit tests, 27 production-browser tests**, TypeScript checking and production build. Browser coverage includes mobile Arabic tools, grouping/undo, numeric sizing, text formatting/fitting, persisted brand assets, preflight including a tiny low-DPI raster, real ZIP downloads, recovery restore, failed-save warnings, textured box faces and print exports, alongside the prior editor/packaging regressions.
