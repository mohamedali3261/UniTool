import { useState } from "react";
import { uid, type Asset, type Project } from "../types";
export function SVGEditor({
  project,
  assets,
  onProject,
  onRegisterAsset,
}: {
  project: Project;
  assets: Asset[];
  onProject: (patch: Partial<Project>) => void;
  onRegisterAsset: (a: Asset) => void;
}) {
  const used = new Set([
    ...project.clips.map((c) => c.assetId),
    ...(project.overlays || []).map((l) => l.assetId),
  ]);
  const vectors = assets.filter(
    (a) => used.has(a.id) && a.url.startsWith("data:image/svg+xml"),
  );
  const [id, setId] = useState(""),
    [code, setCode] = useState(""),
    [message, setMessage] = useState("");
  if (!vectors.length) return null;
  function choose(id: string) {
    setId(id);
    setMessage("");
    const url = vectors.find((a) => a.id === id)?.url;
    if (!url) {
      setCode("");
      return;
    }
    const comma = url.indexOf(",");
    try {
      setCode(
        url.slice(0, comma).includes(";base64")
          ? new TextDecoder().decode(
              Uint8Array.from(atob(url.slice(comma + 1)), (c) =>
                c.charCodeAt(0),
              ),
            )
          : decodeURIComponent(url.slice(comma + 1)),
      );
    } catch {
      setMessage("تعذّر قراءة SVG");
    }
  }
  function apply() {
    try {
      const asset = vectors.find((a) => a.id === id);
      if (!asset) throw new Error("اختار ملف SVG الأول");
      if (code.length > 500000)
        throw new Error("حجم الكود أكبر من الحد المسموح");
      const doc = new DOMParser().parseFromString(code, "image/svg+xml");
      if (
        doc.querySelector("parsererror") ||
        doc.documentElement.localName !== "svg" ||
        doc.documentElement.namespaceURI !== "http://www.w3.org/2000/svg"
      )
        throw new Error("كود SVG غير صالح");
      if (
        doc.querySelector("script,foreignObject,iframe,style") ||
        [...doc.querySelectorAll("*")].some((el) =>
          [...el.attributes].some(
            (a) =>
              /^on/i.test(a.name) ||
              (/href$/i.test(a.name) && !a.value.startsWith("#")) ||
              (/url\(/i.test(a.value) &&
                /url\(\s*["']?(?!#)[a-z/]/i.test(a.value)),
          ),
        ) ||
        /@import|javascript:/i.test(code)
      )
        throw new Error("استخدم SVG ثابت بدون سكربتات أو روابط خارجية");
      const box = doc.documentElement
        .getAttribute("viewBox")
        ?.split(/[ ,]+/)
        .map(Number);
      const width =
        parseFloat(doc.documentElement.getAttribute("width") || "") ||
        box?.[2] ||
        asset.width;
      const height =
        parseFloat(doc.documentElement.getAttribute("height") || "") ||
        box?.[3] ||
        asset.height;
      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width! <= 0 ||
        height! <= 0 ||
        width! > 20000 ||
        height! > 20000
      )
        throw new Error("أبعاد SVG لازم تكون موجبة وأقل من ٢٠ ألف بكسل");
      const next = {
        ...asset,
        id: uid(),
        width,
        height,
        url: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(code),
      };
      onRegisterAsset(next);
      onProject({
        clips: project.clips.map((c) =>
          c.assetId === id ? { ...c, assetId: next.id } : c,
        ),
        overlays: project.overlays?.map((l) =>
          l.assetId === id ? { ...l, assetId: next.id } : l,
        ),
      });
      setId(next.id);
      setMessage("تم تطبيق SVG. تقدر تتراجع بـ Ctrl+Z.");
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <details className="layer-editor studio-svg-editor">
      <summary>تعديل كود عناصر SVG</summary>
      <p>
        التحريك والحجم والشفافية من «طبقات إضافية». لتعديل الرسم والألوان
        الداخلية، اختار ملفه وعدّل الكود هنا. التغيير يحدّث استخداماته في
        المشروع ده فقط.
      </p>
      <label className="field-label">
        عنصر SVG
        <select
          aria-label="عنصر SVG للتعديل"
          value={vectors.some((a) => a.id === id) ? id : ""}
          onChange={(e) => choose(e.target.value)}
        >
          <option value="">اختار SVG</option>
          {vectors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      {id && vectors.some((a) => a.id === id) && (
        <>
          <textarea
            aria-label="كود SVG القابل للتعديل"
            dir="ltr"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="secondary" onClick={apply}>
            تطبيق تعديل SVG
          </button>
        </>
      )}
      <p role="status">{message}</p>
    </details>
  );
}
