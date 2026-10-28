import { isPexelsPageUrl } from "../stock/mediaSource";
import { effectById } from "../effects/registry";
import { Asset, Project } from "../types";
import { download } from "./media";
export async function saveProject(project: Project, assets: Asset[]) {
  const bundled = await Promise.all(
    assets.map(async (a) => {
      const blob = await (await fetch(a.url)).blob();
      const url = await new Promise<string>((r, j) => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result as string);
        reader.onerror = j;
        reader.readAsDataURL(blob);
      });
      return { ...a, url };
    }),
  );
  download(
    new Blob([JSON.stringify({ version: 1, project, assets: bundled })], {
      type: "application/json",
    }),
    `${project.name}.unitool.json`,
  );
}
// Project files contain embedded media; remote URLs are deliberately rejected.
export async function loadProject(
  file: File,
): Promise<{ project: Project; assets: Asset[] }> {
  const d = JSON.parse(await file.text());
  const p = d?.project;
  const num = (n: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
  const id = (n: unknown) => typeof n === "string" && n.length > 0;
  const unique = (xs: { id: string }[]) =>
    new Set(xs.map((x) => x.id)).size === xs.length;
  if (
    d?.version !== 1 ||
    !p ||
    typeof p.name !== "string" ||
    !["16:9", "9:16", "1:1", "4:5"].includes(p.ratio) ||
    !Array.isArray(p.clips) ||
    !Array.isArray(p.texts) ||
    !Array.isArray(d.assets) ||
    !num(p.audioVolume, 0, 1)
  )
    throw new Error("ملف المشروع غير صالح");
  for (const a of d.assets) {
    if (
      !a ||
      !id(a.id) ||
      typeof a.name !== "string" ||
      !["image", "video", "audio"].includes(a.type) ||
      typeof a.url !== "string" ||
      !a.url.startsWith(`data:${a.type}/`) ||
      !num(a.duration, 0.01) ||
      (a.source !== undefined &&
        (!a.source ||
          a.source.provider !== "pexels" ||
          !Number.isSafeInteger(a.source.id) ||
          a.source.id < 1 ||
          !isPexelsPageUrl(a.source.pageUrl) ||
          !isPexelsPageUrl(a.source.authorUrl) ||
          typeof a.source.author !== "string" ||
          !["hd", "fullhd"].includes(a.source.quality)))
    )
      throw new Error("وسائط المشروع غير صالحة");
  }
  if (!unique(d.assets)) throw new Error("وسائط المشروع مكررة");
  if (
    p.audioId !== null &&
    !d.assets.some((a: Asset) => a.id === p.audioId && a.type === "audio")
  )
    throw new Error("مسار الصوت غير صالح");
  if (
    (p.audioStart !== undefined && !num(p.audioStart)) ||
    (p.audioOffset !== undefined && !num(p.audioOffset)) ||
    (p.audioLoop !== undefined && typeof p.audioLoop !== "boolean")
  )
    throw new Error("إعدادات الموسيقى غير صالحة");
  for (const c of p.clips) {
    const asset = d.assets.find(
      (a: Asset) => a.id === c?.assetId && a.type !== "audio",
    );
    if (
      !c ||
      (c.rotation !== undefined && ![0, 90, 180, 270].includes(c.rotation)) ||
      (c.zoom !== undefined && !num(c.zoom, 0.25, 3)) ||
      (c.flipX !== undefined && typeof c.flipX !== "boolean") ||
      (c.flipY !== undefined && typeof c.flipY !== "boolean") ||
      (c.fit !== undefined && !["contain", "cover"].includes(c.fit)) ||
      (c.fadeIn !== undefined && !num(c.fadeIn, 0, 5)) ||
      (c.fadeOut !== undefined && !num(c.fadeOut, 0, 5)) ||
      (c.effect !== undefined &&
        c.effect !== "" &&
        effectById.get(c.effect)?.kind !== "effect") ||
      (c.effectIntensity !== undefined && !num(c.effectIntensity, 0, 1)) ||
      (c.effectSpeed !== undefined && !num(c.effectSpeed, 0.25, 2)) ||
      !id(c.id) ||
      !asset ||
      !num(c.start) ||
      !num(c.end, 0.01) ||
      c.end <= c.start ||
      (asset.type === "video" && c.end > asset.duration + 0.01) ||
      !num(c.speed, 0.25, 4) ||
      !num(c.brightness, 0, 2) ||
      !num(c.contrast, 0, 2) ||
      !num(c.saturation, 0, 2) ||
      !num(c.volume, 0, 1) ||
      effectById.get(c.filter)?.kind !== "filter"
    )
      throw new Error("مقاطع المشروع غير صالحة");
  }
  for (const t of p.texts) {
    if (
      !t ||
      !id(t.id) ||
      typeof t.text !== "string" ||
      typeof t.color !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(t.color) ||
      !num(t.start) ||
      !num(t.end, 0.01) ||
      t.end <= t.start ||
      !num(t.x, 0, 100) ||
      !num(t.y, 0, 100) ||
      !num(t.size, 12, 180)
    )
      throw new Error("نصوص المشروع غير صالحة");
  }
  if (!unique(p.clips) || !unique(p.texts))
    throw new Error("طبقات المشروع مكررة");
  return { project: p, assets: d.assets };
}
