# Timeline Elements integration

- `ElementsPanel.tsx`: lazy-loaded **وسائط → العناصر** catalog, using the existing canonical Elements registry. Duration, category/source filters and paginated, visibility-lazy previews.
- `insert.ts`: prepares a single undoable edit without replacing the current project. Text/vector layers enter `project.texts` at the playhead. SVGs enter `project.overlays` with embedded assets, respecting the six-image-layer limit. Code scenes append native `designScene` clips to the base track (explicitly described in the UI).
- Short projects are extended with a neutral base clip so newly added layers remain visible for their whole duration. Existing clips, names, ratios, audio and layers are preserved. IDs are regenerated for every insertion; shared source artwork is never mutated. Locked tracks are respected.
- Text/shapes open the existing TextPanel for editing, including vector, animation and timing controls. SVG overlays open **طبقات إضافية** for transform/timing edits. `SVGEditor.tsx` exposes opt-in source edits, applies a new embedded asset in one history step and rejects scripts, event handlers, external references and invalid XML. SVGs stay composite artwork, not automatically decomposed shapes.
- Standalone Elements inspector's **إضافة للتايم لاين** opens a new studio tab with an element ID and optional color. The user first chooses/opens a saved project or starts a new one. Only then is the layer added; there is no automatic replacement of an existing project. The request is removed from the URL after handling to avoid duplicate additions.
- Undo removes the addition/change through normal project history. Registered but unused assets are excluded by the existing project-save path.

Checks: `video-studio/tests/elements-insert.test.ts`, `src/pages/Home/tests/element-insertion.spec.ts`, plus the existing editor and homepage suites. Generated PNGs belong under ignored `test-results`.
