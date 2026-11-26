import { memo, useEffect, useState, useRef } from "react";
import type { Layer } from "../core/model";
import {
  getLayerRaster,
  layerRasterKey,
  type LayerRaster,
} from "../core/artwork";
/** Reposition an SVG image; never re-shape text or PNG-encode it while dragging. */
export const PatternArtwork = memo(function PatternArtwork({
  item,
  box,
}: {
  item: Layer;
  box: { x: number; y: number; size: number };
}) {
  const generation = useRef(0);
  const [image, setImage] = useState<{
    url: string;
    r: LayerRaster;
    generation: number;
  } | null>(null);
  const key = layerRasterKey(item, 0.5);
  useEffect(() => {
    let active = true;
    getLayerRaster(item, 0.5)
      .then((r) => {
        if (active)
          setImage({
            url: r.canvas.toDataURL(),
            r,
            generation: ++generation.current,
          });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key]);
  if (!image) return null;
  const { r, url } = image,
    s = box.size / 1024,
    cx = box.x + (item.x + item.w / 2) * s,
    cy = box.y + (item.y + item.h / 2) * s;
  return (
    <image
      data-artwork-id={item.id}
      data-raster-generation={image.generation}
      href={url}
      x={box.x + (item.x - r.pad) * s}
      y={box.y + (item.y - r.pad) * s}
      width={r.w * s}
      height={r.h * s}
      transform={`rotate(${item.rotation} ${cx} ${cy})`}
      opacity={item.opacity}
      pointerEvents="none"
    />
  );
});
