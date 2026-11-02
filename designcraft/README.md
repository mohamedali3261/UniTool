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
