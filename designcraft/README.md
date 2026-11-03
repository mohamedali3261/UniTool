# Design Craft / المصمم

The editable graphics and carton workspace at `/designcraft.html`.

## Export controls and editable files

The ordinary Export dialog now includes **Include cut and crease lines** for carton projects. This applies to PNG/JPG/WebP, copied PNG, SVG and PDF. The physical **Print export** dialog also retains its guide option. Hiding guides affects only the output: object visibility and export flags are restored even if rendering fails. SVG omits the manufacturing objects entirely, while preserving the silhouette clip; PDF keeps actual-size geometry. Editable project files always retain the guides and carton metadata.

Choose **Editable project / مشروع قابل للتعديل** to download a `.unitool.json` file. Use **Import editable project / استيراد مشروع قابل للتعديل** on the dashboard or editor to open it in a separate design tab. Objects, text, styling, transforms, layers, canvas dimensions and carton metadata remain editable. Raster image originals are embedded as PNG data so the project does not depend on a temporary object URL or external image host. This is a project format, not an image/vector/print interchange standard. Font family names are retained; custom fonts themselves are not embedded and must remain available on the destination device/browser.

Imports require the versioned `unitool-designcraft` envelope. Validation rejects remote image URLs, SVG image data, executable pattern sources, prototype-related keys, unsupported object/filter types, nonfinite/oversized numeric values, and excessive nesting/complexity. Maximum input/output size is 32 MB; individual exported image sources are limited to 16 MP, with a 40 MP document-area cap and 1500 top-level imported objects. Origin-tainted images or unsupported resources produce an export error rather than an incomplete project. Browser-local storage quotas may be much smaller than 32 MB: if storing a valid import fails, it can still open in a new session-only tab with an explicit warning and unsaved-change protection. It is not listed as durably saved; download a project backup before leaving. Existing dashboard storage remains browser/profile-local; keep downloaded project files as backups. Original projects are not overwritten on import (a new ID is assigned). This format currently represents the active design canvas, not an archive of all open project tabs or external font files.

## Drag alignment and rulers

While dragging objects, a screen-only ruler displays **design-space pixels** (not manufacturing millimetres), adapting tick intervals to zoom. Pink alignment guides snap nearby left/center/right and top/center/bottom bounds to other visible objects or the canvas. Tolerance is 5 screen pixels, converted through zoom. Hold **Alt** to bypass snapping; the ruler remains visible. Locked axes are respected; carton manufacturing guides and members of an active multi-selection are excluded as reference targets. Guides/rulers are drawn on the interactive overlay, never serialized, included in undo history, or exported. They disappear on release. This is bounding-box alignment, not equal-gap distribution or glyph-baseline alignment.

## Independent text formatting

A new ordinary text object has an independent style map and no inherited shadow, outline, italic, underline or character-spacing state. Explicit heading/preset choices can still be bold/styled intentionally. Clearing **all characters** in an editable text box (or its properties editor) resets its formatting to ordinary Cairo, regular weight and a black fill, removing per-character styles, effects and text curves. The box's position and font size are preserved, and unrelated text objects are unchanged. Partial edits preserve the existing formatting. Deleting a selected text object also resets the custom-text panel's previous font/color override choices before inserting the next ordinary text.

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

## Curved-text stability (Fabric 5)

`utils/textPathRevival.ts` repairs Fabric 5's `IText`/`Textbox` JSON loaders: unlike `Text`, they otherwise leave `path` as a plain object, causing `path.isNotVisible is not a function` on render. It preserves the stock style migration and revives the path before handing the text to a canvas/group/clone callback. The installer is idempotent and runs at application startup, covering existing saved projects, undo/redo, recovery and batch loading without deleting the curve. Canvas cleanup also cancels the initial fit timer and ignores late font-ready callbacks after disposal.

The curved-text browser regression covers all three text types, automatic recovery and restoration, undo/redo, copy/paste, grouping and editable export/reimport, checking path preservation and uncaught page errors. This reproduces a specific rendering failure; it is not a guarantee against every possible browser memory-related reload.

## Stability review and compact file actions

The editor navbar now has one **Import / Export** disclosure (shortened to **Files** on mobile), containing editable-project import, export settings and quick PNG. The dashboard retains its import entry point; the editor no longer has a floating duplicate. The disclosure supports Escape, outside-click dismissal, focus return and keyboard tab navigation. The logo remains visible in a wrapped mobile navbar.

The export dialog is capped at 384 px wide and 90% of viewport height with a scrollable body, compact format controls, modal focus containment and blocked editor shortcuts behind it. Raster allocation is checked before Fabric creates its export surface: at most 40 MP and 16384 px per side. Oversized raster choices show a warning and disable download; failed raster generation is not reported as a successful download. This is a safety bound, not a promise that every device can allocate the full limit.

