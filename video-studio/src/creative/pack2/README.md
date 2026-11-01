# Motion pack 2 — 60 new native elements

Inside **Video Studio → العناصر → الإضافات الجديدة · 60**. The combined creative filter now has **96** designs; the complete registry has **626** entries. Existing IDs and projects remain supported. No duplicate color variants are counted as additions.

Each family has ten different procedural drawings:

| Family | Designs |
| --- | --- |
| Text | soft rise, elastic scale, outline-to-ink, chromatic alignment, spotlight, curtain, echo, growing ribbon, neon breath, tilted arrival |
| Background | star tunnel, terrain waves, ripple field, hex cells, light rain, checker waves, moving facets, bokeh drift, signal field, kaleidoscope |
| Shapes | orbital system, double helix, atom, folding fan, projected wire cube, pinwheel, infinity trail, breathing flower, radar, metronome |
| UI scenes | chat exchange, audio player, calendar, boarding pass, pricing card, file upload, build terminal, browser tabs, route tracking, weather |
| Data | bars, area, scatter, gauge, funnel, stacks, bubbles, candles, treemap, network |
| Icons | heartbeat, bell, cloud download, bouncing location, unlock, battery, WiFi, rocket, book, hourglass |

## Editing and rendering
- All entries are native editable timeline layers: title, color, size, position, timing and playback speed use the editor's existing controls/history/save pipeline.
- The ten text effects also appear in the text-effect selector. Whole-string masks/transforms retain Arabic joining; no character-by-character Latin-only reveal is used.
- Data designs accept a custom numeric series, except the gauge which exposes a 0–100 target. Numerical series use magnitudes for geometry. These are illustrative charts, not live analytics: scatter x positions are seeded, candle bodies use consecutive values, funnels have illustrative stages, network edges use a circular topology, and the treemap uses a one-level slice layout. No real currency/market/API data is implied.
- UI scenes have editable titles and scripted, illustrative content. They do not actually upload, play audio, book tickets, run shell commands, locate users or access weather. An exported video is not an interactive app.
- The wire cube is a deterministic Canvas projection, not a second Three.js renderer. The existing floating-3D preset remains the real Three.js/WebGL effect.
- Native shared preview/export rendering uses source time and deterministic seeds; neither CSS animation nor random wall-clock behavior substitutes for exportable motion. Background layers use the existing above-footage/below-foreground stacking convention.

## Files and checks
`catalog.ts` defines stable project IDs. `text.ts`, `backgrounds.ts`, `shapes.ts`, `ui.ts`, `data.ts`, and `icons.ts` implement the designs; `render.ts` dispatches graphical families. No extra external asset, network request or runtime dependency was added.

`motion-pack2.test.ts` checks sixty unique entries, family/category classification, native registration and drawing/opacity. Existing insertion/JSON tests cover all 96 creative presets. The creative browser suite checks changing frames, exact rewind and 60 distinct new frame fingerprints, new-filter insertion/custom data/undo/redo on 390/1440px layouts, and downloads/decodes representative pack-two MP4/WebM exports. This is headless desktop/mobile-width simulation, not actual-device performance certification.

Latest checks: TypeScript and production build pass; **129/129** Video Studio and **6/6** Elements unit tests pass. The expanded creative browser suite passes **12/12** tests; a final post-label-change run also passes all three selected 96-frame/new-filter checks. The complete unrelated browser regression suite was not rerun for this pack; the two previously documented local-import assertions remain outside this verification.
