# Center logos in QR codes

Upload a PNG, JPEG or WebP (up to 5 MB / 16 megapixels), processed locally and normalized to a PNG of at most 1024 pixels per side. The centered image preserves its aspect ratio with **no added backing, frame or padding**. Transparent outer margins are trimmed before sizing so the slider scales the visible artwork rather than empty canvas. Transparency inside the logo is preserved and QR modules remain visible underneath. Size is adjustable from 10% to 30% of the QR canvas (16% default); sizes above 20% show an additional scanning warning. Opaque white or colored backgrounds baked into an uploaded image are not removed: upload a transparent PNG/WebP for that effect. Fully transparent images are rejected. Remove restores the unbranded code. SVG uploads are intentionally rejected.

Preview, PNG download and clipboard images use the same composited canvas. SVG retains vector QR paths and embeds the normalized PNG logo, with properly sized space for the existing developer credits. Quiet zone is four modules; error correction is H. No amount of error correction guarantees decoding after covering the center: keep high contrast, use short payloads and physically test with target scanners at the intended printed size.

Generation uses an isolated canvas and cancellation to prevent stale asynchronous results, and export is disabled until the current configuration finishes rendering. Uploaded object URLs are revoked; no upload to a service occurs. This does not add full CMYK/print-production support.

Checks:

- `npx tsx --test src/pages/QRCodeGenerator/tests/logo.test.ts`
- `QR_QA_URL=http://localhost:4173 STUDIO_CHROMIUM_PATH=... npx playwright test --config src/pages/QRCodeGenerator/tests/playwright.config.ts`

Browser tests decode actual downloaded PNGs and rasterized SVGs using jsQR, check logo pixels, removal, invalid input, stale-export prevention, sizing and copied images. App route: `/app.html#qrCode`. These sample decode tests do not certify every payload, color combination or printed/scanning environment.
