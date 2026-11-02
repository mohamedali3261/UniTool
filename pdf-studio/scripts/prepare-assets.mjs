import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../../", import.meta.url),
  out = new URL("public/pdf-studio/vendor/", root);
await mkdir(out, { recursive: true });
for (const dir of ["cmaps", "standard_fonts"])
  await cp(new URL("node_modules/pdfjs-dist/" + dir, root), new URL(dir, out), {
    recursive: true,
  });
await cp(
  new URL("node_modules/tesseract.js/dist/worker.min.js", root),
  new URL("worker.min.js", out),
);
await cp(new URL("pdf-studio/assets/ocr/", root), new URL("lang/", out), {
  recursive: true,
});
for (const variant of ["lstm", "simd-lstm", "relaxedsimd-lstm"]) {
  await cp(
    new URL(
      `node_modules/tesseract.js-core/tesseract-core-${variant}.wasm.js`,
      root,
    ),
    new URL(`tesseract-core-${variant}.wasm.js`, out),
  );
}
await cp(
  new URL("node_modules/pdfjs-dist/LICENSE", root),
  new URL("PDFJS-LICENSE.txt", out),
);
await cp(
  new URL("node_modules/tesseract.js-core/LICENSE", root),
  new URL("TESSERACT-CORE-LICENSE.txt", out),
);
console.log("Local PDF fonts/CMaps and Arabic/English OCR assets ready.");
