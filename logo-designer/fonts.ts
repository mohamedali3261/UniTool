import manifest from "./assets/fonts.json";
/** خطوط محلية حقيقية مع نطاقات Unicode وأوزان فعلية للتصدير المتطابق. */
const urls = import.meta.glob("./assets/*.woff2", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
export const fonts = manifest.map((f) => ({
  ...f,
  urls: f.files.map((file) => urls["./assets/" + file]),
}));
function rule(f: (typeof fonts)[number], file: string, url: string) {
  const range = (f.ranges as Record<string, string>)[file];
  return `@font-face{font-family:'${f.id}';src:url('${url}') format('woff2');font-weight:${file.includes("-700-") ? 700 : 400};font-display:swap;${range ? "unicode-range:" + range + ";" : ""}}`;
}
export const fontCSS = fonts
  .flatMap((f) => f.files.map((file, i) => rule(f, file, f.urls[i])))
  .join("\n");
export async function embeddedFonts(ids: string[]) {
  const rules = await Promise.all(
    fonts
      .filter((f) => ids.includes(f.id))
      .flatMap((f) =>
        f.files.map(async (file, i) => {
          const response = await fetch(f.urls[i]);
          if (!response.ok) throw new Error("Font failed");
          const blob = await response.blob();
          const data = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
          return rule(f, file, data);
        }),
      ),
  );
  return rules.join("\n");
}
