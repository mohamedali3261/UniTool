# ستوديو السيرة الذاتية الاحترافية (`cv-studio/`)

Standalone CV & Cover Letter Studio for UniTool (`/cv-studio/`), built with a clean modular per-page architecture, 100% client-side privacy, bundled Arabic & Latin fonts, ATS compliance auditing, and print-true A4/Letter pagination.

## Architecture

- `index.html` & `src/main.tsx` — Standalone Vite entry point.
- `src/app/` — Studio state store (`useResumeStore.ts`), physical-keycode keyboard shortcuts (`useShortcuts.ts` supporting Arabic & English keyboard layouts), context, and UniTool theme + print isolation (`styles.css`).
- `src/components/` — Unified `StudioHeader.tsx` (`SiteNavbar` + studio subbar), `Modal.tsx`, and single non-stacking `CalmToast.tsx`.
- `src/core/` — Typed schema (`types.ts`), AR/EN i18n (`i18n.ts`), A4/Letter geometry & multi-page paginator (`pagination.ts`), ATS evaluator & JD keyword matcher (`atsEngine.ts`), IndexedDB + `.utcv.json` storage (`storage.ts`), and crisp PDF/PNG/TXT export (`exportEngine.ts`).
- `src/templates/` — 14 standalone bilingual CV template modules (each in its own `.tsx` file with a distinct visual architecture and miniature gallery preview).
- `src/pages/` — 4 dedicated page directories (`editor/`, `templates/`, `cover-letter/`, `resumes/`), including the 120fps GPU interactive canvas (`editor/canvas/`), Shapes & Elements library, Electronic Signature Pad, and Layers & Inspector panel.
- `tests/` — Vitest unit tests (`core.test.ts`) and Playwright desktop/mobile + light/dark browser suite (`studio.spec.ts`).
