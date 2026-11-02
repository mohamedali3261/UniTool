import { drawTextLayers } from "../../text/render";
import { validLayerAnimation } from "../../animation/layerFrames";
import type { Project, Asset, TextLayer } from "../../types";
const data = JSON.parse(
  document.getElementById("project-data")!.textContent!,
) as { version: number; project: Project; assets: Asset[] };
const project = data.project;
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("video"),
  ctx = canvas.getContext("2d")!;
const slider = $<HTMLInputElement>("seek"),
  play = $<HTMLButtonElement>("play"),
  status = $("status"),
  picker = $<HTMLSelectElement>("layer");
let time = 0,
  playing = false,
  recording = false,
  origin = 0,
  lastDraw = 0,
  recorder: MediaRecorder | null = null,
  cancelled = false;
let avatar = new Image();
avatar.src = data.assets[1].url;
avatar.onload = () => draw(time);
const stamp = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
function draw(t: number) {
  ctx.fillStyle = "#10131a";
  ctx.fillRect(0, 0, 720, 1280);
  drawTextLayers(ctx, project.texts, t);
  for (const l of project.overlays || [])
    if (
      l &&
      !l.hidden &&
      t >= l.at &&
      t < l.at + l.end - l.start &&
      avatar.complete &&
      avatar.naturalWidth
    ) {
      ctx.save();
      ctx.globalAlpha = l.opacity;
      const w = (720 * l.width) / 100;
      ctx.translate((720 * l.x) / 100, (1280 * l.y) / 100);
      ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.drawImage(avatar, -w / 2, -w / 2, w, w);
      ctx.restore();
    }
  slider.value = String(t);
  $("clock").textContent = `${stamp(t)} / 01:06`;
}
function pause() {
  playing = false;
  play.textContent = "تشغيل ▶";
}
function tick(now: number) {
  if (playing || recording) {
    time = Math.min((now - origin) / 1000, 65.999);
    if (now - lastDraw >= 1000 / 30) {
      lastDraw = now;
      draw(time);
    }
    if (now - origin >= 66000) {
      if (recording) {
        if (recorder?.state === "recording") recorder.stop();
      } else pause();
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
play.onclick = () => {
  if (playing) pause();
  else {
    if (time >= 65.99) time = 0;
    origin = performance.now() - time * 1000;
    playing = true;
    play.textContent = "إيقاف ❚❚";
  }
};
slider.oninput = () => {
  pause();
  time = +slider.value;
  draw(time);
};
let start = 0;
for (const [i, seconds] of [4, 12, 12, 12, 12, 8, 6].entries()) {
  const at = start;
  const b = document.createElement("button");
  b.textContent = [
    "الهوك",
    "D1",
    "Secrets",
    "Cache",
    "Preview",
    "Logs",
    "التعليق",
  ][i];
  b.onclick = () => {
    pause();
    time = at + 0.2;
    draw(time);
  };
  $("scenes").appendChild(b);
  start += seconds;
}
function download(blob: Blob, name: string) {
  const a = document.createElement("a"),
    u = URL.createObjectURL(blob);
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 3000);
}
$("save").onclick = () =>
  download(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    "cloudflare-checklist.json",
  );
for (const layer of project.texts) {
  const o = document.createElement("option");
  o.value = layer.id;
  o.textContent = `${stamp(layer.start)} · ${layer.name || layer.text}`;
  picker.appendChild(o);
}
const active = () => project.texts.find((t) => t.id === picker.value)!;
const props = [
  "text",
  "name",
  "x",
  "y",
  "size",
  "rotation",
  "opacity",
  "start",
  "end",
  "color",
  "background",
] as const;
function show() {
  const layer = active();
  for (const key of props) {
    const input = $<HTMLInputElement>(key);
    input.value = String(
      layer[key] ??
        (key === "opacity"
          ? 1
          : key === "rotation"
            ? 0
            : key === "background"
              ? "#171e28"
              : ""),
    );
  }
  for (const key of ["width", "height", "radius"] as const) {
    const input = $<HTMLInputElement>(key);
    input.disabled = !layer.box;
    input.value = String(layer.box?.[key] || 0);
  }
  $<HTMLTextAreaElement>("motion").value = JSON.stringify(
    { frames: layer.frames, counter: layer.counter },
    null,
    2,
  );
}
picker.onchange = () => {
  pause();
  time = Math.min(65.99, active().start + 0.8);
  draw(time);
  show();
};
for (const key of props) {
  const input = $<HTMLInputElement>(key);
  input.oninput = () => {
    if (recording) return;
    pause();
    const layer = active();
    let value: string | number = input.value;
    if (input.type === "number") {
      value = +value;
      if (!Number.isFinite(value)) return;
      value = Math.max(+input.min, Math.min(+input.max, value));
      if (key === "start") value = Math.min(value, layer.end - 0.01);
      if (key === "end") value = Math.max(value, layer.start + 0.01);
    }
    Object.assign(layer, { [key]: value });
    draw(time);
  };
}
for (const key of ["width", "height", "radius"] as const) {
  const input = $<HTMLInputElement>(key);
  input.oninput = () => {
    const layer = active();
    if (!layer.box) return;
    layer.box = {
      ...layer.box,
      [key]: Math.max(
        key === "radius" ? 0 : 1,
        Math.min(key === "radius" ? 2000 : 4000, +input.value),
      ),
    };
    draw(time);
  };
}
$("apply-motion").onclick = () => {
  try {
    const patch = JSON.parse($<HTMLTextAreaElement>("motion").value);
    const layer = { ...active(), frames: patch.frames, counter: patch.counter };
    if (!validLayerAnimation(layer))
      throw Error("قيم الحركة غير صالحة؛ رتّب الأزمنة تصاعديًا وراجع الحدود.");
    Object.assign(active(), { frames: layer.frames, counter: layer.counter });
    status.textContent = "تم تطبيق الحركة";
    draw(time);
  } catch (e) {
    status.textContent = (e as Error).message;
  }
};
$<HTMLInputElement>("account").oninput = (e) => {
  for (const t of project.texts)
    if (["اسم حسابك الثابت", "اسم الحساب الختامي"].includes(t.name || ""))
      t.text = (e.target as HTMLInputElement).value;
  draw(time);
};
$<HTMLInputElement>("photo").onchange = async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
    f.size > 10 * 1024 * 1024
  ) {
    status.textContent = "استخدم PNG/JPEG/WebP أقل من 10MB";
    return;
  }
  const url = URL.createObjectURL(f);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const crop = document.createElement("canvas");
    crop.width = crop.height = 160;
    const c = crop.getContext("2d")!;
    c.beginPath();
    c.arc(80, 80, 77, 0, Math.PI * 2);
    c.clip();
    const size = Math.min(image.width, image.height);
    c.drawImage(
      image,
      (image.width - size) / 2,
      (image.height - size) / 2,
      size,
      size,
      0,
      0,
      160,
      160,
    );
    c.strokeStyle = "#f6821f";
    c.lineWidth = 5;
    c.stroke();
    data.assets[1].url = crop.toDataURL("image/png");
    data.assets[1].size = Math.ceil(data.assets[1].url.length * 0.75);
    data.assets[1].name = "your-profile.png";
    avatar = new Image();
    avatar.onload = () => draw(time);
    avatar.src = data.assets[1].url;
  } catch {
    status.textContent = "تعذرت قراءة الصورة";
  } finally {
    URL.revokeObjectURL(url);
  }
};
function exportState(busy: boolean) {
  recording = busy;
  for (const el of document.querySelectorAll<
    | HTMLInputElement
    | HTMLButtonElement
    | HTMLSelectElement
    | HTMLTextAreaElement
  >("button,input,select,textarea"))
    el.disabled = busy;
  $<HTMLButtonElement>("cancel").disabled = !busy;
  if (!busy) show();
}
$("export").onclick = async () => {
  const mime = ["video/mp4;codecs=avc1.42001f", "video/mp4"].find((s) =>
    window.MediaRecorder?.isTypeSupported(s),
  );
  if (!mime || !canvas.captureStream) {
    status.textContent =
      "تصدير MP4 المباشر غير متاح هنا. نزّل JSON وافتحه في المحرر للتصدير.";
    return;
  }
  pause();
  cancelled = false;
  const chunks: BlobPart[] = [];
  let stream: MediaStream | undefined;
  try {
    time = 0;
    draw(0);
    stream = canvas.captureStream(30);
    recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 4000000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onerror = () => {
      cancelled = true;
      status.textContent = "تعذر الترميز؛ نزّل JSON واستخدم المحرر.";
      if (recorder?.state === "recording") recorder.stop();
    };
    recorder.onstop = () => {
      stream?.getTracks().forEach((t) => t.stop());
      exportState(false);
      if (!cancelled) {
        download(new Blob(chunks, { type: mime }), "cloudflare-checklist.mp4");
        status.textContent = "تم تصدير MP4 · 720×1280 · بدون تعليق صوتي";
      } else status.textContent = "تم إلغاء التصدير";
    };
    exportState(true);
    status.textContent = "جارٍ التصدير — 66 ثانية، اترك الصفحة ظاهرة";
    origin = performance.now();
    recorder.start(1000);
  } catch (e) {
    stream?.getTracks().forEach((t) => t.stop());
    exportState(false);
    status.textContent = (e as Error).message;
  }
};
$("cancel").onclick = () => {
  cancelled = true;
  if (recorder?.state === "recording") recorder.stop();
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pause();
    if (recording) {
      cancelled = true;
      recorder?.stop();
    }
  }
});
window.addEventListener("pagehide", () => {
  pause();
  if (recording) {
    cancelled = true;
    recorder?.stop();
  }
});
picker.value = project.texts.find((t) => t.name === "عنوان المشهد")!.id;
show();
draw(0);
