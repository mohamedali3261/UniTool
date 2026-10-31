# UniTool homepage

The root `index.html` is a Vite entry for this standalone homepage. It does not load the tools application, designer, SVG editor, reader or video renderer until a visitor follows a link.

## Structure
- `index.tsx`: Arabic/English homepage, navigation, preferences and studio directory.
- `data.ts`: studio metadata and translated copy.
- `components/Artwork.tsx`: original SVG/CSS interface illustrations for each section.
- `components/ToolDirectory.tsx`: keyboard-accessible search, categories, quick picks and the complete tool list.
- `home.css`: responsive styling and lightweight animations. Offscreen illustrations pause; reduced-motion is respected and a manual pause preference is available.
- `assets/`: local Tajawal bold subsets and their OFL license. No external font request is needed.
- `tests/home.spec.ts`: links, directory coverage, search, preferences, keyboard behavior and responsive layout checks.

## Sources of truth
All site entry points live in `src/config/sitePages.ts`, also re-exported by the existing workspace Header for compatibility. Tool links come from `src/pages/ToolsHome/data.ts` and open `/app.html#<toolId>`; the existing audio compression tool is now included in that catalog too. Do not advertise an unimplemented route in this directory.

The studio artwork is illustrative, not a screenshot or an embedded editor. Voice availability and API/network requirements are described without promising that every feature works offline.

## Check
```sh
npm run lint
npm run build
npm run test:home
```
The browser suite uses Playwright Chromium. For a custom installation, set `STUDIO_CHROMIUM_PATH`; for an already-running production preview set `HOME_QA_URL`. QA artifacts belong in `.cache`, `test-results` or other ignored directories, not in the homepage source.

## Motion-graphics hero and restored brand

The navbar/footer use the original `/UniTool_logo.png` asset. `components/motion/` replaces the old static launcher with seven animated chapters, sourced from the canonical tool/studio metadata. Every one of the 31 tools, five studios and the Elements library appears in the film with a real link. Orbit paths, staggered entrances, floating cards and a graphic cursor animate using CSS. The chapter clock pauses offscreen, in background tabs, on hover/focus, with the global pause preference, or with reduced motion. Manual chapter buttons always work. `/` and Ctrl/Cmd+K focus the full tool directory below; it still provides complete search and filters.