Additional hardening prevents repeated canvas mounts from stacking style-serializer wrappers, ignores late image/clone callbacks after disposal, blocks overlapping undo/redo loads and guards deferred face-focus callbacks. The mixed-artwork browser test repeatedly edits and undoes/redoes a document containing grouped gradient text, shadows and a clipped raster; it waits for the real recovery debounce in six idle cycles and asserts no page error or navigation. It is a short repeatability test, not an hours-long memory endurance measurement.

Latest verification: **37 unit tests, 30 production-browser tests**, TypeScript checking and production build passed. Production build still reports the existing large-chunk advisory.


## Arabic shortcuts and safer canvas interaction

Editor commands use physical `KeyboardEvent.code` letters (with a key fallback), so Ctrl/Cmd+A/C/X/V/D/S/Z/Y work with Arabic hardware keyboard layouts. Text inputs, editable fields, composition events and modal dialogs keep their native editing behavior. **H** selects the hand tool, **V** returns to selection, **Space + drag** temporarily pans and the middle mouse button pans without grabbing artwork. The canvas has visible Select/Pan buttons, blur releases temporary Space mode, and captured mouse/touch gestures prevent Fabric from moving objects during hand/pinch operations.

Ordinary wheel/trackpad input scrolls the workspace; Ctrl/Cmd+wheel zooms. Oversized artboards use non-shrinking, auto-margin layout so their top/left edges remain reachable. Selection has zero added padding; images use pixel hit-testing so transparent pixels do not capture clicks. Text retains rectangular box hit-testing so double-click editing is reliable (textbox bounds remain the actual editable wrapping box, not a glyph contour).

Text properties include an explicit **Text content** textarea with empty-string preservation and Arabic typing. Blank custom-add submissions do nothing rather than create placeholder text. Plain new/fully cleared text defaults to **#000000 on every background**; existing intentional colors and styled presets remain editable. Fully clearing a styled text still resets formatting without inserting content, moving the object or changing font size.

Verification for these interaction changes: **38 unit tests and 34 production-browser tests**, TypeScript checking and production build passed. New browser checks cover Arabic-key shortcut dispatch, copy/cut/paste/undo/redo, permanent and temporary mouse pan, touch pan/pinch without artwork transforms, text clearing/retyping, and scrollable oversized artboards. Touch coverage uses Chromium emulation, not physical-device certification.

## Editable print-template collection

The Templates sidebar adds **16 templates**, each in its own file under `src/data/templates/print/`:

| Category | Count | Suggested trim sizes |
| --- | ---: | --- |
| Stickers / labels | 4 | 50×50, 60×60, 70×45, 45×70 mm |
| Business cards | 6 | 90×50, 85×55, 50×90 mm |
| Thank-you inserts | 2 | 100×70 mm |
| Product / gift tags | 2 | 50×90, 55×85 mm |
| Flyers | 2 | A5 (148×210 mm) |

All text, circles and rectangles become ordinary editable Fabric objects, not flattened preview images. Each template uses exact pixel dimensions calculated from its suggested trim size at 300 DPI; those dimensions appear alongside its mm size. Applying a template asks before replacing existing artwork, clears stale selection and batches object replacement into one history record. Carton dimension guards remain in place. Card fronts and backs are separate templates/projects, not automatic duplex pages.

Template favorites are saved locally in `designcraft-template-favorites`, synchronized between desktop/mobile sidebar instances, and remain usable temporarily with a visible warning if storage fails. Orientation filtering supports landscape, portrait and square; reset clears search/category/orientation/favorites-only filters without deleting favorite selections. Existing Arabic/English text search and categorized previews remain available.

**Printing limitations:** mm sizes are suggestions corresponding to the base pixels at 300 DPI, not embedded print-job instructions. Ask the printer to use the displayed physical dimensions. Ordinary raster exports do not guarantee 300-DPI metadata. These templates do not automatically add bleed, safe-area guides, die-cut paths, punched holes, color-profile conversion or CMYK output. Round stickers still have a square canvas with a round visual design; tag dots are artwork, not manufacturing commands. Replace sample contact details, prices, dates and product claims, then obtain a proof before production.

Verified: **40 unit tests and 36 production-browser tests**, TypeScript checking and production build passed. Browser coverage applies every new template, checks exact canvas dimensions and editable text/shape content, and verifies favorite persistence and orientation/reset behavior alongside prior regressions.


## Mobile import and viewport-safe file menu

The custom-dimensions section now includes **Import project from file / استيراد مشروع من ملف**, using the same validated JSON importer as the editor file menu. The old floating dashboard import button is removed to avoid duplicate controls.

