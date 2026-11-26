import { useEffect, useState } from "react";
import type { Project, Side } from "../core/model";
import { printParts, partNames } from "../core/model";
import { drawArtwork, sourceToken } from "../core/artwork";
import { effectiveDpi, printPixels, loadStudioFonts } from "../core/advanced";
import { downloadBlob } from "../../src/utils/download";
export function PrintPanel({
  project,
  side,
  patch,
  ar,
}: {
  project: Project;
  side: Side;
  patch: (p: Partial<Project>) => void;
  ar: boolean;
}) {
  const area = project.printAreas?.[side],
    [warnings, setWarnings] = useState<string[]>([]),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const qualityKey = JSON.stringify(
    project.sides[side]
      .filter((l) => l.kind === "image")
      .map((l) => [l.id, l.w, l.h, l.crop, sourceToken(l.src), l.visible]),
  );
  useEffect(() => {
    let active = true;
    Promise.all(
      project.sides[side]
        .filter((l) => l.kind === "image")
        .map(async (l) => {
          const i = new Image();
          i.src = l.src;
          try {
            await i.decode();
            const dpi = area
              ? Math.round(effectiveDpi(i.width * (l.crop?.w ?? 1), l.w, area))
              : 0;
            return area && dpi < area.dpi ? `${l.name}: ${dpi} DPI` : "";
          } catch {
            return l.name + ": image error";
          }
        }),
    ).then((r) => {
      if (active) setWarnings(r.filter(Boolean));
    });
    return () => {
      active = false;
    };
  }, [qualityKey, side, area]);
  async function exportParts() {
    setBusy(true);
    try {
      await loadStudioFonts(project.fonts);
      for (const part of printParts) {
        if (!project.sides[part].length) continue;
        const a = project.printAreas?.[part];
        const dims = a ? printPixels(a) : { width: 2048, height: 2048 };
        if (dims.width * dims.height > 32000000)
          throw Error(
            ar
              ? "قلل المقاس أو DPI — الحد 32 مليون بكسل"
              : "Reduce dimensions or DPI: 32 megapixel limit",
          );
        const c = await drawArtwork(
          project.sides[part],
          dims.width,
          dims.height,
        );
        const blob = await new Promise<Blob>((res, rej) =>
          c.toBlob((b) => (b ? res(b) : rej(Error("PNG failed")))),
        );
        downloadBlob(
          blob,
          `${project.name}-${part}-${c.width}x${c.height}.png`,
          { silent: true },
        );
      }
      setStatus(
        ar
          ? "تم تصدير الأجزاء غير الفارغة. اسمح بتنزيل عدة ملفات في المتصفح."
          : "Exported non-empty panels. Allow multiple downloads.",
      );
    } catch (e) {
      setStatus(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ps-extra-panel">
      <h3>{ar ? "تجهيز الطباعة" : "Print preparation"}</h3>
      <p>{partNames[side][ar ? "ar" : "en"]}</p>
      <label className="ps-check">
        <input
          type="checkbox"
          checked={!!area}
          onChange={(e) => {
            const next = { ...project.printAreas };
            if (e.target.checked)
              next[side] = { width: 30, height: 30, dpi: 300, safe: 1 };
            else delete next[side];
            patch({ printAreas: next });
          }}
        />
        {ar ? "تحديد مساحة الطباعة الفعلية" : "Set actual print area"}
      </label>
      <small>
        {ar
          ? "أدخل قياسات المطبعة الفعلية؛ القيم المبدئية مثال وليست مقاس المنتج."
          : "Enter printer measurements; initial values are examples, not garment dimensions."}
      </small>
      {area && (
        <>
          <div className="ps-input-grid">
            {(["width", "height", "dpi", "safe"] as const).map((key, i) => (
              <label key={key}>
                {ar
                  ? ["العرض سم", "الارتفاع سم", "الدقة DPI", "هامش الأمان سم"][
                      i
                    ]
                  : ["Width cm", "Height cm", "DPI", "Safe margin cm"][i]}
                <input
                  aria-label={`Print ${key}`}
                  type="number"
                  step={key === "dpi" ? 1 : 0.1}
                  min={key === "safe" ? 0 : key === "dpi" ? 72 : 1}
                  max={
                    key === "dpi"
                      ? 600
                      : key === "safe"
                        ? Math.min(area.width, area.height) / 3
                        : 100
                  }
                  value={area[key]}
                  onChange={(e) => {
                    const value = +e.target.value;
                    const max =
                      key === "dpi"
                        ? 600
                        : key === "safe"
                          ? Math.min(area.width, area.height) / 3
                          : 100;
                    patch({
                      printAreas: {
                        ...project.printAreas,
                        [side]: {
                          ...area,
                          [key]: Math.max(
                            key === "safe" ? 0 : key === "dpi" ? 72 : 1,
                            Math.min(max, value),
                          ),
                          ...(key === "width" || key === "height"
                            ? {
                                safe: Math.min(
                                  area.safe,
                                  Math.max(1, Math.min(100, value)) / 3,
                                  (key === "width" ? area.height : area.width) /
                                    3,
                                ),
                              }
                            : {}),
                        },
                      },
                    });
                  }}
                />
              </label>
            ))}
          </div>
          <p>
            {printPixels(area).width} × {printPixels(area).height} px
          </p>
          {project.sides[side]
            .filter((l) => l.visible)
            .filter((l) => {
              const a = (l.rotation * Math.PI) / 180,
                c = Math.abs(Math.cos(a)),
                s = Math.abs(Math.sin(a));
              const hw = (l.w * c + l.h * s) / 2,
                hh = (l.w * s + l.h * c) / 2,
                cx = l.x + l.w / 2,
                cy = l.y + l.h / 2;
              return (
                cx - hw < (area.safe / area.width) * 1024 ||
                cx + hw > 1024 - (area.safe / area.width) * 1024 ||
                cy - hh < (area.safe / area.height) * 1024 ||
                cy + hh > 1024 - (area.safe / area.height) * 1024
              );
            })
            .map((l) => (
              <p key={l.id} className="ps-warning" role="status">
                {l.name}:{" "}
                {ar
                  ? "يتجاوز هامش الأمان أو حدود الطباعة"
                  : "Outside safe margin or print boundary"}
              </p>
            ))}
          {warnings.map((w) => (
            <p role="status" className="ps-warning" key={w}>
              {ar ? "جودة أقل من المطلوبة: " : "Below target resolution: "}
              {w}
            </p>
          ))}
        </>
      )}
      <button disabled={busy} onClick={exportParts}>
        {busy
          ? "…"
          : ar
            ? "تصدير الأجزاء PNG شفافة"
            : "Export transparent panel PNGs"}
      </button>
      <small>
        {ar
          ? "بدون قياسات: 2048 × 2048. أبعاد البكسل محسوبة من DPI المطلوب، ولا نضمّن بيانات DPI في PNG."
          : "Without dimensions: 2048 × 2048. Pixel dimensions use target DPI; no PNG DPI metadata is embedded."}
      </small>
      {status && <p role="status">{status}</p>}
    </section>
  );
}
