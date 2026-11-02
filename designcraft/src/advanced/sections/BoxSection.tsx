import { useState } from "react";
import { faces, type PrintSettings } from "../core/faces";
import { withoutGuides } from "../../packaging/print";
import { exportCanvasImage } from "../../utils/fabricHelpers";
import { MM_TO_PX } from "../../packaging/geometry";
import { Field, Note, t, type Props } from "./shared";
export function BoxSection({
  canvas,
  project,
  ar,
  run,
  settings,
  onSettings,
  onFace,
}: Props & {
  settings: PrintSettings;
  onSettings: (s: PrintSettings) => void;
  onFace: (i: number) => void;
}) {
  const [textures, setTextures] = useState<string[]>([]),
    [rx, setRx] = useState(-18),
    [ry, setRy] = useState(-28);
  const size = project.packaging?.size;
  if (!size)
    return (
      <Note>
        {t(
          ar,
          "افتح مشروع علبة لاستخدام الأوجه ومعاينة التجميع.",
          "Open a carton project to use faces and assembled preview.",
        )}
      </Note>
    );
  const scale = Math.min(220 / size.width, 240 / size.height, 140 / size.depth),
    w = size.width * scale,
    h = size.height * scale,
    d = size.depth * scale;
  const all = faces(size);
  const transforms = [
    `translateZ(${d / 2}px)`,
    `rotateY(90deg) translateZ(${w / 2}px)`,
    `rotateY(180deg) translateZ(${d / 2}px)`,
    `rotateY(-90deg) translateZ(${w / 2}px)`,
    `rotateX(90deg) translateZ(${h / 2}px)`,
    `rotateX(-90deg) translateZ(${h / 2}px)`,
  ];
  return (
    <>
      <h3>{t(ar, "أوجه العلبة", "Carton faces")}</h3>
      <div className="adv-grid">
        {all.map((face, i) => (
          <button key={face.id} onClick={() => onFace(i)}>
            {t(ar, face.ar, face.en)}
          </button>
        ))}
      </div>
      <label>
        <input
          type="checkbox"
          checked={settings.showGuides}
          onChange={(e) =>
            onSettings({ ...settings, showGuides: e.target.checked })
          }
        />
        {t(
          ar,
          "إظهار الأوجه وهوامش الطباعة في المحرر فقط",
          "Show faces and print guides in editor only",
        )}
      </label>
      <div className="adv-grid">
        {(["safeMm", "bleedMm"] as const).map((key) => (
          <Field
            key={key}
            label={
              key === "safeMm"
                ? t(ar, "هامش الأمان mm", "Safe margin mm")
                : t(ar, "النزيف mm", "Bleed mm")
            }
          >
            <input
              type="number"
              min={0}
              max={8}
              step={0.5}
              value={settings[key]}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n) && n >= 0 && n <= 8)
                  onSettings({ ...settings, [key]: n });
              }}
            />
          </Field>
        ))}
      </div>
      <Note>
        {t(
          ar,
          "الأخضر أمان، والأحمر حدود النزيف. الأدلة لا تصدّر. من «تصدير للطباعة» يمكنك إخراج النزيف الفعلي؛ يلزم أن يمتد تصميمك نفسه خارج خط القص. القياسات يحددها المطبعي.",
          "Green is safety; red is bleed. Guides are never exported. Print export can include actual bleed; your artwork must extend beyond the cut. Confirm values with your printer.",
        )}
      </Note>
      <button
        onClick={() =>
          run(async () => {
            await document.fonts.ready;
            const src = withoutGuides(canvas, true, () =>
              exportCanvasImage(
                canvas,
                "png",
                1,
                1,
                project.width,
                project.height,
              ),
            );
            const image = new Image();
            image.src = src;
            await image.decode();
            setTextures(
              all.map((face) => {
                const c = document.createElement("canvas");
                c.width = Math.max(1, Math.round(face.width * MM_TO_PX));
                c.height = Math.max(1, Math.round(face.height * MM_TO_PX));
                c.getContext("2d")!.drawImage(
                  image,
                  face.x * MM_TO_PX,
                  face.y * MM_TO_PX,
                  face.width * MM_TO_PX,
                  face.height * MM_TO_PX,
                  0,
                  0,
                  c.width,
                  c.height,
                );
                return c.toDataURL();
              }),
            );
          }, false)
        }
      >
        {t(
          ar,
          "تحديث معاينة العلبة بتصميمي",
          "Refresh assembled artwork preview",
        )}
      </button>
      {textures.length > 0 && (
        <>
          <div className="adv-box-stage" data-testid="assembled-carton">
            <div
              style={{
                width: w,
                height: h,
                position: "relative",
                transformStyle: "preserve-3d",
                transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
              }}
            >
              {all.map((face, i) => {
                const fw = i === 1 || i === 3 ? d : w,
                  fh = i >= 4 ? d : h;
                return (
                  <img
                    key={face.id}
                    alt={t(ar, face.ar, face.en)}
                    src={textures[i]}
                    style={{
                      position: "absolute",
                      width: fw,
                      height: fh,
                      left: (w - fw) / 2,
                      top: (h - fh) / 2,
                      backfaceVisibility: "hidden",
                      transform: transforms[i],
                      border: "1px solid #ffffff44",
                    }}
                  />
                );
              })}
            </div>
          </div>
          <Field label={t(ar, "دوران أفقي", "Horizontal rotation")}>
            <input
              type="range"
              min={-180}
              max={180}
              value={ry}
              onChange={(e) => setRy(+e.target.value)}
            />
          </Field>
          <Field label={t(ar, "دوران رأسي", "Vertical rotation")}>
            <input
              type="range"
              min={-60}
              max={60}
              value={rx}
              onChange={(e) => setRx(+e.target.value)}
            />
          </Field>
        </>
      )}
      <Note>
        {t(
          ar,
          "المعاينة تستخدم صورًا من تصميمك الحالي وليست نصًا تجريبيًا. اضغط تحديث بعد التعديل. تقريب بصري للأوجه الرئيسية، وليس محاكاة طيّ للألسنة أو سمك الورق؛ اختبر نموذجًا ورقيًا.",
          "Preview textures come from your actual current artwork. Refresh after editing. A visual approximation of principal faces, not flap-folding or paper-thickness simulation; test a paper prototype.",
        )}
      </Note>
    </>
  );
}
