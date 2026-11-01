import { type Project } from "./types";
import { raster, download, safeName, exportSize } from "./export-tools";
import { fonts } from "./fonts";
import { syncVariants } from "./variants";
export function brandColors(p: Project) {
  return [
    ...new Set([
      ...(p.background ? [p.background] : []),
      ...p.nodes
        .filter((n) => !n.hidden && n.kind !== "image")
        .flatMap((n) => {
          const fills =
            n.kind === "vector" && !n.recolor
              ? n.paths?.map((v) => v.fill) || []
              : [n.fill, ...(n.gradient ? [n.fill2] : [])];
          return [
            ...fills,
            ...(n.strokeWidth &&
            n.kind !== "icon" &&
            !(n.kind === "shape" && n.asset === "ring")
              ? [n.stroke]
              : []),
          ];
        }),
    ]),
  ];
}
/** دليل PDF مرئي؛ النص العربي يُرسم بالخطوط المحلية لتجنّب أحرف PDF غير المتصلة. */
export async function exportBrandGuide(p: Project, lang: "ar" | "en") {
  await document.fonts.load("400 28px cairo");
  await document.fonts.ready;
  const { jsPDF } = await import("jspdf"),
    pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [1400, 1980],
      hotfixes: ["px_scaling"],
    }),
    colors = [
      ...new Set(
        syncVariants(p).flatMap((v) => brandColors({ ...p, nodes: v.nodes })),
      ),
    ],
    families = [
      ...new Set(
        syncVariants(p)
          .flatMap((v) => v.nodes)
          .filter((n) => n.kind === "text" && !n.hidden)
          .map((n) => fonts.find((f) => f.id === n.font)?.name || n.font),
      ),
    ];
  const image = async (project: Project) => {
    const dim = exportSize(project, 1000),
      blob = await raster(project, dim.width, dim.height),
      url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1980;
  const ctx = canvas.getContext("2d")!;
  function page(title: string) {
    ctx.fillStyle = "#f5f7f1";
    ctx.fillRect(0, 0, 1400, 1980);
    ctx.fillStyle = "#18392d";
    ctx.font = "400 42px cairo";
    ctx.textAlign = "center";
    ctx.fillText(title, 700, 90);
    ctx.font = "400 26px cairo";
    ctx.fillText(p.name.slice(0, 70), 700, 145);
  }
  function swatches(chunk: string[], y: number) {
    chunk.forEach((c, i) => {
      const x = 100 + (i % 4) * 310,
        row = Math.floor(i / 4);
      ctx.fillStyle = c;
      ctx.fillRect(x, y + row * 150, 270, 90);
      ctx.fillStyle = "#18392d";
      ctx.font = "24px inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(c.toUpperCase(), x, y + row * 150 + 126);
    });
  }
  page(lang === "ar" ? "دليل الهوية البصرية" : "BRAND GUIDELINES");
  const logo = await image(p),
    r = Math.min(1120 / logo.width, 560 / logo.height);
  ctx.drawImage(
    logo,
    700 - (logo.width * r) / 2,
    185,
    logo.width * r,
    logo.height * r,
  );
  ctx.font = "400 30px cairo";
  ctx.fillStyle = "#18392d";
  ctx.textAlign = "center";
  ctx.fillText(lang === "ar" ? "ألوان العلامة" : "BRAND COLORS", 700, 815);
  swatches(colors.slice(0, 8), 860);
  ctx.textAlign = "center";
  ctx.font = "400 28px cairo";
  ctx.fillText(lang === "ar" ? "الخطوط المستخدمة" : "TYPE FAMILIES", 700, 1230);
  ctx.font = "24px inter, sans-serif";
  families.slice(0, 14).forEach((f, i) => ctx.fillText(f, 700, 1270 + i * 30));
  const versions = syncVariants(p).slice(0, 4);
  for (let i = 0; i < versions.length; i++) {
    const v = versions[i],
      img = await image({ ...p, nodes: v.nodes, background: v.background }),
      ratio = Math.min(270 / img.width, 220 / img.height);
    ctx.fillStyle = v.background || "#ffffff";
    ctx.fillRect(70 + i * 325, 1690, 290, 230);
    ctx.drawImage(
      img,
      80 + i * 325 + (270 - img.width * ratio) / 2,
      1695,
      img.width * ratio,
      img.height * ratio,
    );
    ctx.fillStyle = "#18392d";
    ctx.font = "18px cairo";
    ctx.textAlign = "center";
    ctx.fillText(v.name, 215 + i * 325, 1950);
  }
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 1400, 1980);
  for (let i = 8; i < colors.length; i += 40) {
    page(lang === "ar" ? "باقي ألوان العلامة" : "ADDITIONAL COLORS");
    swatches(colors.slice(i, i + 40), 220);
    pdf.addPage([1400, 1980]);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 1400, 1980);
  }
  for (let offset = 14; offset < families.length; offset += 40) {
    page(lang === "ar" ? "باقي الخطوط" : "ADDITIONAL TYPE FAMILIES");
    ctx.fillStyle = "#18392d";
    ctx.font = "24px inter, sans-serif";
    ctx.textAlign = "center";
    families
      .slice(offset, offset + 40)
      .forEach((f, i) => ctx.fillText(f, 700, 230 + i * 36));
    pdf.addPage([1400, 1980]);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 1400, 1980);
  }
  // النسخ الزائدة لها صفحات مستقلة، ولا تُحذف من الدليل.
  const all = syncVariants(p);
  for (let i = 4; i < all.length; i++) {
    page(all[i].name);
    const img = await image({
        ...p,
        nodes: all[i].nodes,
        background: all[i].background,
      }),
      ratio = Math.min(1150 / img.width, 1500 / img.height);
    ctx.drawImage(
      img,
      700 - (img.width * ratio) / 2,
      230,
      img.width * ratio,
      img.height * ratio,
    );
    pdf.addPage([1400, 1980]);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 1400, 1980);
  }
  pdf.setProperties({
    title: p.name + " — Brand guide",
    creator: "UniTool Logo Designer",
  });
  download(pdf.output("blob"), safeName(p.name) + "-brand-guide.pdf");
}
