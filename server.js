import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXE_PATH = join(__dirname, 'WatermarkTool', 'GeminiWatermarkTool-Video.exe');
const TMP_DIR = join(__dirname, '.watermark-tmp');
const PORT = process.env.WATERMARK_API_PORT || 3001;

const app = express();
const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 1024 * 1024 * 1024 },
});

async function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    await mkdir(TMP_DIR, { recursive: true });
  }
}

function runWatermarkTool(inputPath, outputPath, options) {
  return new Promise((resolve, reject) => {
    const args = [
      '--no-banner',
      '-i', inputPath,
      '-o', outputPath,
    ];

    if (options.mediaType === 'video') {
      args.splice(1, 0, '--veo');
    }

    if (options.mark && options.mark !== 'auto') {
      args.push('--mark', options.mark);
    }
    if (options.legacy) args.push('--legacy');
    if (options.ml) args.push('--ml');
    if (options.verbose) args.push('--verbose');

    const proc = spawn(EXE_PATH, args, { windowsHide: true });
    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(stderr || `Process exited with code ${code}`));
    });

    proc.on('error', reject);
  });
}

app.get('/api/watermark/health', (_req, res) => {
  res.json({
    available: existsSync(EXE_PATH),
    exePath: EXE_PATH,
  });
});

app.post('/api/watermark/remove', upload.single('file'), async (req, res) => {
  if (!existsSync(EXE_PATH)) {
    return res.status(503).json({
      error: 'Watermark tool executable not found',
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mediaType = req.body.mediaType === 'image' ? 'image' : 'video';
  const id = randomUUID();
  const ext = extname(req.file.originalname) || (mediaType === 'image' ? '.png' : '.mp4');
  const inputPath = join(TMP_DIR, `${id}_input${ext}`);
  const outputPath = join(TMP_DIR, `${id}_output${ext}`);

  try {
    await ensureTmpDir();

    const { rename } = await import('fs/promises');
    await rename(req.file.path, inputPath);

    const options = {
      mediaType,
      mark: req.body.mark || 'auto',
      legacy: req.body.legacy === 'true',
      ml: req.body.ml === 'true',
      verbose: req.body.verbose === 'true',
    };

    await runWatermarkTool(inputPath, outputPath, options);

    if (!existsSync(outputPath)) {
      return res.status(500).json({ error: 'Processing completed but output file was not created' });
    }

    const outputData = await readFile(outputPath);
    const baseName = basename(req.file.originalname, extname(req.file.originalname));
    const contentType = mediaType === 'image'
      ? (req.file.mimetype || 'image/png')
      : 'video/mp4';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_processed${ext}"`);
    res.send(outputData);
  } catch (err) {
    console.error('Watermark removal error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Watermark removal failed',
    });
  } finally {
    for (const p of [inputPath, outputPath, req.file?.path]) {
      if (p && existsSync(p)) {
        try { await unlink(p); } catch { /* ignore */ }
      }
    }
  }
});

await ensureTmpDir();

app.listen(PORT, () => {
  console.log(`Watermark API running on http://localhost:${PORT}`);
  console.log(`Executable: ${existsSync(EXE_PATH) ? 'found' : 'NOT FOUND'} at ${EXE_PATH}`);
});
