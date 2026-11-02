import { templateTextLayers } from "../../../../video-studio/src/templates/text";
import { novaTextLayers } from "../../../../video-studio/src/templates/nova/text";
import {
  interfaceTextLayers,
  interfaceIdentityLayers,
} from "../../../../video-studio/src/templates/interface-flow/text";
import { nova } from "../../../../video-studio/src/templates/nova";
import { interfaceFlow } from "../../../../video-studio/src/templates/interface-flow";
import { reel } from "../../../../video-studio/src/templates/reel";
import { product } from "../../../../video-studio/src/templates/product";
import { quote } from "../../../../video-studio/src/templates/quote";
import { slideshow } from "../../../../video-studio/src/templates/slideshow";
import { orbitElements } from "../../../../video-studio/src/templates/orbit-launch";
import { paperElements } from "../../../../video-studio/src/templates/paper-stories";
import { cloudflareProject } from "../../../../video-studio/src/templates/cloudflare-checklist/project";
import type { LibraryElement } from "../types";
let cache: LibraryElement[];
/** Read real template layers, never a second hand-maintained copy of their artwork. */
export function sourceLayers(): LibraryElement[] {
  if (cache) return cache;
  const sources = [
    { id: "orbit-launch", name: "ORBIT", layers: orbitElements().flat() },
    { id: "paper-stories", name: "PAPER", layers: paperElements().flat() },
    {
      id: "cloudflare-checklist",
      name: "Cloudflare",
      layers: cloudflareProject().project.texts,
    },
    ...[reel, product, quote, slideshow].map((t) => ({
      id: t.id,
      name: t.name,
      layers: t.scenes.flatMap((_, i) => templateTextLayers(t, i, 0)),
    })),
    {
      id: "nova",
      name: "NOVA",
      layers: nova.scenes.flatMap((_, i) => novaTextLayers(i, 0)),
    },
    {
      id: "interface-flow",
      name: "Interface Flow",
      layers: [
        ...interfaceFlow.scenes.flatMap((_, i) => interfaceTextLayers(i, 0)),
        ...interfaceIdentityLayers(),
      ],
    },
  ];
  const seen = new Set<string>();
  cache = sources.flatMap((source) =>
    source.layers.flatMap((layer, i) => {
      const { id, start, end, ...content } = layer as typeof layer & {
        id?: string;
        start?: number;
        end?: number;
      };
      const signature = source.id + JSON.stringify(content);
      if (seen.has(signature)) return [];
      seen.add(signature);
      return [
        {
          id: `${source.id}-layer-${i}`,
          name: layer.name || layer.text || "شكل",
          source: source.id,
          sourceName: source.name,
          category: "shapes" as const,
          kind: "layer" as const,
          layer: {
            ...layer,
            id: `element-${i}`,
            start: 0,
            end: Math.max(5, (end || 5) - (start || 0)),
            locked: false,
            hidden: false,
          },
          animated: !!(
            layer.frames?.length ||
            layer.counter ||
            (layer.animationIn && layer.animationIn !== "none")
          ),
        },
      ];
    }),
  );
  return cache;
}
