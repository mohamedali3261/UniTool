import { cloudflareProject } from "../../../../video-studio/src/templates/cloudflare-checklist/project";
import { novaArt } from "../../../../video-studio/src/templates/nova/art";
import { templateBackground } from "../../../../video-studio/src/templates/background";
import { reel } from "../../../../video-studio/src/templates/reel";
import { product } from "../../../../video-studio/src/templates/product";
import { quote } from "../../../../video-studio/src/templates/quote";
import { slideshow } from "../../../../video-studio/src/templates/slideshow";
import { interfaceScenes } from "../../../../video-studio/src/templates/interface-flow/scenes";
import type { LibraryElement } from "../types";
export const vectorElements: LibraryElement[] = [
  ...cloudflareProject().assets.map((a, i) => ({
    id: `cloudflare-svg-${i}`,
    name: i ? "صورة الحساب الافتراضية" : "خلفية Cloudflare المحايدة",
    source: "cloudflare-checklist",
    sourceName: "Cloudflare",
    category: "backgrounds" as const,
    kind: "svg" as const,
    svg: atob(a.url.split(",")[1]),
    animated: false,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `nova-art-${i}`,
    name: `خلفية NOVA ${i + 1}`,
    source: "nova",
    sourceName: "NOVA",
    category: "backgrounds" as const,
    kind: "svg" as const,
    svg: novaArt(i),
    animated: false,
  })),
  ...[reel, product, quote, slideshow].flatMap((t) =>
    t.scenes.map((s, i) => ({
      id: `${t.id}-background-${i}`,
      name: `${t.name} — ${s.text}`,
      source: t.id,
      sourceName: t.name,
      category: "backgrounds" as const,
      kind: "svg" as const,
      svg: templateBackground(t, i),
      animated: false,
    })),
  ),
  ...interfaceScenes.map((s) => ({
    id: `interface-${s.id}`,
    name: s.name,
    source: "interface-flow",
    sourceName: "Interface Flow",
    category: "scenes" as const,
    kind: "scene" as const,
    scene: s.id,
    animated: true,
  })),
];
