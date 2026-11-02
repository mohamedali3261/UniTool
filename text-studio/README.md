# Text Studio / استوديو النصوص

Independent, modular local typography workspace at **`/text-studio/`**. Linked from the homepage, all-tools catalog, shared navigation and legacy `/app.html#textStudio` deep link. It formats the user's actual words; it does **not** generate or rewrite prose with AI.

## Sections

- **Text:** editable headline and optional signature, automatic or explicit RTL/LTR, Unicode-aware word/grapheme/line statistics.
- **Templates:** eight original appearance presets. Applying one preserves the user's text and dimensions; the selected style is indicated.
- **Typography:** four bundled Arabic/Latin font families (Cairo, Amiri, Changa, Noto Sans Arabic), actual 400/700 weights, size, line height, letter spacing and physical alignment. Nonzero tracking can affect Arabic connections.
- **Appearance:** solid or gradient text, soft shadow/glow/outline, solid/gradient/transparent backgrounds and orbit/frame/dot decorations.
- **Canvas:** square, story, portrait and landscape presets, custom dimensions, padding and measured wrapping/auto-fit with an actual-size indicator and overflow warning.
- **Text tools:** clean whitespace, remove Arabic diacritics or tatweel, English upper/lowercase. Transformations are undoable; transformations exceeding the text limit are rejected without truncating the original.

## Saving and exporting

PNG (alpha supported), JPG (transparent backgrounds flatten to white), and SVG with the selected local font **embedded**, plus 1×/2× raster export, image clipboard, plain-text clipboard and UTF-8 TXT. SVG keeps selectable text, not outlined paths; font support and emoji appearance can vary across third-party viewers/devices. Fonts and rendered exports are tested in Chromium, not universally guaranteed in every SVG importer.

Editable project JSON uses an allowlisted, versioned schema. Unknown properties are ignored, invalid values/types/colors/enums rejected, and text is XML-escaped before rendering. File import is limited to 100 KB. Saving/downloads do not overwrite existing source files automatically.

Optional debounced localStorage draft saving is enabled initially. The latest design is restored on opening, including persisted undo results. Drafts are browser/profile-specific, not encrypted, not cloud backups, and not cross-tab synchronized. Removing the draft disables auto-save and leaves the current design intact. Storage/quota failures are visible and do not block project-file download. Corrupt drafts are not overwritten until the user edits. Download JSON for an explicit backup. Undo/redo stores the last 80 in-memory design changes; keyboard shortcuts apply outside native text/form inputs.

## Local processing and limits

No content upload, API, AI service, CDN font request, API key or account is used. Font assets are reused from `logo-designer/assets/` and `video-studio/assets/`, preserving the existing repository font licenses. The application and its assets must first be served/loaded; this is **not** an installable offline/PWA or offline-first service-worker implementation.

Main text: 1500 UTF-16 code units; signature: 100. Canvas: 320–2048 px per side; 2× output: at most 4096 px per side (~16 MP). Auto-fit reduces the requested font size down to 16 px, wraps by measured words/graphemes, and warns if content still exceeds the area; it does not silently delete overflowing text. Very large padding, excessive text or large glyph marks can still require manual adjustment. The signature is independently reduced to fit. Readability, contrast, print fidelity and every language/emoji glyph are not guaranteed. Clipboard operations require a supporting browser, secure context and permissions; downloads are the fallback.

## Architecture

- `src/core/`: schema, text operations, Unicode layout, font loading/embedding, shared SVG renderer, real exports, draft persistence and history.
- `src/pages/editor/sections/`: separate text, typography, appearance and canvas panels, with explicitly associated form labels.
- `src/pages/templates/`, `src/pages/tools/`: independent preset and text-utility sections.
- `src/pages/editor/{Preview,ExportBar}.tsx`: common measured SVG preview and export UI.
- `src/app/`: composition, navigation, language, draft status and project operations.

## Verification

```sh
npm ci
npm run lint
npm run test:text-studio
npm run build
npm run test:text-studio:browser
```

Browser tests start Vite by default. Set `TEXT_QA_URL=http://localhost:4173` to test a running production preview; optionally set `STUDIO_CHROMIUM_PATH` and `LD_LIBRARY_PATH` for a sandbox-installed Chromium.

Coverage includes schema rejection and XML safety, Unicode counting/direction, text transforms and limits, wrapping/fitting, all template exports, embedded-font rasterization, actual PNG/JPG pixels and alpha, 2× dimensions, real image/text clipboard, JSON roundtrip, local restore/undo/storage failures, local-only network requests, homepage/deep-link integration and Arabic mobile controls without horizontal overflow.
