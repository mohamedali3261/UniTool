# Native creative motion

96 editable presets live in the editor's **العناصر → حركات إبداعية · 96** filter. The complete shared catalogue contains 626 entries, including the previous 48-item video pack and 32 composition kits. This is not a separate landing page.

## Effects
- Text: Arabic-safe scramble, whole-word masked reveal, single gradient sweep, variable font weight (100–900), configurable important-word marker and vertically rolling odometer digits (Latin/Arabic/Persian).
- Backgrounds: morphing blobs, liquid gradient mesh, illuminated grid, aurora, grain; glass cards sample and blur the actual underlying canvas. Floating sphere/cube/torus use **Three.js**, lights, geometry and a shared offscreen WebGL renderer, not pre-rendered images.
- UI scenes: staggered bento, dynamic island, command search, notifications, shimmering skeletons, spring controls, cursor expansion and magnetic button.
- Transition demonstration scenes: shared-card expansion, circle reveal, page flip, zoom-through and liquid wipe.
- Data: progressive line with glowing endpoint, donut, sparkline cards, heatmap and moving connectors.
- Icons: drawn strokes, menu/X morph, squash/bounce, dot/arc/pulse spinners and seeded confetti.

`render.ts` is called by the native text renderer for both library previews and the timeline/export compositor. Motion derives from source time; seeking and rewinding do not depend on browser animation clocks. Randomized effects use deterministic noise. Text/settings and timing persist through the existing project JSON validator, and insertion uses normal history/undo.

## Editing
Text layers expose the six text effects directly. All creative layers expose speed (0.1–4×); marker has an important-word field, grain has density, grid/cursor/magnet have pointer-anchor coordinates, and the donut has target percentage. Line/sparkline/heatmap accept 2–64 finite data values (−10000…10000), applied with **تطبيق قيم الرسم**. The line/sparkline normalize the series to their chart bounds; heatmap uses magnitude relative to its largest value. Sparkline card labels/KPIs remain illustrative and share the supplied series; these are not connected analytics dashboards. Usual layer position, size, color, timing and motion settings remain available.

The local Noto Sans Arabic variable font includes Arabic/Latin subsets and the SIL Open Font License under `video-studio/assets`. Font loading starts with the editor; variable-weight export awaits it. No font CDN or remote scene is required.

## Real editor actions versus video scenes
**Ctrl/Cmd+K** really opens an editor search dialog and inserts a selected registry item. It supports Escape and restores focus. Separately, the command-palette *Element* is an animated scene in the video. Likewise, cursor, magnetic button, notification and control Elements use scripted interaction in their animations: exported MP4/WebM is not an interactive website and does not capture the viewer's pointer or keyboard.

The five matching transitions are also available as **real transitions between adjacent clips** in the clip inspector (`shared-card`, `circle-reveal`, `page-flip`, `zoom-through`, `liquid-wipe`). They composite actual source frames in the shared preview/export pipeline. Shared-card is a geometric card reveal, not semantic object tracking between unrelated shots. Page flip is a flat, horizontally foreshortened flip, not a physically simulated curled sheet.

## Resources and limitations
One 640×360 Three.js renderer is reused with deterministic poses; geometries/materials/context are disposed on page exit. An unavailable/lost WebGL context uses an explicitly labelled animated **2D fallback**, not simulated 3D. Uniform fitting preserves object proportions in portrait projects. Grain is transparent; glass requires visible content underneath to demonstrate backdrop blur. Background-design layers are composed above base footage but below foreground text, following the existing editor stacking model.

WebGL support, Canvas blur support and export throughput vary by device; no actual-device iOS/Android performance claim is made. UI assets are illustrative motion graphics, not DOM widgets. Large bundles still produce Vite's non-blocking size warning.

## Verification
`video-studio/tests/creative-presets.test.ts`: registry uniqueness, bounded settings, all 96 insertion/project round trips, transition scene planning and deterministic noise.

`video-studio/tests/browser/creative-presets.spec.ts`: 96 changing frames and deterministic rewind, actual WebGL draw calls, loaded local variable font faces, insertion/settings/save, real command palette, five native transitions with actual source images, downloaded/decoded moving WebM and MP4, 390px layout and editable chart data. Existing `creative.spec.ts` additionally checks decoded MP4/WebM compositing. Browser checks run with software SwiftShader, not a physical GPU/device.

Previous-pack verification: **127/127** Video Studio unit tests, **6/6** Elements unit tests, and **19/19** targeted browser checks (`creative-presets` + `creative.spec`) pass; TypeScript and production build pass. The broader 98-test run was not fully green. After targeted fixes/rechecks (including avoiding an always-mounted hidden dialog and sampling MP4 by actual decoded seeks), two local-video-import first-frame pixel assertions remain failing on the headless Chromium environment. No claim is made that the full browser suite passes; actual-device verification is still outstanding.

## Second pack
[Motion pack 2](pack2/README.md) adds 60 distinct designs across six ten-item families, with a dedicated **الإضافات الجديدة · 60** filter. The existing six text effects now coexist with ten additional effects. This pack adds no runtime dependencies.
