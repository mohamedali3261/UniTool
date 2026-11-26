import { useState } from "react";
import type { Project } from "../core/model";
import { downloadBlob } from "../../src/utils/download";
export function ProductionPanel({
  project,
  ar,
}: {
  project: Project;
  ar: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  async function run(zip: boolean) {
    setBusy(true);
    setStatus("");
    try {
      const { specSheet, printBundle } = await import("../core/production");
      const blob = await (zip
        ? printBundle(project, ar)
        : specSheet(project, ar));
      downloadBlob(
        blob,
        `${project.name}-${zip ? "print-package.zip" : "spec-sheet.pdf"}`,
        { silent: true },
      );
      setStatus(ar ? "تم تنزيل الملف" : "Downloaded");
    } catch (e) {
      setStatus(
        `${ar ? "راجع مساحة الطباعة لكل جزء مستخدم: " : "Check measured print areas: "}${String(e)}`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ps-extra-panel">
      <h3>{ar ? "حزمة المطبعة" : "Print-shop package"}</h3>
      <button disabled={busy} onClick={() => run(true)}>
        {busy
          ? "…"
          : ar
            ? "تنزيل حزمة ZIP + PDF"
            : "Download ZIP + PDF package"}
      </button>
      <button disabled={busy} onClick={() => run(false)}>
        {ar ? "ورقة المواصفات PDF" : "Spec sheet PDF"}
      </button>
      <small>
        {ar
          ? "يلزم إدخال مساحة الطباعة لكل جزء مستخدم. كل طبعة في PNG مستقلة مع DPI فعلي، وPDF للمقاس والموضع بالنسبة لمساحة الطباعة، وليس لحواف الملابس. راجع القياسات مع المطبعة."
          : "Enter actual print-area measurements for every used panel. Each print is a separate PNG with DPI metadata; PDF positions are relative to the print area, not garment edges. Verify with your printer."}
      </small>
      {status && <p role="status">{status}</p>}
    </section>
  );
}
