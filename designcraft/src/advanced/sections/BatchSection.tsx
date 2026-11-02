import { useState } from "react";
import { batchVariants, batchProjects, downloadBlob } from "../core/batch";
import { getSavedProjects } from "../../utils/fabricHelpers";
import { Note, t, type Props } from "./shared";
export function BatchSection({ canvas, project, ar, run }: Props) {
  const [projects, setProjects] = useState(() =>
      getSavedProjects().filter((p) => p.canvasData?.objects),
    ),
    [ids, setIds] = useState<string[]>([]);
  return (
    <>
      <button
        onClick={() =>
          run(
            async () =>
              downloadBlob(
                await batchVariants(
                  canvas,
                  project.width,
                  project.height,
                  project.title,
                ),
                "design-variants.zip",
              ),
            false,
          )
        }
      >
        {t(
          ar,
          "ZIP: نسخة بخلفية ونسخة شفافة",
          "ZIP: background and transparent variants",
        )}
      </button>
      <Note>
        {t(
          ar,
          "الشفافية تزيل لون خلفية اللوحة فقط، ولا تحذف صورًا أو مستطيلات وضعتها كعناصر.",
          "Transparency removes only the canvas background color, not images or rectangles added as artwork.",
        )}
      </Note>
      <h3>{t(ar, "تصدير مجموعة تصاميم محفوظة", "Export saved designs")}</h3>
      <button
        onClick={() =>
          setProjects(getSavedProjects().filter((p) => p.canvasData?.objects))
        }
      >
        {t(ar, "تحديث قائمة التصاميم", "Refresh saved designs")}
      </button>
      <div className="adv-projects">
        {projects.map((p) => (
          <label key={p.id}>
            <input
              type="checkbox"
              checked={ids.includes(p.id)}
              onChange={(e) =>
                setIds(
                  e.target.checked
                    ? [...ids, p.id]
                    : ids.filter((id) => id !== p.id),
                )
              }
            />
            {p.title} · {Math.round(p.width)}×{Math.round(p.height)}
          </label>
        ))}
      </div>
      <button
        disabled={!ids.length}
        onClick={() =>
          run(async () => {
            const current = {
              ...project,
              canvasData: canvas.toJSON([
                "id",
                "name",
                "textFitMode",
                "textFitHeight",
                "textFitMaxSize",
              ]),
            };
            const chosen = projects
              .filter((p) => ids.includes(p.id))
              .map((p) => (p.id === project.id ? current : p));
            downloadBlob(await batchProjects(chosen), "designs.zip");
          }, false)
        }
      >
        {t(ar, "تحميل التصاميم المختارة ZIP", "Download selected designs ZIP")}
      </button>
      <Note>
        {t(
          ar,
          "PNG بالحجم الأصلي، حتى 10 تصاميم و16 مليون بكسل للتصميم و40 MB لمجموع الصور. أي فشل يوقف الملف كله برسالة، دون ادّعاء اكتمال التصدير.",
          "Original-size PNG: up to 10 designs, 16 MP per design and 40 MB total images. Any failure stops the archive with an error, never a false completion.",
        )}
      </Note>
    </>
  );
}
