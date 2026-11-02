import { fabric } from "fabric";
/** Keep sub-millimetre geometry through Fabric JSON/SVG; restore global setting immediately. */
export function withCartonPrecision<T>(action: () => T): T {
  const object = fabric.Object as typeof fabric.Object & {
      NUM_FRACTION_DIGITS: number;
    },
    previous = object.NUM_FRACTION_DIGITS;
  object.NUM_FRACTION_DIGITS = 6;
  try {
    return action();
  } finally {
    object.NUM_FRACTION_DIGITS = previous;
  }
}
