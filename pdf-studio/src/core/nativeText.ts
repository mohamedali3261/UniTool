import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
} from "pdf-lib";

export interface NativeTextItem {
  stream: number;
  block: number;
  text: string;
  replaceable: boolean;
}
// Deliberately narrow grammar: independent q/BT/.../ET/Q blocks, no shared text state,
// forms, clipping, marked content, arbitrary operators or custom text encodings.
const number = "[-+]?(?:\\d*\\.)?\\d+";
const blockPattern = new RegExp(
  `q\\s+(?:(?:${number}\\s+){6}cm\\s+)*BT\\s+(?:${number}\\s+){3}rg\\s+/([^\\s/]+)\\s+(${number})\\s+Tf\\s+${number}\\s+TL\\s+(?:${number}\\s+){6}Tm\\s+<([0-9A-Fa-f]*)>\\s+Tj\\s+T\\*\\s+ET\\s+Q`,
  "g",
);
function blocks(source: string) {
  const matches = [...source.matchAll(blockPattern)];
  // Reject any stream containing other state or drawing operators. No partial parsing.
  return source.replace(blockPattern, "").trim() ? [] : matches;
}
function streams(doc: PDFDocument, pageIndex: number) {
  const page = doc.getPage(pageIndex),
    value = page.node.get(PDFName.of("Contents"));
  const resolved = value && doc.context.lookup(value);
  const values =
    resolved instanceof PDFArray ? resolved.asArray() : value ? [value] : [];
  return values
    .map((value) => doc.context.lookup(value))
    .map((value) => (value instanceof PDFRawStream ? value : null));
}
function fontAllowsAscii(doc: PDFDocument, pageIndex: number, name: string) {
  const resources = doc.getPage(pageIndex).node.Resources();
  const fonts = resources?.lookup(PDFName.of("Font"), PDFDict);
  const entry = fonts?.get(PDFName.of(name));
  const font = entry && doc.context.lookup(entry);
  if (!(font instanceof PDFDict)) return false;
  const base = font.get(PDFName.of("BaseFont"))?.toString();
  return (
    font.get(PDFName.of("Subtype"))?.toString() === "/Type1" &&
    font.get(PDFName.of("Encoding"))?.toString() === "/WinAnsiEncoding" &&
    !font.has(PDFName.of("ToUnicode")) &&
    !font.has(PDFName.of("Widths")) &&
    !font.has(PDFName.of("FontDescriptor")) &&
    /^\/(?:Helvetica(?:-Bold|-Oblique|-BoldOblique)?|Courier(?:-Bold|-Oblique|-BoldOblique)?|Times-(?:Roman|Bold|Italic|BoldItalic))$/.test(
      base || "",
    )
  );
}
export async function inspectNativeText(
  bytes: Uint8Array,
  pageIndex: number,
): Promise<NativeTextItem[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const items: NativeTextItem[] = [];
  streams(doc, pageIndex).forEach((stream, index) => {
    if (!stream) return;
    let source: string;
    try {
      source = new TextDecoder("latin1").decode(
        decodePDFRawStream(stream).decode(),
      );
    } catch {
      return;
    }
    blocks(source).forEach((match, block) => {
      const hex = match[3],
        ascii =
          hex.length % 2 === 0 &&
          /^(?:[2-6][0-9A-Fa-f]|7[0-9A-Ea-e])*$/.test(hex);
      const replaceable = ascii && fontAllowsAscii(doc, pageIndex, match[1]);
      const text = replaceable
        ? (hex.match(/../g) || [])
            .map((h) => String.fromCharCode(parseInt(h, 16)))
            .join("")
        : "";
      items.push({ stream: index, block, text, replaceable });
    });
  });
  return items;
}
export async function editNativeText(
  bytes: Uint8Array,
  pageIndex: number,
  target: NativeTextItem,
  change: { text?: string; dx: number; dy: number; remove?: boolean },
) {
  if (
    ![change.dx, change.dy].every(
      (n) => Number.isFinite(n) && Math.abs(n) <= 5000,
    )
  )
    throw Error("Invalid movement");
  const valid = (await inspectNativeText(bytes, pageIndex)).find(
    (i) => i.stream === target.stream && i.block === target.block,
  );
  if (!valid) throw Error("Unsupported text block");
  if (
    change.text !== undefined &&
    (!valid.replaceable || !/^[\x20-\x7E]{0,1000}$/.test(change.text))
  )
    throw Error("This font/text encoding is not safely replaceable");
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const stream = streams(doc, pageIndex)[target.stream]!;
  const source = new TextDecoder("latin1").decode(
    decodePDFRawStream(stream).decode(),
  );
  const match = blocks(source)[target.block];
  let replacement = match[0];
  if (change.text !== undefined) {
    const hex = [...change.text]
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
    replacement = replacement.replace(/<[0-9A-Fa-f]*>\s+Tj/, `<${hex}> Tj`);
  }
  if (change.remove) replacement = "";
  else if (change.dx || change.dy) {
    // Translation inside the existing isolated graphics-state scope, without nesting it.
    replacement = replacement.replace(
      /^q\s+/,
      `q\n1 0 0 1 ${change.dx} ${change.dy} cm\n`,
    );
  }
  const output =
    source.slice(0, match.index) +
    replacement +
    source.slice(match.index! + match[0].length);
  const updated = doc.context.flateStream(output);
  // Do not mutate a shared stream: replace only this page's Contents reference.
  const all = streams(doc, pageIndex).map((s, i) =>
    i === target.stream
      ? doc.context.register(updated)
      : s
        ? doc.context.register(s)
        : null,
  );
  if (all.some((s) => !s)) throw Error("Unsupported content stream");
  doc.getPage(pageIndex).node.set(PDFName.of("Contents"), doc.context.obj(all));
  return doc.save();
}