A refused localStorage write (for example browser-origin quota or privacy/security restrictions) no longer prevents opening a valid imported design. It opens as an explicitly **session-only, unsaved** project with a warning explaining that browser storage limits are separate from free device space. The original projects are not overwritten or cleared to make room. Download the current editable project before closing; this fallback does not increase storage quota or guarantee automatic recovery. If a later normal save succeeds, the warning and unsaved status clear. Existing leave confirmation remains authoritative; cancelling it does not open the newly imported project. Temporary tabs are not discarded merely because they have no persistent project record.

The file dropdown is portaled outside the navbar's transformed/backdrop-filter container and positioned against the visual viewport. Horizontal position, vertical position, width and scrollable height are clamped; resize/scroll/visual-viewport changes reposition it. Outside-click, focus return, Escape and ArrowDown opening work across the portal in RTL and LTR.

Verified: **40 unit tests, 40 production-browser tests**, TypeScript checking and production build passed. Mobile tests simulate both QuotaExceededError and SecurityError, export the unsaved imported artwork, then restore storage and verify a real save. Dropdown checks cover Arabic/English at 320 px, 390 px and landscape 640×320. These are Chromium-emulated viewports, not physical Safari/Android device certification.

## Properties-panel and color-control refresh

The properties panel now uses a wider desktop layout, clearer RTL-aware headings, readable help text, constrained/shrinkable form controls, and a scrollable body that does not force horizontal overflow. Type labels are human-readable rather than raw Fabric type names. Duplicate and lock/unlock actions are available at the top. Text properties include **Clear formatting, keep text**, which uses the existing text-formatting operation and records an undoable edit without deleting words.

All shared color controls now use `Common/FloatingPopover.tsx` instead of an absolutely positioned child of the property card. The popover portals outside clipped/stacked sections (or into the nearest native dialog when applicable), clamps placement to the visual viewport, scrolls internally when height is limited, and follows viewport/scroll/resize changes. Outside click/focus dismisses it; Escape and successful selection return focus to the trigger. Keyboard events in the color panel do not activate canvas shortcuts. A visible Close button is provided.

Color improvements include up to eight recently used HEX colors (best-effort browser-local persistence), separately named native and HEX inputs, validation feedback, correct native-picker values for shorthand/alpha HEX colors, and rejection of typed transparency when that control disables it. Gradient help distinguishes actual gradient application from first-color-only controls. Arabic property copy has been shortened and simplified to avoid lengthy bilingual labels.

Verified on the production build: **41 unit tests and 45 browser tests**, TypeScript checking and build passed. New checks cover color-popup bounds, internal overflow and actual topmost hit-testing above sections in Arabic/English desktop/mobile views, invalid/valid HEX entry, recent-color reuse, Escape focus return, and clear-format/undo/duplicate/lock behavior. These checks do not certify every browser's OS-native color dialog or every physical-device keyboard configuration.

## Layer manager: pointer drag on desktop and mobile

The Layers sidebar now uses a dedicated touch-safe drag handle rather than HTML drag-and-drop. Pointer capture, a movement threshold, drop highlighting, edge auto-scroll and cancellation (Escape, pointer cancellation, blur or the Cancel button) keep ordinary row scrolling separate from reordering. A completed drop commits one layer-order edit; cancelling or releasing outside the list does not reorder. Topmost rows represent frontmost objects. Arrow buttons and **Alt+ArrowUp/Down** on a focused handle are keyboard alternatives.

Additional tools include layer-name search, visible/hidden/locked filters with counts, inline rename (Enter/blur commits; Escape cancels), duplicate, selection highlighting, visibility and lock toggles. Actions target their own row rather than whichever canvas object happens to be selected. Missing/duplicate layer IDs are normalized to stable unique IDs and names/IDs persist through project saves. Top-level groups remain one layer; this is not a nested group-member tree.

Locked artwork cannot be dragged, reordered, duplicated or deleted from the layer actions; deletion via the canvas delete helper also respects locks. Carton manufacturing guides are labeled and protected against rename/reorder/duplication/deletion/unlock. Their visibility remains adjustable. Layer deletion and drag-order changes support single-step undo. Mobile drawer backdrops stop above the bottom navigation bar so switching tools remains reachable while a sheet is open.

Verified: **41 unit tests and 51 production-browser tests**, TypeScript checking and build passed. Six layer-specific browser tests exercise mouse drag in desktop/mobile viewports, actual Chromium touch events in Arabic RTL, cancellation, auto-scroll over a 20-layer list, single-step delete/reorder undo, row-targeted actions, rename/filter/lock/duplicate, stable IDs, keyboard reordering and protected carton guides. Emulated touch coverage is not a physical-device certification.

## Mobile import memory and real file downloads

The editor fits the initial backing canvas before allocation and batches layer updates during JSON initialization. Undo retains at most 30 states within a conservative 24 MB string budget (one oversized current state is retained); duplicate snapshots are skipped. Project thumbnails are capped at 320 px, previews at 1200 px on the longest side, and portable project exports reuse validated embedded raster sources instead of unnecessarily converting compressed JPEG/WebP assets to PNG. Objects, transforms and filters remain editable.

