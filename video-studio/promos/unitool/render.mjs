/** One command: npm run render:unitool. See README for overrides. */
import { build } from "esbuild";
import { chromium } from "playwright";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { once } from "node:events";
const SOURCE = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(SOURCE, "../../..");
const ROOT = existsSync(
  path.join(repoRoot, "video-studio/promos/unitool/film.ts"),
)
  ? repoRoot
  : SOURCE;
const out = path.resolve(
  process.env.UNITOOL_OUTPUT || path.join(SOURCE, "output"),
);
const previewOnly = process.argv.includes("--preview-only");
const noMusic = process.argv.includes("--no-music");
await fs.mkdir(path.join(out, "previews"), { recursive: true });
const cache = path.join(ROOT, ".cache/unitool-render");
await fs.mkdir(cache, { recursive: true });
const bundle = await build({
  entryPoints: [path.join(SOURCE, "film.ts")],
  bundle: true,
  write: false,
  format: "iife",
  target: "es2022",
  minify: true,
});
const module = await build({
  entryPoints: [path.join(SOURCE, "film.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "es2022",
});
await fs.writeFile(path.join(cache, "film.mjs"), module.outputFiles[0].text);
const film = await import(
  pathToFileURL(path.join(cache, "film.mjs")).href + "?v=" + Date.now()
);
const { CONFIG, TIMELINE } = film;
if (
  TIMELINE[0].start !== 0 ||
  TIMELINE.at(-1).end !== CONFIG.duration ||
  TIMELINE.some((s, i) => i > 0 && s.start !== TIMELINE[i - 1].end)
)
  throw Error("Timeline gaps or overlaps");
let faces = "";
for (const [family, file] of [
  ["FilmArabic", "tajawal-arabic-700.woff2"],
  ["FilmLatin", "tajawal-latin-700.woff2"],
  ["FilmMono", "jetbrains-mono-500.woff2"],
]) {
  faces += `@font-face{font-family:${family};src:url(data:font/woff2;base64,${(await fs.readFile(path.join(SOURCE, "assets", file))).toString("base64")}) format('woff2');font-weight:${family === "FilmMono" ? 500 : 700};font-display:block}`;
}
const html = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unitool — One workspace</title><style>${faces}*{box-sizing:border-box}html,body{margin:0;background:#090e1d;color:#edf2ff;font-family:FilmArabic,FilmLatin,Arial;font-weight:700}#stage{width:min(100vw,1920px);aspect-ratio:16/9;margin:auto}#stage svg{display:block;width:100%;height:100%}aside{max-width:1200px;margin:auto;padding:18px}button,input{font:inherit;color:inherit;accent-color:#59e4ef}button{background:#1a2941;border:1px solid #344960;border-radius:10px;padding:10px 16px;cursor:pointer}.toolbar{display:flex;gap:16px;align-items:center;flex-wrap:wrap}input[type=range]{flex:1;min-width:180px}#chapters{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}#chapters button{font-size:13px}small{display:block;color:#92a2ba;margin-top:18px;line-height:1.8}body.render #stage{width:1920px;height:1080px}body.render aside{display:none}</style><div id="stage"></div><aside><div class="toolbar"><button id="play">تشغيل ▶</button><input id="seek" aria-label="وقت الفيديو" type="range" min="0" max="91.999" step=".033333" value="0"><span id="clock" dir="ltr">0 / 92s</span><label><input id="sound" type="checkbox"> موسيقى هادئة + أصوات UI</label></div><nav id="chapters" aria-label="المشاهد"></nav><small>1920×1080 · 30fps · 92 ثانية. كل الرسوم بالكود؛ لا صور أو خطوط أو موسيقى خارجية. الواجهات محاكاة توضيحية، ومشهد الأدوات الإضافية تصوّر حسب الإصدار. SVG لأصل مرسوم متجهيًا، وليس ادعاء تحويل أي صورة نقطية إلى متجهات. أصوات القراءة المتاحة تعتمد على جهازك. لإعادة الرندر: npm run render:unitool</small></aside><script>if(window.__RENDER__)document.body.classList.add('render');${bundle.outputFiles[0].text.replaceAll("</script", "<\\/script")}</script></html>`;
const htmlPath = path.join(out, "unitool-film.html");
await fs.writeFile(htmlPath, html);
let exe = process.env.STUDIO_CHROMIUM_PATH || process.env.CHROMIUM_PATH;
if (!exe && !existsSync(chromium.executablePath())) {
  console.log("Installing Chromium for deterministic rendering…");
  execFileSync(
    process.execPath,
    [path.join(ROOT, "node_modules/playwright/cli.js"), "install", "chromium"],
    { stdio: "inherit" },
  );
}
const browser = await chromium.launch({
  executablePath: exe,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
  ],
});
let encoder;
try {
  const page = await browser.newPage({
    viewport: { width: CONFIG.width, height: CONFIG.height },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__RENDER__ = true;
  });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  if (!(await page.evaluate(() => document.fonts.check("700 40px FilmArabic"))))
    throw Error("Arabic font failed to load");
  const bounds = async () =>
    page.evaluate(() => {
      const result = [];
      for (const el of document.querySelectorAll('[data-safe="text"]')) {
        if (!el.textContent?.trim()) continue;
        let opacity = 1;
        for (let p = el; p && p.tagName !== "svg"; p = p.parentElement)
          opacity *= Number(getComputedStyle(p).opacity || 1);
        if (opacity < 0.1) continue;
        const r = el.getBoundingClientRect();
        if (r.left < 55 || r.right > 1865 || r.top < 20 || r.bottom > 1065)
          result.push({
            text: el.textContent,
            x: r.x,
            y: r.y,
            w: r.width,
            h: r.height,
          });
      }
      return result;
    });
  const previews = [];
  for (const scene of TIMELINE) {
    await page.evaluate((t) => window.UnitoolFilm.seek(t), scene.sample);
    const violations = await bounds();
    if (violations.length)
      throw Error(
        `Text outside safe frame in ${scene.id}: ${JSON.stringify(violations)}`,
      );
    const name = `${String(previews.length).padStart(2, "0")}-${scene.id}.png`;
    await page.screenshot({
      path: path.join(out, "previews", name),
      type: "png",
    });
    previews.push({ scene: scene.id, time: scene.sample, file: name });
    console.log(`Preview ${scene.id} @ ${scene.sample}s ✓`);
  }
  // Check one steady sample every second, including before/after phases inside scenes.
  for (let t = 0.7; t < 92; t++) {
    await page.evaluate((t) => window.UnitoolFilm.seek(t), t);
    const violations = await bounds();
    if (violations.length)
      throw Error(`Text overflow at ${t}s: ${JSON.stringify(violations)}`);
  }
  if (errors.length) throw Error(errors.join("\n"));
  await fs.writeFile(
    path.join(out, "previews", "manifest.json"),
    JSON.stringify(
      {
        config: CONFIG,
        timeline: TIMELINE,
        previews,
        checkedTextSamples: 92,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Preview QA ready: eight scene screenshots; Arabic font and safe text bounds checked.",
  );
  if (previewOnly) {
    console.log(`Review previews in ${out}/previews before final rendering.`);
    process.exitCode = 0;
  } else {
    let ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
    if (spawnSync(ffmpeg, ["-version"], { stdio: "ignore" }).status !== 0) {
      const python = process.env.PYTHON || "python3";
      const pycache = path.join(cache, "python");
      const probe = spawnSync(
        python,
        [
          "-c",
          `import sys;sys.path.insert(0,${JSON.stringify(pycache)});import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())`,
        ],
        { encoding: "utf8" },
      );
      if (probe.status !== 0) {
        execFileSync(
          python,
          ["-m", "pip", "install", "--target", pycache, "imageio-ffmpeg"],
          { stdio: "inherit" },
        );
      }
      ffmpeg = execFileSync(
        python,
        [
          "-c",
          `import sys;sys.path.insert(0,${JSON.stringify(pycache)});import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())`,
        ],
        { encoding: "utf8" },
      ).trim();
    }
    const sampleRate = 48000,
      count = CONFIG.duration * sampleRate;
    const wave = Buffer.alloc(44 + count * 4);
    wave.write("RIFF", 0);
    wave.writeUInt32LE(wave.length - 8, 4);
    wave.write("WAVEfmt ", 8);
    wave.writeUInt32LE(16, 16);
    wave.writeUInt16LE(1, 20);
    wave.writeUInt16LE(2, 22);
    wave.writeUInt32LE(sampleRate, 24);
    wave.writeUInt32LE(sampleRate * 4, 28);
    wave.writeUInt16LE(4, 32);
    wave.writeUInt16LE(16, 34);
    wave.write("data", 36);
    wave.writeUInt32LE(count * 4, 40);
    let peak = 0;
    for (let i = 0; i < count; i++) {
      const v = film.audioSample(
        i / sampleRate,
        !noMusic && !process.env.MUSIC_FILE,
      );
      peak = Math.max(peak, Math.abs(v));
      const n = Math.round(v * 32767);
      wave.writeInt16LE(n, 44 + i * 4);
      wave.writeInt16LE(n, 46 + i * 4);
    }
    const wavPath = path.join(cache, "audio.wav");
    await fs.writeFile(wavPath, wave);
    const finalVideoPath = path.join(out, "unitool-1920x1080.mp4");
    const videoPath = path.join(out, "unitool.partial.mp4");
    const args = [
      "-y",
      "-hide_banner",
      "-loglevel",
      "warning",
      "-f",
      "image2pipe",
      "-framerate",
      String(CONFIG.fps),
      "-vcodec",
      "mjpeg",
      "-i",
      "pipe:0",
      "-i",
      wavPath,
    ];
    if (process.env.MUSIC_FILE)
      args.push(
        "-i",
        path.resolve(process.env.MUSIC_FILE),
        "-filter_complex",
        "[2:a]aloop=loop=-1:size=2147483647,volume=0.10,afade=t=in:d=2,afade=t=out:st=89:d=3[m];[1:a][m]amix=inputs=2:duration=first:normalize=0[a]",
        "-map",
        "0:v",
        "-map",
        "[a]",
      );
    else args.push("-map", "0:v", "-map", "1:a");
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      process.env.X264_PRESET || "fast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(CONFIG.fps),
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-t",
      String(CONFIG.duration),
      "-movflags",
      "+faststart",
      videoPath,
    );
    let log = "";
    encoder = spawn(ffmpeg, args, { stdio: ["pipe", "ignore", "pipe"] });
    encoder.stderr.on("data", (b) => {
      log = (log + b.toString()).slice(-18000);
    });
    let encoderError;
    encoder.on("error", (e) => {
      encoderError = e;
    });
    encoder.stdin.on("error", (e) => {
      encoderError = e;
    });
    const closed = once(encoder, "close");
    const workerCount = Math.max(
      1,
      Math.min(4, Number(process.env.RENDER_WORKERS || 2)),
    );
    const workers = [{ page, cdp: await page.context().newCDPSession(page) }];
    for (let i = 1; i < workerCount; i++) {
      const workerPage = await browser.newPage({
        viewport: { width: CONFIG.width, height: CONFIG.height },
        deviceScaleFactor: 1,
      });
      workerPage.on("pageerror", (e) => errors.push(e.message));
      await workerPage.addInitScript(() => {
        window.__RENDER__ = true;
      });
      await workerPage.goto(pathToFileURL(htmlPath).href);
      await workerPage.evaluate(async () => {
        await document.fonts.ready;
      });
      workers.push({
        page: workerPage,
        cdp: await workerPage.context().newCDPSession(workerPage),
      });
    }
    const total = CONFIG.duration * CONFIG.fps;
    console.log(
      `Rendering ${total} deterministic frames at ${CONFIG.width}×${CONFIG.height}, ${CONFIG.fps}fps (${workerCount} ordered workers)…`,
    );
    for (let base = 0; base < total; base += workerCount) {
      if (encoderError) throw encoderError;
      const images = await Promise.all(
        workers
          .slice(0, Math.min(workerCount, total - base))
          .map(async (worker, i) => {
            await worker.page.evaluate(
              (n) => window.UnitoolFilm.seekFrame(n),
              base + i,
            );
            const shot = await worker.cdp.send("Page.captureScreenshot", {
              format: "jpeg",
              quality: 95,
              fromSurface: true,
              captureBeyondViewport: false,
            });
            return Buffer.from(shot.data, "base64");
          }),
      );
      // Promise.all preserves frame order; only bounded batches are held in memory.
      for (const image of images)
        if (!encoder.stdin.write(image)) await once(encoder.stdin, "drain");
      if (base % (Math.round(150 / workerCount) * workerCount) === 0)
        console.log(
          `${((100 * base) / total).toFixed(1)}%  frame ${base}/${total}`,
        );
    }
    encoder.stdin.end();
    const [code] = await closed;
    if (code !== 0) throw Error(`FFmpeg failed (${code}): ${log}`);
    if (errors.length) throw Error(errors.join("\n"));
    // Decode the completed file, not just the browser preview, and count every frame.
    const validate = spawnSync(
      ffmpeg,
      ["-v", "info", "-i", videoPath, "-map", "0:v:0", "-f", "null", "-"],
      { encoding: "utf8", maxBuffer: 3 * 1024 * 1024 },
    );
    if (validate.status !== 0)
      throw Error("MP4 decode validation failed: " + validate.stderr);
    const metadata = validate.stderr;
    if (
      !/Video: h264/.test(metadata) ||
      !metadata.includes("1920x1080") ||
      !metadata.includes("30 fps")
    )
      throw Error("Unexpected output codec/dimensions/fps: " + metadata);
    const matches = [...metadata.matchAll(/frame=\s*(\d+)/g)];
    if (Number(matches.at(-1)?.[1]) !== total)
      throw Error("Wrong decoded frame count: " + matches.at(-1)?.[1]);
    if (!/Audio: aac/.test(metadata))
      throw Error("Expected AAC UI audio track");
    await fs.rename(videoPath, finalVideoPath);
    await fs.writeFile(
      path.join(out, "render-report.json"),
      JSON.stringify(
        {
          codec: "H.264",
          pixelFormat: "yuv420p",
          width: 1920,
          height: 1080,
          fps: 30,
          frames: total,
          duration: 92,
          audio: "AAC stereo 48000Hz",
          audioPeak: peak,
          audioCues: film.AUDIO_CUES.length,
          music: process.env.MUSIC_FILE
            ? "user-supplied"
            : noMusic
              ? "off"
              : "original code-synthesized ambient",
          previewQa: previews,
          validation: "Full MP4 decoded successfully; all 2760 frames counted.",
          ffmpegLog: metadata,
        },
        null,
        2,
      ),
    );
    console.log(
      `DONE: ${finalVideoPath}\nVerified: H.264 / 1920×1080 / 30fps / ${total} frames / AAC audio.`,
    );
  }
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill("SIGTERM");
  await browser.close();
}
