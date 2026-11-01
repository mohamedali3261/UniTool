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

**Manufacturing limits:** nominal geometry only, without paper-caliper, crease, tooling or machine compensation. No automatic bleed/safe-area generation or spot-color production separation. Exports are RGB, not certified CMYK or PDF/X. The proportional assembled view is an illustration, not collision/fold simulation. Prototype, measure and confirm allowances/production suitability with your printer before production.

Checks: `npm run test:designcraft` and `npm run test:designcraft:browser`. Browser QA uses `DESIGN_QA_URL` and optional `STUDIO_CHROMIUM_PATH`; simulation is not physical-device/printer certification. PDF support is locally bundled and loaded on demand; no new runtime dependency is added.