Raster downloads use asynchronous Blob encoding and attached download links whose URLs remain valid for 30 seconds. Ordinary PDF exports create an actual PDF with pdf-lib, without relying on print popups; embedding resolution adapts to the allocation budget while page dimensions are preserved. Raster output is limited to 12 MP on narrow/coarse-pointer devices and 40 MP otherwise, with quarter/half-size options for large artwork. Quick PNG no longer requires saving first, prevents simultaneous duplicate jobs and opens the resolution dialog when 2× exceeds the budget. Failed encoding leaves the export dialog available for retry. Packaging raster/PDF export also checks the device budget before allocating; reduce DPI or use SVG when necessary. These are allocation guards, not a guarantee that every device can handle every image/filter combination.

Verification: 42 unit tests, lint/TypeScript checks and production build passed. The complete production-browser suite passed 54 tests; after the final quick-export size-dialog fallback, the three mobile performance/export tests passed again. Coverage includes an 8000×5000 design with 500 objects, pre-fit allocation instrumentation, exact 2000×1250 reduced PNG output, actual PNG/JPEG/SVG/PDF/editable-project and quick-PNG downloads, no PDF popups, and retry after failed encoding. Chromium viewport/touch emulation is not physical iOS Safari or Android device certification. This change does not itself deploy the application.

## Touch-safe file-menu focus handling

The file menu no longer closes on a blur event with a null `relatedTarget`. Mobile browsers can produce that event during touch activation, removing the portaled menu before its action receives a click. Instead, confirmed outside `pointerdown` or `focusin` dismisses the menu; Escape and action selection still close it. Touch/mouse opening does not force focus into the panel, while keyboard activation and ArrowDown do. Native file-picker activation remains synchronous in the action click handler.

Verification: the null-target blur regression failed before the fix in Arabic and English. Three new tests use a touch-enabled mobile browser context and `tap()` to cover stable opening, import file chooser, export dialog, repeated toggle, outside dismissal, keyboard navigation and Escape/focus return. All **57 production-browser tests**, **42 unit tests**, lint/TypeScript checks and production build passed. This is Chromium touch emulation plus a simulated null-target focus event, not physical Safari/Android certification; no deployment is performed by this change.

## Direct canvas gestures instead of mode buttons

The visible Pan/Select switches are removed from both the toolbar and workspace. A drag starting on empty canvas/workspace pans the view; a gesture starting on artwork remains available to Fabric selection, object dragging, controls and text editing. Hit testing happens before consuming the gesture, and its intent stays fixed for that drag. H/V and temporary Space/middle-button panning remain keyboard/mouse alternatives. Fitted artboards can move using a view-only offset; oversized axes retain scroll-based navigation. Fit to Screen clears the view offset. Neither navigation path modifies saved artwork coordinates.

Plain mouse-wheel movement zooms the workspace without Ctrl, anchored to the pointer where scroll bounds allow. Wheel gestures over floating controls are not consumed. Two-finger pinch remains available. On narrow/coarse-pointer devices, workspace scroll rails are hidden without disabling scrolling or changing manufacturing guides.

Verification: **58 production-browser tests and 42 unit tests**, lint/TypeScript checks and production build passed. Existing pan/keyboard/pinch tests were adapted to the intentionally changed UI and wheel behavior. A new touch test verifies automatic blank-space pan, object dragging without viewport movement, hidden mobile rails, unchanged saved coordinates during view navigation, and fitted-artboard panning; its extended fitted-artboard assertions were also rerun successfully after the full suite. Physical-device certification and deployment are not implied.

### Click-release before moving artwork (supersedes first-drag object editing)

Unselected artwork now behaves like the workspace during the first drag. A completed mouse click or touch tap (at most 6 CSS px movement) selects the object on release; only a subsequent gesture on that selected object is passed through to Fabric for movement/controls/editing. Dragging never arms a new object, and pinch/cancel/blur clears pending selection. Empty-space clicks clear selection. Existing explicit pan shortcuts continue to override hit testing. This applies to desktop and touch input, without modifying artwork coordinates during navigation.

The floating object action HUD has been removed; properties/layer controls remain available outside the preview. Movement-time top/side ruler strips, tick labels and coordinate captions are removed from alignment rendering. Simple alignment lines and snapping remain, as do protected manufacturing guides.

Verified: **59 production-browser tests**, **42 unit tests**, lint/TypeScript and production build passed. New desktop/touch assertions distinguish first-drag navigation from click-release selection and subsequent object movement. Snapping regression now explicitly clicks/releases before dragging and instruments the upper canvas to verify no ruler text is drawn. Coverage remains emulated Chromium rather than physical-device certification. No deployment performed.
