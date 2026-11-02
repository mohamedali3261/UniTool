import arabic from "../../assets/variable-arabic.woff2?url";
import latin from "../../assets/variable-latin.woff2?url";
let ready: Promise<void> | undefined;
export function prepareCreativeFonts() {
  return (ready ||= Promise.all(
    [
      new FontFace("StudioVariable", `url(${arabic})`, {
        weight: "100 900",
        unicodeRange:
          "U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF",
      }),
      new FontFace("StudioVariable", `url(${latin})`, {
        weight: "100 900",
        unicodeRange: "U+0000-00FF",
      }),
    ].map(async (face) => {
      document.fonts.add(await face.load());
    }),
  )
    .then(() => {})
    .catch((e) => {
      ready = undefined;
      throw e;
    }));
}
