import {
  cartonGeometry,
  cartonSvg,
  CUT_COLOR,
  FOLD_COLOR,
  type CartonSize,
} from "./geometry";
export function downloadPackaging(data: BlobPart, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([data], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCartonSvg(s: CartonSize, dimensions = false) {
  downloadPackaging(
    cartonSvg(s, dimensions),
    "image/svg+xml",
    `carton-${s.width}x${s.height}x${s.depth}-mm.svg`,
  );
}
export async function cartonPdf(s: CartonSize) {
  const { PDFDocument, rgb } = await import("pdf-lib"),
    a = cartonGeometry(s),
    mm = 72 / 25.4,
    doc = await PDFDocument.create(),
    page = doc.addPage([a.width * mm, a.height * mm]);
  const color = (hex: string) =>
    rgb(
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    );
  page.drawSvgPath(a.cut, {
    x: 0,
    y: a.height * mm,
    scale: mm,
    borderWidth: 0.2,
    borderColor: color(CUT_COLOR),
  });
  for (const [x1, y1, x2, y2] of a.folds)
    page.drawLine({
      start: { x: x1 * mm, y: (a.height - y1) * mm },
      end: { x: x2 * mm, y: (a.height - y2) * mm },
      color: color(FOLD_COLOR),
      thickness: 0.2 * mm,
      dashArray: [2 * mm, mm],
    });
  doc.setTitle(`Carton ${s.width} x ${s.height} x ${s.depth} mm`);
  doc.setSubject(
    "Nominal cut/crease guides. Print at 100%; prototype before production.",
  );
  return doc.save();
}
