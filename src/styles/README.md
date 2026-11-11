# Shared interface appearance

`studio-controls.css` supplies Excel Studio's green action palette and press
feedback across the site. `tools-appearance.css` adapts the legacy Tailwind
tools interface, reader and SVG wrapper under explicit theme attributes.
`site-appearance.css` supplies scoped tokens for the remaining entry points. Catalog cards retain their original layout rather
than inheriting action-button dimensions. Warning/delete states stay semantic.

The tools header exposes an Arabic/English keyboard-accessible day/night toggle.
`useToolsAppearance` stores `unitool.tools.theme.v1`, initially inheriting a valid
saved graphic/video preference, otherwise light. Once saved, the tools choice is
independent. Theme and language controls remain usable with blocked storage.

Purple/violet/indigo/fuchsia UI accents are not allowed anywhere: every studio
loads `tools-appearance.css`, whose brand-palette block maps those Tailwind
families (text, background, gradient stops, borders, rings) to #24795e/#438c6f.
The source utilities were also rewritten to emerald, so new tools start on
brand. Authored artwork, canvas pixels, templates and swatches are excluded.

Night surfaces are neutral #101010/#171717/#202020, with #383838 borders.
Primary actions use #24795e, #1d634b on hover and #174e3a on press. Day surfaces
are white/#f5f7f4. Do not introduce filtering, inherited color transformations or
CSS overrides on authored image/PDF/QR/canvas content. Native output pixels and
white paper backgrounds must remain independent of UI appearance.

Run `npm run test:tools:browser` for every internal tool route at desktop and
mobile widths in both appearances, persistence/navigation/blocked-storage
checks, QR pixel/export verification and actual PDF merging. In a custom
browser environment, set `STUDIO_CHROMIUM_PATH`; `TOOLS_QA_URL` reuses an existing
Vite server. Media-engine CDN availability is separate from appearance coverage.

## Other entry points

`useSiteAppearance` supplies independently saved preferences for home, Excel,
SVG and storage (`unitool.<page>.theme.v1`), inheriting the existing tools/studio
choice when unset. Logo retains `logo-designer-theme`; reader retains its native
`sawti_reader_settings_v1` setting, including warm reading-paper/midnight modes.
Spreadsheet light styles are the original reference palette; hard-coded UI
colors use original-value fallbacks and night-only tokens. Authored cell fills,
text colors, chart data and native SVG artwork remain untouched.

The SVG iframe accepts appearance messages only from its same-origin parent;
its existing settings notify the outer header in return. Its production assets
are built from `bloub-svg` into the existing tracked public directory. Export
renderers remain independent of the interface theme.

Run `npm run test:site-appearance` for desktop/mobile appearance, persistence,
blocked storage, content invariance and iframe synchronization. Functional
regressions live in each workspace's existing browser suite.
