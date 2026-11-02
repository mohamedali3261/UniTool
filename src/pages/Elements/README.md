# Shared element registry — Video Studio section

The elements library is now a first-class **العناصر** tab inside Video Studio, alongside media, audio, text and effects. `/video-studio.html#elements` opens the editor's elements section directly with an empty project; saved drafts remain available from the normal studio home. `/elements.html` is a compatibility redirect, not a standalone landing/catalogue page. The old “العناصر اللي ورا أفكارك الكبيرة” hero has been removed.

## Source layout
- `registry.ts`: seven category loaders; totals are derived at runtime.
- `categories/*`: independent category definitions and loaders.
- `sources/editable.ts`, `sources/vector.ts`: original editable video-template layers and artwork.
- `sources/ready/*`: original ready-to-use shapes, labels, compositions, motion and the new video pack.
- `components/ElementPreview.tsx`, `lib/render.ts`: real previews of the same layers used in insertion.
- `lib/export.ts`: portable project/source generation shared by the insertion pipeline.
- `lib/preferences.ts`: favorites storage with safe failure handling.
- `main.tsx`: old-entry redirect only.

## New video pack
626 total elements, including **48 additions** in `sources/ready/video-pack.ts`:
- 24 original SVG overlay icons for cameras, microphones, playback, audience actions, publishing and commerce. These are foreground `shapes`, not backgrounds.
- 12 four-layer lower-third compositions with editable title/subtitle and independent panel/accent layers.
- 12 editable video-title presets.

No remote assets or external icon requests. Existing template art and the 50 persisted motion presets remain available. The integrated panel supports search, category/source filters, favorites, a “الجديد” filter, pagination, preview pause, and duration selection. Adding goes through `video-studio/src/elements/insert.ts`, preserving project contents and grouped undo. Text and shapes stay editable; SVG source and overlay position/scale remain editable through the video inspector.

## Validation
`npm run test:elements`, `npm run test:video-studio`, and `npm run test:home` cover catalogue identity, portable projects, icon foreground placement, grouped insertion, text editing and undo, desktop/mobile layout, legacy redirects, filters and persisted favorites. `HOME_QA_URL` can target a production preview; `STUDIO_CHROMIUM_PATH` supplies a custom Chromium binary. Keep QA screenshots/downloads in ignored folders.

## Creative motion pack
36 additional native layers in `sources/ready/creative.ts`, with shared canvas preview/export, real Three.js and local variable fonts. See `video-studio/src/creative/README.md` for settings, actual clip transitions, UI-scene limitations and verification.

## Motion pack 2
60 additional native animated elements are available under **الإضافات الجديدة · 60**; **حركات إبداعية · 96** includes both creative packs. See `video-studio/src/creative/pack2/README.md` for designs, editable settings, illustrative-data limitations and tests.
