import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PDFDocument,
  PDFName,
  StandardFonts,
  decodePDFRawStream,
  PDFRawStream,
  PDFArray,
} from "pdf-lib";
import { inspectNativeText, editNativeText } from "../src/core/nativeText";
async function fixture() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage();
  page.drawText("Original 123", { x: 40, y: 700, size: 20, font });
  return doc.save();
}
async function content(bytes: Uint8Array, index = 0) {
  const doc = await PDFDocument.load(bytes),
    value = doc.getPage(index).node.lookup(PDFName.of("Contents"), PDFArray);
  return value
    .asArray()
    .map((ref) =>
      new TextDecoder().decode(
        decodePDFRawStream(doc.context.lookup(ref) as PDFRawStream).decode(),
      ),
    )
    .join("\n");
}
test("native replacement changes real text operands, not an overlay", async () => {
  const bytes = await fixture(),
    items = await inspectNativeText(bytes, 0);
  assert.equal(items.length, 1);
  assert.equal(items[0].text, "Original 123");
  const edited = await editNativeText(bytes, 0, items[0], {
    text: "Changed 456",
    dx: 0,
    dy: 0,
  });
  assert.equal((await inspectNativeText(edited, 0))[0].text, "Changed 456");
  assert.ok(
    !(await content(edited)).includes(
      Buffer.from("Original 123").toString("hex").toUpperCase(),
    ),
  );
  assert.equal((await inspectNativeText(bytes, 0))[0].text, "Original 123");
});
test("isolated blocks can move repeatedly and be deleted from content", async () => {
  const bytes = await fixture(),
    [item] = await inspectNativeText(bytes, 0);
  const moved = await editNativeText(bytes, 0, item, { dx: 12, dy: -24 });
  assert.match(await content(moved), /1 0 0 1 12 -24 cm/);
  const [again] = await inspectNativeText(moved, 0);
  assert.ok(again);
  const removed = await editNativeText(moved, 0, again, {
    dx: 0,
    dy: 0,
    remove: true,
  });
  assert.equal((await content(removed)).trim(), "");
});
test("unknown encodings and unsupported syntax are not guessed", async () => {
  const bytes = await fixture(),
    doc = await PDFDocument.load(bytes),
    page = doc.getPage(0);
  page.node.set(
    PDFName.of("Contents"),
    doc.context.register(
      doc.context.flateStream("q BT /F1 20 Tf (unsafe) Tj ET Q"),
    ),
  );
  assert.equal((await inspectNativeText(await doc.save(), 0)).length, 0);
  const [item] = await inspectNativeText(bytes, 0);
  await assert.rejects(
    editNativeText(bytes, 0, item, { text: "عربي", dx: 0, dy: 0 }),
  );
  await assert.rejects(editNativeText(bytes, 0, item, { dx: NaN, dy: 0 }));
});
test("editing a shared stream only changes the selected page", async () => {
  const doc = await PDFDocument.load(await fixture()),
    first = doc.getPage(0),
    second = doc.addPage();
  second.node.set(
    PDFName.of("Contents"),
    first.node.get(PDFName.of("Contents"))!,
  );
  second.node.set(
    PDFName.of("Resources"),
    first.node.get(PDFName.of("Resources"))!,
  );
  const bytes = await doc.save(),
    [item] = await inspectNativeText(bytes, 0);
  const edited = await editNativeText(bytes, 0, item, {
    text: "New",
    dx: 0,
    dy: 0,
  });
  assert.equal((await inspectNativeText(edited, 0))[0].text, "New");
  assert.equal((await inspectNativeText(edited, 1))[0].text, "Original 123");
});

test("native isolation keeps only the exact requested block and page geometry", async () => {
  const { isolateNativeText } = await import("../src/core/nativeText");
  const doc = await PDFDocument.load(await fixture());
  doc.getPage(0).setCropBox(10, 30, 400, 700);
  doc
    .getPage(0)
    .drawText("Second block", {
      x: 70,
      y: 500,
      size: 18,
      font: await doc.embedFont(StandardFonts.Helvetica),
    });
  const bytes = await doc.save(),
    items = await inspectNativeText(bytes, 0);
  assert.equal(items.length, 2);
  const isolated = await isolateNativeText(bytes, 0, items[1]);
  assert.equal((await PDFDocument.load(isolated)).getPageCount(), 1);
  assert.deepEqual((await PDFDocument.load(isolated)).getPage(0).getCropBox(), {
    x: 10,
    y: 30,
    width: 400,
    height: 700,
  });
  const isolatedItems = await inspectNativeText(isolated, 0);
  assert.equal(isolatedItems.length, 1);
  assert.equal(isolatedItems[0].text, "Second block");
});
test("unknown inherited transforms are refused rather than shown at incorrect positions", async () => {
  const doc = await PDFDocument.load(await fixture()),
    page = doc.getPage(0);
  const contents = page.node.lookup(PDFName.of("Contents"), PDFArray);
  contents.insert(
    0,
    doc.context.register(doc.context.flateStream("2 0 0 2 10 20 cm")),
  );
  assert.equal((await inspectNativeText(await doc.save(), 0)).length, 0);
});
