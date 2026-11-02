import { build } from "esbuild";
import { writeFile, mkdir } from "node:fs/promises";
import { cloudflareProject } from "../src/templates/cloudflare-checklist/project";
const data = { version: 1, ...cloudflareProject() };
const bundle = await build({
  entryPoints: [
    "video-studio/src/templates/cloudflare-checklist/standalone.ts",
  ],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
});
const number = (
  id: string,
  label: string,
  min: number,
  max: number,
  step = ".1",
) =>
  `<label>${label}<input id="${id}" aria-label="${label}" type="number" min="${min}" max="${max}" step="${step}"></label>`;
const html = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cloudflare — قبل ما تنشر</title><style>
*{box-sizing:border-box}body{margin:0;background:#0b0e14;color:#eee;font:14px Arial,sans-serif}header{padding:18px 24px;border-bottom:1px solid #303b4c;display:flex;gap:14px;align-items:center;flex-wrap:wrap}h1{font-size:20px;margin:0}main{display:grid;grid-template-columns:minmax(280px,1fr) 340px;max-width:1200px;margin:auto;gap:20px;padding:20px}.stage{text-align:center}canvas{display:block;margin:auto;max-width:100%;width:auto;height:min(76vh,780px);aspect-ratio:9/16;background:#10131a;border-radius:10px}button,input,select,textarea{font:inherit;border:1px solid #374458;color:#eee;background:#1b2330;border-radius:8px;padding:10px;max-width:100%}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}#export{background:#f6821f;color:#111;font-weight:bold}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #f6821f}label{display:grid;gap:6px;margin:10px 0;font-size:12px;color:#b8c4d3}label input,select,textarea{width:100%}input[type=range]{padding:0;accent-color:#f6821f}aside{max-height:85vh;overflow:auto;padding:14px;background:#111823;border:1px solid #293344;border-radius:14px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.controls,#scenes{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:12px 0}p{line-height:1.8;color:#9ba6b5}textarea{min-height:120px;direction:ltr;font:12px monospace}summary{cursor:pointer;padding:12px 0;color:#f6821f}#status{padding:10px 24px;min-height:38px}#clock{font:13px monospace;direction:ltr}@media(max-width:760px){main{grid-template-columns:1fr;padding:12px}aside{max-height:none}canvas{height:65vh}header{padding:12px}h1{font-size:17px}}
</style><header><h1>قبل ما تنشر على Cloudflare</h1><span>720×1280 · 66 ثانية</span><button id="save">تنزيل مشروع التعديل JSON</button><button id="export">تصدير MP4</button><button id="cancel" disabled>إلغاء التصدير</button></header><div id="status" role="status">عرض توضيحي مستقل، يعمل بدون إنترنت. لا يوجد تعليق صوتي أو اتصال بحساب Cloudflare.</div><main><section class="stage"><canvas id="video" width="720" height="1280" aria-label="فيديو Cloudflare"></canvas><div class="controls"><button id="play">تشغيل ▶</button><span id="clock">00:00 / 01:06</span></div><input id="seek" aria-label="وقت الفيديو" type="range" min="0" max="65.999" step=".01" value="0"><nav id="scenes" aria-label="المشاهد"></nav></section><aside><h2>هويتك</h2><label>اسم الحساب<input id="account" aria-label="اسم الحساب" value="@yourname" maxlength="100"></label><label>صورتك<input id="photo" aria-label="صورتك" type="file" accept="image/png,image/jpeg,image/webp"></label><p>الصورة الحالية رمزية، استبدلها بصورة تملكها. نزّل JSON بعد التعديل للاحتفاظ بتغييراتك.</p><h2>عناصر مستقلة</h2><select id="layer" aria-label="العنصر المحدد"></select><label>اسم العنصر<input id="name" maxlength="160"></label><label>النص<textarea id="text" maxlength="5000"></textarea></label><div class="grid">${number("x", "المكان X", 0, 100)}${number("y", "المكان Y", 0, 100)}${number("size", "حجم الخط", 12, 180)}${number("rotation", "الدوران", 0, 360)}${number("opacity", "الشفافية", 0, 1, ".05")}${number("start", "البداية", 0, 65.99)}${number("end", "النهاية", 0.01, 66)}${number("width", "عرض الشكل", 1, 4000)}${number("height", "ارتفاع الشكل", 1, 4000)}${number("radius", "تدوير الزوايا", 0, 2000)}<label>لون النص<input id="color" type="color"></label><label>لون التعبئة<input id="background" type="color"></label></div><details><summary>نقاط الحركة والعدّاد (JSON)</summary><p>at بالثواني من بداية العنصر. x/y إزاحات نسبية؛ scaleX/Y حجم؛ blur تمويه؛ easing: linear/smooth/spring.</p><textarea id="motion" aria-label="نقاط الحركة"></textarea><button id="apply-motion">تطبيق الحركة</button></details><p>لأدوات القص والتحريك المباشر والصوت: افتح ملف JSON في UniTool Video Studio.</p></aside></main><script id="project-data" type="application/json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script><script>${bundle.outputFiles[0].text.replaceAll("</script", "<\\/script")}</script></html>`;
await mkdir("public/video-studio-templates", { recursive: true });
await writeFile(
  "public/video-studio-templates/cloudflare-checklist.json",
  JSON.stringify(data, null, 2),
);
await writeFile(
  "public/video-studio-templates/cloudflare-checklist.html",
  html,
);
console.log(
  `Built standalone HTML (${Math.round(html.length / 1024)} KB), JSON, ${data.project.texts.length} editable layers.`,
);
