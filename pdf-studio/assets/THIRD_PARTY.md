# Third-party assets

- Cairo and Amiri WOFF2 fonts: reused from the repository's licensed Fontsource assets. SIL Open Font License copies accompany them.
- OCR language data: `ara.traineddata.gz` and `eng.traineddata.gz`, `4.0.0_best_int` from npm packages `@tesseract.js-data/ara@1.0.0` and `@tesseract.js-data/eng@1.0.0`. Tesseract language data is distributed under Apache-2.0. An Apache-2.0 license copy is in `ocr/LICENSE.txt`. Upstream: https://github.com/tesseract-ocr/tessdata_best and https://github.com/naptha/tessdata.
- PDF.js CMaps/standard fonts and Tesseract worker/WASM JS are copied from lockfile-installed dependencies by `scripts/prepare-assets.mjs`. Generated copies live in ignored `public/pdf-studio/vendor/`, and are included in production builds. Dependency license files are copied alongside them.
- OCR language data is deliberately kept as compressed assets (about 4.5 MB combined) so deployment and OCR do not depend on a third-party CDN.
