# Carton dielines

Open **المصمم → قوالب العلب والمقاسات**. Creates one rectangular reverse-tuck construction matching the supplied reference: front/side/back/side panels, glue flap, opposite top/bottom covers and four tapered dust flaps.

All geometry is in millimetres. Defaults: 80 × 120 × 35 mm with 12 mm glue/tuck tabs. Flat sheet width = glue + 2×width + 2×depth + 20 mm; height = height + 2×(depth+tuck) + 20 mm. The extra 20 mm is a 10 mm outer margin on each side, not artwork bleed. Dimensions and tab proportions are validated. Paper guidance checks A4/A3 in both orientations.

The preview, SVG, vector PDF and native Fabric objects share `geometry.ts`. Standalone PDF contains only vector cutting/creasing guides at exact custom physical page size; SVG optionally includes dimension annotations. These standalone files do not include subsequent artwork. Print actual size / 100%, never fit-to-page.

Opening a template creates a separate design, preserving existing projects. Native guides cannot be deleted/unlocked through the layers controls. Metadata, silhouette and six-decimal Fabric serialization persist. The canvas-level cut mask confines all added images, text, shapes, groups and background to the unfolded carton outline, not individual faces. Artwork can cross folds. Native carton pixel resizing and incompatible exact-size templates are blocked to prevent accidental changes of physical scale.

**Print export** in the editor includes the complete clipped artwork, with optional cut/crease guides:
- SVG: exact-mm sheet, vector text/shapes and regenerated vector guides. Original fonts must be available; embedded raster images retain their source detail.
- PDF: exact-mm page, rasterized artwork at 300 or 600 DPI plus vector manufacturing guides. Appearance is fixed without requiring the recipient's fonts. This is not an all-vector artwork PDF.
- PNG: exact calculated pixel dimensions and real pHYs metadata (300/600 DPI). Pixel rounding means nominal physical size is approximate, unlike SVG/PDF.

Print dimensions do not depend on editor zoom/pan. Rendering uses a separate canvas and a full-resolution mask. Rasters are limited to 40 million pixels / 16,384 pixels per side; oversized requests fail visibly rather than silently downsampling. Low-resolution placed images trigger effective-DPI warnings: upsampling does not recover missing detail. Resized legacy canvases are rejected for physical print export. The general PDF action also routes cartons through the 300-DPI print pipeline; ordinary non-carton exports are unchanged. Generic PNG/JPEG exports remain screen/pixel exports: use **Print export** for DPI metadata.

**Manufacturing limits:** nominal geometry only, without paper-caliper, crease, tooling or machine compensation. No automatic bleed/safe-area generation or spot-color production separation. Exports are RGB, not certified CMYK or PDF/X. The small template-dialog assembled view is a proportional illustration. The editor’s interactive 3D view uses nominal hinged geometry, not a collision/physical fold simulation. Prototype, measure and confirm allowances/production suitability with your printer before production.

Checks: `npm run test:designcraft` and `npm run test:designcraft:browser`. Browser QA uses `DESIGN_QA_URL` and optional `STUDIO_CHROMIUM_PATH`; simulation is not physical-device/printer certification. PDF support is locally bundled and loaded on demand; no new runtime dependency is added.

The public dimensions UI uses **length × width × depth** (طول × عرض × عمق), with tab sizes under advanced settings. For compatibility with existing saved projects, the internal `height` key remains the assembled box length (vertical face axis); `width` and `depth` retain their existing axes. No saved project geometry or physical export scale is changed by this terminology update.

## Perfume starter cartons

Editable 30 / 50 / 100 ml capacity labels select these **suggested nominal** length × width × depth sizes: 95 × 40 × 30, 115 × 50 × 35 and 140 × 60 × 45 mm. These are not standardized bottle dimensions, measured samples, guaranteed internal sizes, or molds for manufacturing glass bottles.

`PerfumeTemplates.tsx` offers measured capped-bottle sizing with per-side clearance (default 2 mm). `perfume.ts` computes each nominal dimension as measured dimension + 2×clearance, rounds dimensions to 0.01 mm, and limits tabs to valid proportions (rounded down). It does not compensate for board caliper, inserts, scoring or machine tolerances. All nominal dimensions and tabs remain editable; existing projects retain their old geometry. The dialog includes a dimension review and assembly checklist. Templates create new blank native designs, not destructive resizing of existing artwork.

