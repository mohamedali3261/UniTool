import { useState } from "react";
import type { Project } from "../core/model";
import type { PreviewHandle } from "./Preview3D";
import { validateGlb, parseGarmentGlb, disposeGlb } from "../core/glb";
import { downloadBlob } from "../../src/utils/download";
export function SceneExtras({
  project,
  patch,
  preview,
  ar,
}: {
  project: Project;
  patch: (p: Partial<Project>) => void;
  preview: React.RefObject<PreviewHandle | null>;
  ar: boolean;
}) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="ps-extra-panel">
      <h3>{ar ? "التصوير والمجسمات" : "Photography & models"}</h3>
      <div className="ps-chip-grid">
        {[
          {
            ar: "استوديو ناعم",
            en: "Soft studio",
            background: "#b9c5ba",
            lightPower: 2,
            lightAngle: 35,
          },
          {
            ar: "كتالوج فاتح",
            en: "Bright catalog",
            background: "#eeeeee",
            lightPower: 3,
            lightAngle: -30,
          },
          {
            ar: "استوديو داكن",
            en: "Dark studio",
            background: "#172f32",
            lightPower: 3.8,
            lightAngle: 65,
          },
        ].map((p) => (
          <button
            key={p.en}
            onClick={() =>
              patch({
                background: p.background,
                appearance: {
                  ...project.appearance,
                  lightPower: p.lightPower,
                  lightAngle: p.lightAngle,
                },
              })
            }
          >
            {ar ? p.ar : p.en}
          </button>
        ))}
      </div>
      <button onClick={() => preview.current?.focusArtwork()}>
        {ar ? "تقريب على التصميم" : "Focus artwork"}
      </button>
      <button
        disabled={busy}
        onClick={async () => {
          if (!preview.current) {
            setStatus(ar ? "افتح معاينة 3D أولًا" : "Open 3D preview first");
            return;
          }
          setBusy(true);
          try {
            for (const view of ["front", "back", "side"] as const) {
              preview.current.setCameraView(view);
              const blob = await preview.current.exportImage(2048, false);
              downloadBlob(blob, `${project.name}-${view}.png`, {
                silent: true,
              });
            }
            setStatus(
              ar
                ? "تم تنزيل الزوايا. اسمح بتنزيل عدة ملفات."
                : "Views downloaded. Allow multiple downloads.",
            );
          } catch (e) {
            setStatus(String(e));
          } finally {
            preview.current?.resetView();
            setBusy(false);
          }
        }}
      >
        {ar ? "تصدير الأمام والخلف والجنب" : "Export front, back & side"}
      </button>
      <label>
        {ar ? "استيراد مجسم GLB مرخّص" : "Import licensed GLB"}
        <input
          type="file"
          accept=".glb"
          aria-label="Import GLB"
          disabled={busy}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              if (f.size > 20000000) throw Error("Max 20MB");
              const buffer = await f.arrayBuffer();
              validateGlb(buffer);
              const g = await parseGarmentGlb(buffer);
              disposeGlb(g);
              const bytes = new Uint8Array(buffer);
              let binary = "";
              for (const b of bytes) binary += String.fromCharCode(b);
              patch({
                customModel: `data:model/gltf-binary;base64,${btoa(binary)}`,
              });
              setStatus(
                ar
                  ? "تم تحميل المجسم؛ افتح معاينة 3D"
                  : "Model loaded; open 3D preview",
              );
            } catch (err) {
              setStatus(String(err));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <small>
        {ar
          ? "GLB 2.0 مستقل، حتى 20MB و500 ألف رأس، دون موارد خارجية أو ضغط. يلزم سطحا UV باسم front وback، واختياريًا أسماء الأكمام leftSleeve وrightSleeve. جودة الواقعية تعتمد على الملف المرخّص الذي ترفعه؛ لا يوجد مسح احترافي مرفق."
          : "Self-contained GLB 2.0, max 20MB / 500k vertices, no external resources or compression. Requires UV meshes named front and back; optional leftSleeve/rightSleeve. Realism depends on your licensed model; no professional scan is bundled."}
      </small>
      {project.customModel && (
        <button onClick={() => patch({ customModel: undefined })}>
          {ar ? "العودة للمجسم الأصلي" : "Use original model"}
        </button>
      )}
      {status && <p role="status">{status}</p>}
    </section>
  );
}
