# Timeline Elements integration

- `ElementsPanel.tsx`: lazy-loaded **العناصر** في شريط أقسام المحرر catalog, using the existing canonical Elements registry. Duration, category/source filters and paginated, visibility-lazy previews.
- `insert.ts`: prepares a single undoable edit without replacing the current project. Text/vector layers enter `project.texts` at the playhead. SVGs enter `project.overlays` with embedded assets, respecting the six-image-layer limit. Code scenes append native `designScene` clips to the base track (explicitly described in the UI).
- Short projects are extended with a neutral base clip so newly added layers remain visible for their whole duration. Existing clips, names, ratios, audio and layers are preserved. IDs are regenerated for every insertion; shared source artwork is never mutated. Locked tracks are respected.
- Text/shapes open the existing TextPanel for editing, including vector, animation and timing controls. SVG overlays open **طبقات إضافية** for transform/timing edits. `SVGEditor.tsx` exposes opt-in source edits, applies a new embedded asset in one history step and rejects scripts, event handlers, external references and invalid XML. SVGs stay composite artwork, not automatically decomposed shapes.
- `/video-studio.html#elements` opens the elements section in a fresh editor project; `/elements.html` redirects there for old bookmarks. Saved drafts are not replaced. Existing `?element=` handoffs still work after choosing a project for backwards compatibility.
- The catalogue includes 48 new video-focused assets (24 SVG icons, 12 editable lower thirds and 12 titles), with search, category/source filters, favorites, and a new-items filter.
- Undo removes the addition/change through normal project history. Registered but unused assets are excluded by the existing project-save path.

Checks: `video-studio/tests/elements-insert.test.ts`, `src/pages/Home/tests/element-insertion.spec.ts`, plus the existing editor and homepage suites. Generated PNGs belong under ignored `test-results`.

- The additional **حركات إبداعية · 36** filter exposes native animated text/background/UI/data/icon presets. The catalogue now totals 626 entries. Implementation, settings, Three.js/font assets and interactive-scene limitations: `../creative/README.md`.

## Motion pack 2
60 additional native animated elements are available under **الإضافات الجديدة · 60**; **حركات إبداعية · 96** includes both creative packs. See `video-studio/src/creative/pack2/README.md` for designs, editable settings, illustrative-data limitations and tests.
