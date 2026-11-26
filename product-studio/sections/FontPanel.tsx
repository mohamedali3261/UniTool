import { useState } from "react";
import type { Project } from "../core/model";
import { loadStudioFonts } from "../core/advanced";
export function FontPanel({
  project,
  patch,
  ar,
}: {
  project: Project;
  patch: (p: Partial<Project>) => void;
  ar: boolean;
}) {
  const [error, setError] = useState("");
  return (
    <section className="ps-extra-panel">
      <h3>{ar ? "خطوطك الخاصة" : "Your fonts"}</h3>
      <label>
        {ar ? "رفع خط WOFF / WOFF2 / TTF / OTF" : "Upload font"}
        <input
          aria-label={ar ? "رفع خط" : "Upload font"}
          type="file"
          accept=".woff,.woff2,.ttf,.otf"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              if (f.size > 2000000 || (project.fonts?.length ?? 0) >= 10)
                throw Error(
                  ar
                    ? "الحد 2MB للخط و10 خطوط"
                    : "Limit: 2MB per font, 10 fonts",
                );
              const ext = f.name.split(".").pop()?.toLowerCase();
              if (!["woff", "woff2", "ttf", "otf"].includes(ext ?? ""))
                throw Error("Invalid font");
              const bytes = new Uint8Array(await f.arrayBuffer());
              let binary = "";
              for (const b of bytes) binary += String.fromCharCode(b);
              const font = {
                name: `StudioFont${Date.now()}`,
                data: `data:font/${ext};base64,${btoa(binary)}`,
              };
              await loadStudioFonts([font]);
              patch({ fonts: [...(project.fonts ?? []), font] });
              setError("");
            } catch (err) {
              setError(String(err));
            }
          }}
        />
      </label>
      <small>
        {ar
          ? "الخطوط مضمّنة في المشروع. اختر الخط الجديد من إعدادات النص. تأكد من امتلاك ترخيصه."
          : "Fonts embed in projects. Select the new font in text settings. Use licensed fonts."}
      </small>
      {project.fonts?.map((f) => (
        <p key={f.name} style={{ fontFamily: f.name }}>
          {f.name} — أبجد Aa
        </p>
      ))}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
