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

## Workspace hero and restored brand

The navbar/footer use the original `/UniTool_logo.png` asset. `components/HeroWorkspace.tsx` and `hero.css` implement the new full-width tool launcher: all 31 canonical tools, the five studios, the Elements library, category browsing, direct search (Ctrl/Cmd+K), quick picks and four device-local recent tools. It doesn't import any editor implementation. The existing `/` shortcut still focuses the complete tool directory further down the page. Recents record only tools opened from this launcher and can be cleared there.
