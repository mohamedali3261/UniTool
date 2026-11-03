# Site-wide storage & portable backup

Open **`/storage.html`** from the shared site navigation, homepage studio card/tool directory, or Design Craft's existing Save & storage panel.

## What is backed up

One DEFLATE ZIP contains a versioned `manifest.json`, section-specific JSON under `sections/`, and binary media under `assets/<section>/`. Version 1 supports the persistent stores currently used by the site:

- Design Craft: `designcraft-projects` (`projects`, `meta`) and `designcraft-recovery` (`points`).
- Logo Designer: `unitool-logo-designer` (`projects`) and `unitool-logo-personal-assets` (`assets`).
- Video Studio: `unitool-video-studio` (`projects`, `media`), including stored Blob/File media.
- Registered localStorage namespaces for spreadsheets/workbooks, SVG/Bloub, reader books/bookmarks/settings, speech transcripts, QR history, tool settings and site preferences. See `src/registry.ts` for exact rules.

Typed arrays, ArrayBuffers, Dates, Blob/File metadata, Maps/Sets, undefined and ordinary JSON-like objects are encoded without turning persisted media into dead blob URLs. Actual design dimensions are not rounded. Known credential keys/fields are excluded. The retired studios' existing matching local preferences/drafts are not deleted; they can still be archived, but their editors are no longer available.

**This is not a recorder of every action or a universal browser-profile backup.** Save work in each tool first. Unsaved/in-memory files, transient handoffs/sessionStorage, cookies, authentication, API keys, caches, installed application code and arbitrary third-party databases are excluded. An external URL remains an external URL: remote files must remain available, and original source files that were never persisted need a separate copy. New storage namespaces/schema versions require an explicit adapter update.

## Import and failure behavior

1. Select a trusted UniTool ZIP on the destination device (same site origin).
2. All entries are checked and decoded before data writes: format/version, paths, declared/expanded sizes, SHA-256 integrity, known storage schemas, credential key restrictions, valid IDs and binary dependencies.
3. Review the date, records and databases, then explicitly confirm.
4. Missing keys are added. Existing project IDs/settings are **kept**, not overwritten, even if the incoming copy is newer. This avoids silently destroying destination work; use a fresh site/browser profile to obtain a clean transfer.
5. Each IndexedDB database uses one atomic write transaction. There is **no cross-database/localStorage atomic transaction**. Quota/permission/blocked failures report a stopped/possibly partial restore and completed database names/counts. Existing records are never cleared to make room. Retrying after fixing the cause skips already-restored keys.
6. Reopen/reload tools after completion to refresh their in-memory caches. Save and close other site tabs before backup/restore; backups do not lock concurrent tabs or create one simultaneous snapshot of all tools.

The archive is **not encrypted or authenticated**. Checksums detect damage, not a malicious author. Use only backups you made or trust, and keep them private. Known credential filtering cannot identify secrets a user typed into arbitrary project text. The page makes no network upload.

### Safety limits

128 MiB compressed input / expanded archive budget, 20,000 file entries and 50,000 database records; supported database schemas are version 1. Export stops instead of downloading an incomplete ZIP. Large original videos may exceed the limit; keep them separately. ZIP preparation/decompression uses memory and does not guarantee handling every device's available memory. There is no multipart-volume format in this version: the user selected **one ZIP with folders**.

## Retired pages

Text Studio and PDF Studio are removed from homepage/navigation/catalog/build inputs. `/text-studio/` and `/pdf-studio/` contain static redirects to the homepage, including production public redirects. Their prior source modules remain in the repository for history/compatibility; the pages no longer load those editors. Standalone PDF tools (merge/compress/sign/etc.) remain available. PDF Studio asset preparation no longer runs during normal dev/build.

## Checks

- `npm run test:site-storage`: 8 tests for fresh-device round trip, binary integrity, precision, credential filtering, non-destructive repeat import, malformed/re-signed inputs, codec types, missing-database scanning, and database-transaction failure.
- `SITE_QA_URL=http://localhost:4174 npx playwright test --config site-storage/playwright.config.ts`: 2 production browser tests. A real downloaded ZIP transfers an editable Arabic design and binary video asset between independent browser contexts, verifies persistence/reopening, and checks retired routes/navigation and invalid-input recovery.
- Full homepage browser suite: 28 passed. Full Design Craft browser suite: 65 passed.
- Existing unit suites: Design Craft 50, Excel Studio 602, Video Studio 129 passed.
- Lint/TypeScript and production build passed (existing large-chunk advisories).

Chromium contexts emulate a fresh device; these results are not physical iOS/Android certification. No deployment is performed by these changes.

## Storage footprint audit and safeguards

The storage page now displays the browser's approximate origin usage/quota, lightweight record counts for each registered database and UTF-16 text estimates for localStorage groups. Record counts use IndexedDB `count()` only: opening the overview does not load saved media/project bodies and does not leave empty databases behind. Browser usage may include caches and cannot be presented as exact per-project disk usage.

Saving coverage is explicitly shown: Design Craft, Logo Designer and Video Studio have project persistence; spreadsheets retain the current workbook; Audio Reader retains settings, progress, bookmarks and the last five books; SVG backs up only what its editor persists. Conversion/compression/scanning generally preserve preferences, **not all input/output working files**. Download those files before closing. This change does not silently enable unlimited file retention, silently evict saved projects or reduce media quality.

- Design Craft recovery: identical consecutive snapshots are not inserted again. Insertion and retention cleanup are atomic in one transaction. Temporary recovery history is bounded to 24 MiB of UTF-8 snapshot payload, at most 20 points globally and five per project, always preserving the latest. Saved projects live in a separate store and are not trimmed. Old temporary recovery points may be removed; this is not an unlimited revision archive. Database metadata overhead is outside the payload budget.
- ZIP export: identical binary payloads are stored once using SHA-256 content identity. Each reference retains independent Blob/File name/type/time metadata, without re-encoding or lowering quality. This reduces duplicate bytes **in the backup**, not existing media records in browser storage. Both the export and import budget count logical binary references, so deduplication does not bypass expansion safety limits.
- Video persistence already removes media unreferenced by every saved project; it does not delete media used by another project. Original large media requires real space and cannot be arbitrarily reduced losslessly. Regular external ZIP backups remain important because browsers can evict origin data.

Verification for this follow-up: 54 Design Craft unit tests, 10 site-storage unit tests, 602 Excel unit tests, 129 Video Studio unit tests, 18 Logo Designer unit tests and 18 Audio Reader unit tests passed. Production browser suites: 65 Design Craft tests and three site-storage tests passed. Added checks cover recovery deduplication/limits/failed-write rollback; archive binary deduplication and native File metadata across real browser contexts; and a 320px overview that counts records with full-value reads deliberately disabled. Lint/TypeScript, production build and diff checks passed. No deployment performed; no claim of physical-device certification or universal automatic file retention.
