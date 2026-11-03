# Persistence audit

| Tool group | What survives reload | Important boundary |
| --- | --- | --- |
| Design Craft | Saved projects/pages/assets/metadata in `designcraft-projects`; bounded automatic recovery in `designcraft-recovery` | Save status must report success. Recovery is temporary, not the project archive. |
| Logo Designer | Saved projects and personal assets in the two registered logo databases | Check autosave/manual-save success; keep an external backup. |
| Video Studio | Saved project/timeline plus referenced media Blobs in `unitool-video-studio` | Autosave must finish; large media keeps its original size/quality. |
| Excel Studio | Current workbook in `unitool.excel-studio.workbook.v1`; preferences and function favorites | One current workbook, not an archive of every opened file. Export before replacing it. |
| Audio Reader | Settings, bookmarks, reading progress, last active book and last five recent books | Not an unlimited book library; storage errors/full quota can prevent saving. |
| SVG / Bloub | Persisted editor state/history/preferences under registered namespaces | Only what that editor actually persists; download SVG/project exports separately. |
| QR/scanner/speech/general tools | Supported persisted history, transcripts and preferences | In-memory source/output files and one-time session handoffs are not automatically retained. |
| Conversion/compression/PDF utilities | Tool-specific preferences where implemented | Download results; reopening the site does not restore every input/output file. |

Inspection references: `designcraft/src/utils/projectStorage.ts`, `designcraft/src/advanced/core/recovery.ts`, `logo-designer/storage.ts`, `logo-designer/personal-assets.ts`, `video-studio/src/persistence/database.ts`, `video-studio/src/persistence/useAutosave.ts`, `excel-studio/src/app/useWorkbook.ts`, `the-audio-reader/src/utils/storage.ts`, `bloub-svg/src/ui/stockage.ts`, and `src/pages/*` localStorage consumers.

No unbounded storage promise: preserving unlimited original files and guaranteeing a small footprint conflict. This implementation makes the current boundaries visible, reduces redundant backup/recovery bytes, and never trades away original project/media quality or deletes saved work to disguise usage. Browser quota/persistence APIs are estimates/policies, not durable-storage guarantees. The site-wide ZIP includes registered persisted data only, excludes known credentials, and remains subject to the documented 128 MiB safety budget.
