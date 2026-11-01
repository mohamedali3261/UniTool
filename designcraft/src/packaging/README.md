# Carton dielines

Open **المصمم → قوالب العلب والمقاسات**. Creates one rectangular reverse-tuck construction matching the supplied reference: front/side/back/side panels, glue flap, opposite top/bottom covers and four tapered dust flaps.

All geometry is in millimetres. Defaults: 80 × 120 × 35 mm with 12 mm glue/tuck tabs. Flat sheet width = glue + 2×width + 2×depth + 20 mm; height = height + 2×(depth+tuck) + 20 mm. The extra 20 mm is a 10 mm outer margin on each side, not artwork bleed. Dimensions and tab proportions are validated. Paper guidance checks A4/A3 in both orientations.

The preview, SVG, vector PDF and native Fabric objects share `geometry.ts`. Standalone PDF contains only vector cutting/creasing guides at exact custom physical page size; SVG optionally includes dimension annotations. These standalone files do not include subsequent artwork. Print actual size / 100%, never fit-to-page.

Opening a template creates a separate design, preserving existing projects. Native paths/lines are locked; locked guides stay above newly added artwork. Metadata and locks persist. Existing layers controls can explicitly unlock guides. Current artwork SVG uses mm root dimensions if the canvas still matches its original sheet; a resized canvas uses the existing pixel export instead. General raster exports remain pixel-based, and the existing general PDF action uses browser print. The editor's carton button reopens the reference and creates a new blank template, not an automatic rescale of existing artwork.

**Manufacturing limits:** nominal geometry only, without paper-caliper, crease, tooling or machine compensation. No automatic bleed/safe-area generation or spot-color production separation. The proportional assembled view is an illustration, not collision/fold simulation. Prototype, measure and confirm allowances/production suitability with your printer before production.

Checks: `npm run test:designcraft` and `npm run test:designcraft:browser`. Browser QA uses `DESIGN_QA_URL` and optional `STUDIO_CHROMIUM_PATH`; simulation is not physical-device/printer certification. PDF support is locally bundled and loaded on demand; no new runtime dependency is added.