Tests verify opposing panel dimensions, cover depth, dust-flap gap, crease count, sheet margins, invalid measurements and native persistence of customized preset sizes. Browser checks cannot certify physical assembly or weight-bearing performance. Perfume bottles are heavy and fragile: tuck closures may need an insert or reinforced base approved by the packaging manufacturer. Validate paper prototypes and production-stock samples with the actual capped bottle before a production run.

## Packaging atelier and editable artwork

The dimensions dialog has responsive capacity cards, section navigation, coordinated appearance controls, and a live artwork/dieline switch. Choosing a perfume starter also selects a suggested design (30 ml velvet rose, 50 ml emerald garden, 100 ml golden night). A blank option preserves the original guide-only workflow. Users can select another appearance, customize brand/fragrance text, accent color and printed capacity, or reset settings.

`artwork.ts` generates native editable rectangles, circles and textboxes independently of the locked manufacturing guides. The live flat preview uses the same primitives; the small assembled view is only a proportional illustration. All artwork is still clipped to the carton silhouette and can be edited in the main editor. No flattened design image, external artwork downloads or new dependencies are needed. Golden accents simulate RGB colors, not metallic ink or foil. Template text is placeholder branding, not verified regulatory labeling or ingredients.

The optional 3 mm safe-area overlay is a preview-only suggestion for the four body panels. It is not bleed, manufacturing compensation or an exported guide; ask the printer for production specifications. Template-dialog SVG/PDF buttons intentionally download dielines only; complete artwork print downloads are available after opening the editor. Appearance customization does not alter physical carton dimensions.


## Interactive 360° carton assembly

After creating/opening a **carton project only**, choose **معاينة ثلاثية الأبعاد 360° / 3D preview · 360°** in the carton bar. Ordinary design projects do not get this action. The lazy-loaded modal renders the current artwork snapshot on a 13-piece reverse-tuck model: four body panels, glue flap, two lids, two tuck tabs and four tapered dust flaps. Body and flap vertices, hinges and texture coordinates use the same nominal millimetre geometry as the editable dieline. The closed six exterior planes have exactly the nominal width/length/depth, including asymmetric and customized dimensions.

Drag freely with mouse or touch (TrackballControls has no polar-angle limits); wheel/pinch zooms, right-drag or two fingers pan. Top/bottom and four side presets, perspective/reset, and keyboard arrows / + / − / Home are available. The folding slider stages body/glue, dust flaps, lids, then tuck tabs; unfold/assemble buttons jump to the endpoints. Folding/resize fitting preserves viewing direction. There is no opaque floor hiding the underside, and no automatic spinning or inertial camera motion.

`preview3d/assembly.ts` defines the millimetre hinge hierarchy. `mesh.ts` triangulates actual flap polygons with printed outward faces, unprinted inward faces and cardboard-colored cut edges. Closure layers are offset inward to keep dust/glue/tuck surfaces below the outside panels. **0.35 mm is an approximate visual thickness, not a measured stock input or a manufacturing allowance.** This remains an idealized nominal folding preview, not crease deformation, contact/collision analysis, glue behavior, load testing, internal-clearance certification or photorealistic/CMYK proofing. Prototype in the intended stock and check with the manufacturer.

`atlas.ts` snapshots through a separate Fabric canvas with six-decimal serialization, omits `packaging-*` guides, preserves the silhouette/image crop/text/artwork, and ignores editor zoom/pan. Texture resolution is capped at 2048 pixels per edge (and 16 pixels/mm); this is a screen preview, not a print-resolution replacement. UV normalization uses the actual rounded raster size. No source selection, objects, viewport, print scale, undo state or saved project are changed. No preview raster is persisted. Reopen the modal to refresh after editing.

The renderer updates on interaction/resize rather than running an idle animation loop. Closing/reloading releases GPU geometry/materials/textures, controls, observers, listeners, animation frames and the temporary canvas. WebGL/image/dimension failures show a retryable error without altering the source. Browser checks cover the six artwork faces and front left/right orientation, actual image crop, guide removal, source isolation, desktop orbit, mobile touch, folding, reopen cleanup, Arabic/English and unavailable/lost WebGL contexts. Geometry checks cover flat-sheet area/hinge alignment, finite UVs, outward normals and nominal closed bounds at minimum, default, custom and maximum sizes.
