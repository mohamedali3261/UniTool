# العناصر / Elements

Standalone Arabic RTL page at `/elements.html`. The library reads the **actual nine video-studio template sources**, rather than maintaining a second set of example graphics. Currently 372 deduplicated entries in six categories; counts are derived, never hardcoded in the UI.

## Maintenance map

- `types.ts`: discriminators, source metadata and category identifiers.
- `registry.ts`: category metadata and loaders, kept in one explicit order.
- `categories/<category>/index.ts`: Arabic category name, description and symbol.
- `categories/<category>/load.ts`: that category's own loader. Add files alongside these for category-specific features; don't grow one monolithic catalog.
- `categories/classify.ts`: disjoint classification rules. Rich keyframe/counter layers are grouped as motion; basic entrance animations remain in their semantic category.
- `sources/editable.ts`: ORBIT/PAPER layers, Cloudflare layers and the shared original text generators for the other templates. Stable source/index IDs and deduplication keep favorites usable between visits.
- `sources/vector.ts`: NOVA artwork, generic template backgrounds, Cloudflare embedded SVG assets and the seven Interface Flow code scenes.
- `components/`: lazy Canvas previews, cards and native modal inspector.
- `lib/render.ts`: actual studio renderers, centered/fitted single-layer previews without changing source data.
- `lib/export.ts`: PNG helper, original SVG/code and portable project JSON with embedded local assets.
- `lib/preferences.ts`: guarded, device-local favorites (not an account sync feature).
- `index.tsx`, `main.tsx`, `elements.css`: page composition, isolated entry and responsive presentation.

Shared template generators live in `video-studio/src/templates/{background,text}.ts`, `nova/text.ts` and `interface-flow/text.ts`. Both the editor and library call them. Edit those originals to update both; do not copy their SVG/text into the library. The original template timings and artwork are preserved by the extraction.

## What each export means

- **Layer**: real editable text/vector box; fitted to the library preview and a standalone 8-second project. Color changes affect this copy only. Canvas PNG has transparency.
- **SVG**: original composite vector source, not a promise that every shape is already an independent editor layer. Download the SVG, copy its code, take a PNG snapshot, or open its self-contained project.
- **Code scene**: procedural Interface Flow composition. The inspector supports play/pause, scrubbing and accent color. Code snippets reference this repository's scene renderer; they are not dependency-free HTML. Its project preserves the `designScene` identifier.

JSON is the editor's existing `{version:1,project,assets}` format and opens using **فتح مشروع**. It is a new project, not automatic insertion into a currently open project. Audio, transitions between entire scenes and full editor effects are not individually catalogued visual elements. A procedural scene is not misrepresented as an editable layer collection.

## Checks

```sh
npm run test:elements       # source coverage, provenance, all project payloads, storage guards
npm run test:home           # original homepage checks + browser library/hero/import checks
npm run test:video-studio   # existing editor and template regression suite
npm run lint
npm run build
```

The browser suite is in `../Home/tests/elements.spec.ts` to share the existing Playwright configuration. `HOME_QA_URL` can target a production preview; `STUDIO_CHROMIUM_PATH` can supply a Chromium executable. Screenshots and generated files should stay in ignored QA folders, not source control.

## Add to an existing timeline

Inside the editor, open **وسائط → العناصر**, choose a duration and press **إضافة للتايم لاين**. This is a non-destructive, undoable insertion. The standalone inspector also has a handoff link: choose a project in the opened studio tab before insertion. Text/shapes stay editable layers; SVG supports overlay controls and source editing; procedural scenes append as native clips with scene/accent controls. See `video-studio/src/elements/README.md` for implementation details.
