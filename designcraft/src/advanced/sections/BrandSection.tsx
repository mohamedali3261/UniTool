import { useState } from "react";
import { fabric } from "fabric";
import { loadBrand, saveBrand, readBrandLogo, BRAND_KEY } from "../core/brand";
import { selection } from "../core/arrange";
import { isText } from "../core/text";
import { Field, Note, t, type Props } from "./shared";
export function BrandSection({ canvas, ar, run }: Props) {
  const [brand, setBrand] = useState(loadBrand);
  return (
    <>
      <Field label={t(ar, "اسم الهوية", "Brand name")}>
        <input
          maxLength={80}
          value={brand.name}
          onChange={(e) => setBrand({ ...brand, name: e.target.value })}
        />
      </Field>
      <Field label={t(ar, "خط الهوية", "Brand font")}>
        <input
          maxLength={80}
          value={brand.font}
          onChange={(e) => setBrand({ ...brand, font: e.target.value })}
        />
      </Field>
      <div className="adv-grid">
        {brand.colors.map((c, i) => (
          <div key={i} className="adv-swatch">
            <input
              type="color"
              aria-label={`${t(ar, "لون الهوية", "Brand color")} ${i + 1}`}
              value={c}
              onChange={(e) =>
                setBrand({
                  ...brand,
                  colors: brand.colors.map((x, j) =>
                    j === i ? e.target.value : x,
                  ),
                })
              }
            />
            <button
              onClick={() =>
                run(() =>
                  selection(canvas).forEach((o) => {
                    o.set("fill", c);
                    o.dirty = true;
                  }),
                )
              }
            >
              {t(ar, "تطبيق اللون", "Apply color")}
            </button>
          </div>
        ))}
      </div>
      <button
        disabled={brand.colors.length >= 8}
        onClick={() =>
          setBrand({ ...brand, colors: [...brand.colors, "#0284c7"] })
        }
      >
        {t(ar, "إضافة لون", "Add color")}
      </button>
      <button
        onClick={() =>
          run(() =>
            selection(canvas).forEach((o) => {
              if (isText(o)) {
                o.set("fontFamily", brand.font);
                (o as any).initDimensions();
                o.setCoords();
              }
            }),
          )
        }
      >
        {t(ar, "تطبيق خط الهوية", "Apply brand font")}
      </button>
      <Field label={t(ar, "لوجو الهوية (حتى 2 MB)", "Brand logo (up to 2 MB)")}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file)
              run(
                async () =>
                  setBrand({ ...brand, logo: await readBrandLogo(file) }),
                false,
              );
          }}
        />
      </Field>
      {brand.logo && (
        <img
          src={brand.logo}
          className="adv-logo"
          alt={t(ar, "لوجو الهوية", "Brand logo")}
        />
      )}
      <div className="adv-grid">
        <button onClick={() => run(() => saveBrand(brand), false)}>
          {t(ar, "حفظ الهوية محليًا", "Save brand locally")}
        </button>
        <button
          onClick={() =>
            run(() => {
              localStorage.removeItem(BRAND_KEY);
              setBrand({
                name: "My brand",
                colors: ["#0284c7"],
                font: "Cairo",
              });
            }, false)
          }
        >
          {t(ar, "حذف الهوية المحفوظة", "Remove saved brand")}
        </button>
        <button
          disabled={!brand.logo}
          onClick={() =>
            run(
              () =>
                new Promise<void>((resolve, reject) =>
                  fabric.Image.fromURL(brand.logo!, (image) => {
                    if (!image?.width || !canvas.contextContainer) {
                      reject(Error("LOGO"));
                      return;
                    }
                    image.scaleToWidth(
                      Math.min(
                        240,
                        (canvas.getWidth() / canvas.getZoom()) * 0.25,
                      ),
                    );
                    image.set({
                      left: canvas.getWidth() / canvas.getZoom() / 2,
                      top: canvas.getHeight() / canvas.getZoom() / 2,
                      originX: "center",
                      originY: "center",
                    });
                    canvas.add(image);
                    canvas.setActiveObject(image);
                    resolve();
                  }),
                ),
            )
          }
        >
          {t(ar, "إضافة اللوجو للتصميم", "Insert brand logo")}
        </button>
      </div>
      <Note>
        {t(
          ar,
          "الهوية مشتركة بين تصاميم هذا المتصفح. نحفظ اسم الخط، وليس ملفه؛ يلزم توفر الخط.",
          "Brand is shared across designs in this browser. Font names, not font files, are saved; the font must be available.",
        )}
      </Note>
    </>
  );
}
