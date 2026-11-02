export interface BrandKit {
  name: string;
  colors: string[];
  font: string;
  logo?: string;
}
export const BRAND_KEY = "designcraft_brand_v1";
export function validateBrand(value: unknown): BrandKit {
  const b = value as BrandKit;
  if (
    !b ||
    typeof b.name !== "string" ||
    !b.name.trim() ||
    b.name.length > 80 ||
    typeof b.font !== "string" ||
    b.font.length > 80 ||
    !Array.isArray(b.colors) ||
    !b.colors.length ||
    b.colors.length > 8 ||
    b.colors.some((c) => !/^#[0-9a-f]{6}$/i.test(c)) ||
    (b.logo &&
      (!/^data:image\/(png|jpeg|webp);base64,/i.test(b.logo) ||
        b.logo.length > 3_000_000))
  )
    throw Error("BRAND");
  return { name: b.name, colors: [...b.colors], font: b.font, logo: b.logo };
}
export function loadBrand(): BrandKit {
  try {
    return validateBrand(JSON.parse(localStorage.getItem(BRAND_KEY) || "null"));
  } catch {
    return {
      name: "My brand",
      colors: ["#0284c7", "#0f172a", "#ffffff"],
      font: "Cairo",
    };
  }
}
export function saveBrand(b: BrandKit) {
  localStorage.setItem(BRAND_KEY, JSON.stringify(validateBrand(b)));
}
export async function readBrandLogo(file: File) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  )
    throw Error("LOGO");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 16_000_000)
      throw Error("LOGO_SIZE");
    const scale = Math.min(
      1,
      1024 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(image.naturalWidth * scale));
    c.height = Math.max(1, Math.round(image.naturalHeight * scale));
    c.getContext("2d")!.drawImage(image, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
