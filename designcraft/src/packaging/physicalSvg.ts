import {
  cartonError,
  cartonGeometry,
  MM_TO_PX,
  type CartonSize,
} from "./geometry";
export function physicalCartonSvg(
  svg: string,
  size: CartonSize,
  width: number,
  height: number,
) {
  if (cartonError(size)) return svg;
  const g = cartonGeometry(size);
  if (
    Math.abs(width - g.width * MM_TO_PX) > 0.01 ||
    Math.abs(height - g.height * MM_TO_PX) > 0.01
  )
    return svg;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (doc.querySelector("parsererror")) throw Error("Invalid canvas SVG");
  doc.documentElement.setAttribute("width", `${g.width}mm`);
  doc.documentElement.setAttribute("height", `${g.height}mm`);
  return new XMLSerializer().serializeToString(doc);
}
