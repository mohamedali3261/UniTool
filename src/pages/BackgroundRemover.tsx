import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Droplets,
  Eraser,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface BackgroundRemoverProps {
  t: any;
  lang: 'ar' | 'en';
}

interface SampledColor {
  r: number;
  g: number;
  b: number;
}

export function BackgroundRemover({ t, lang }: BackgroundRemoverProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sampledColors, setSampledColors] = useState<SampledColor[]>([]);
  const [tolerance, setTolerance] = useState(18);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [wipeProgress, setWipeProgress] = useState(0);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [imageUrl, resultUrl]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); setResultBlob(null); }
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setSampledColors([]);
      setError(null);
      setShowOriginal(false);
      setProgress(0);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || processing) return;
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const imgX = Math.round(x * scaleX);
    const imgY = Math.round(y * scaleY);

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = img.naturalWidth;
    tmpCanvas.height = img.naturalHeight;
    const tmpCtx = tmpCanvas.getContext('2d');
    if (!tmpCtx) return;
    tmpCtx.drawImage(img, 0, 0);
    const pixel = tmpCtx.getImageData(imgX, imgY, 1, 1).data;

    const newColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    const exists = sampledColors.some(
      c => Math.abs(c.r - newColor.r) < 5 && Math.abs(c.g - newColor.g) < 5 && Math.abs(c.b - newColor.b) < 5
    );
    if (!exists) {
      setSampledColors(prev => [...prev, newColor]);
    }
  };

  const removeColor = (index: number) => {
    setSampledColors(prev => prev.filter((_, i) => i !== index));
  };

  const clearColors = () => {
    setSampledColors([]);
  };

  const autoDetectBackground = () => {
    if (!imageRef.current) return;
    setProcessing(true);
    setProgress(0);

    setTimeout(() => {
      const img = imageRef.current!;
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = w;
      tmpCanvas.height = h;
      const tmpCtx = tmpCanvas.getContext('2d');
      if (!tmpCtx) { setProcessing(false); return; }
      tmpCtx.drawImage(img, 0, 0);

      const sampleRegion = (cx: number, cy: number, size: number): SampledColor | null => {
        const x = Math.max(0, Math.min(w - size, cx));
        const y = Math.max(0, Math.min(h - size, cy));
        const s = Math.min(size, w - x, h - y);
        if (s < 1) return null;
        const data = tmpCtx.getImageData(x, y, s, s).data;
        let tr = 0, tg = 0, tb = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          tr += data[i]; tg += data[i + 1]; tb += data[i + 2]; count++;
        }
        return { r: Math.round(tr / count), g: Math.round(tg / count), b: Math.round(tb / count) };
      };

      const sampleSize = Math.max(2, Math.round(Math.min(w, h) * 0.01));
      const regions = [
        [0, 0], [w - sampleSize, 0],
        [0, h - sampleSize], [w - sampleSize, h - sampleSize],
      ];

      const colors: SampledColor[] = [];
      for (const [rx, ry] of regions) {
        const c = sampleRegion(rx, ry, sampleSize);
        if (c) {
          const exists = colors.some(
            c2 => Math.abs(c2.r - c.r) < 10 && Math.abs(c2.g - c.g) < 10 && Math.abs(c2.b - c.b) < 10
          );
          if (!exists) colors.push(c);
        }
      }

      setSampledColors(colors);
      setProcessing(false);

      if (colors.length > 0) {
        setTimeout(() => processImage(colors), 100);
      }
    }, 30);
  };

  const processImage = (useColors?: SampledColor[]) => {
    if (!imageRef.current || !resultCanvasRef.current) return;
    const colors = useColors || sampledColors;
    if (colors.length === 0) return;

    const img = imageRef.current;
    const canvas = resultCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setProcessing(true);
    setShowOriginal(false);
    setProgress(0);

    setTimeout(() => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const totalPixels = w * h;

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const maxColorDist2 = ((tolerance / 100) * Math.sqrt(3) * 255) ** 2;

      // Step 1: Compute grayscale + gradient (multi-channel edge detection)
      const gray = new Uint8Array(totalPixels);
      const grad = new Uint8Array(totalPixels);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const idx = i * 4;
          gray[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
          if (x > 0 && y > 0) {
            const dr = Math.abs(data[idx] - data[idx - 4]);
            const dg = Math.abs(data[idx + 1] - data[idx + 1 - 4]);
            const db = Math.abs(data[idx + 2] - data[idx + 2 - 4]);
            const gx = Math.max(dr, dg, db, Math.abs(gray[i] - gray[i - 1]));
            const dry = Math.abs(data[idx] - data[idx - w * 4]);
            const dgy = Math.abs(data[idx + 1] - data[idx + 1 - w * 4]);
            const dby = Math.abs(data[idx + 2] - data[idx + 2 - w * 4]);
            const gy = Math.max(dry, dgy, dby, Math.abs(gray[i] - gray[i - w]));
            grad[i] = Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy)));
          }
        }
      }

      // Auto edge threshold (85th percentile of non-zero gradients)
      const gradSamples: number[] = [];
      const gradStep = Math.max(1, Math.floor(totalPixels / 2000));
      for (let i = 0; i < totalPixels; i += gradStep) {
        if (grad[i] > 0) gradSamples.push(grad[i]);
      }
      gradSamples.sort((a, b) => a - b);
      const edgeThreshold = gradSamples.length > 0
        ? Math.max(2, gradSamples[Math.floor(gradSamples.length * 0.50)])
        : 15;

      // Step 2: Mark background-matching pixels + compute color distance to samples
      const isBg = new Uint8Array(totalPixels);
      const bgDist2 = new Float32Array(totalPixels);
      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        let minD2 = Infinity;
        for (const s of colors) {
          const dr = r - s.r, dg = g - s.g, db = b - s.b;
          const d2 = dr * dr + dg * dg + db * db;
          if (d2 < minD2) minD2 = d2;
        }
        bgDist2[i] = minD2;
        if (minD2 <= maxColorDist2) isBg[i] = 1;
      }

      // Step 3: Flood fill from edges with gradient-aware stopping
      const isRemoved = new Uint8Array(totalPixels);
      const queue = new Int32Array(totalPixels * 2);
      let head = 0, tail = 0;

      const tryEnqueue = (x: number, y: number, px: number, py: number) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const i = y * w + x;
        if (!isBg[i] || isRemoved[i]) return;

        // Don't cross strong edges or move away from bg color
        if (px >= 0 && py >= 0) {
          const pi = py * w + px;
          if (Math.abs(gray[i] - gray[pi]) > edgeThreshold) return;
          if (bgDist2[i] - bgDist2[pi] > maxColorDist2 * 0.08) return;
        }

        isRemoved[i] = 1;
        queue[tail * 2] = x;
        queue[tail * 2 + 1] = y;
        tail++;
      };

      for (let x = 0; x < w; x++) {
        tryEnqueue(x, 0, -1, -1);
        tryEnqueue(x, h - 1, -1, -1);
      }
      for (let y = 1; y < h - 1; y++) {
        tryEnqueue(0, y, -1, -1);
        tryEnqueue(w - 1, y, -1, -1);
      }

      let checkCounter = 0;
      const progressStep = Math.max(10000, Math.floor(totalPixels / 100));

      while (head < tail) {
        const x = queue[head * 2];
        const y = queue[head * 2 + 1];
        head++;

        tryEnqueue(x - 1, y, x, y);
        tryEnqueue(x + 1, y, x, y);
        tryEnqueue(x, y - 1, x, y);
        tryEnqueue(x, y + 1, x, y);

        checkCounter++;
        if (checkCounter % progressStep === 0) {
          setProgress(Math.min(95, Math.round((head / totalPixels) * 100)));
        }
      }

      // Fill interior holes within maxHoleDist of removed area (preserves deep subject features like eyes)
      const maxHoleDist = Math.max(5, Math.min(60, Math.floor(Math.min(w, h) * 0.04)));
      const holeDist = new Uint16Array(totalPixels);
      const q2 = new Int32Array(totalPixels);
      let q2h = 0, q2t = 0;

      for (let i = 0; i < totalPixels; i++) {
        if (isRemoved[i]) { q2[q2t++] = i; holeDist[i] = 0; }
        else holeDist[i] = 65535;
      }

      while (q2h < q2t) {
        const ci = q2[q2h++];
        const cd = holeDist[ci];
        if (cd >= maxHoleDist) continue;
        const cx = ci % w;
        const cy = Math.floor(ci / w);
        const nd = cd + 1;

        if (cx > 0) { const ni = ci - 1; if (holeDist[ni] > nd) { holeDist[ni] = nd; q2[q2t++] = ni; } }
        if (cx < w - 1) { const ni = ci + 1; if (holeDist[ni] > nd) { holeDist[ni] = nd; q2[q2t++] = ni; } }
        if (cy > 0) { const ni = ci - w; if (holeDist[ni] > nd) { holeDist[ni] = nd; q2[q2t++] = ni; } }
        if (cy < h - 1) { const ni = ci + w; if (holeDist[ni] > nd) { holeDist[ni] = nd; q2[q2t++] = ni; } }
      }

      for (let i = 0; i < totalPixels; i++) {
        if (isBg[i] && !isRemoved[i] && holeDist[i] <= maxHoleDist) isRemoved[i] = 1;
      }

      // Step 4: Apply transparency + edge-aware feathering
      const featherColorMax = ((tolerance * 2.0 / 100) * Math.sqrt(3) * 255) ** 2;

      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;

        if (isRemoved[i]) {
          data[idx + 3] = 0;
          continue;
        }

        // Feather pixels at the boundary of removed area
        const y = Math.floor(i / w);
        const x = i % w;
        let nearRemoved = false;
        for (let dy = -1; dy <= 1 && !nearRemoved; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -1; dx <= 1 && !nearRemoved; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            if (isRemoved[ny * w + nx]) nearRemoved = true;
          }
        }

        if (nearRemoved || (isBg[i] && grad[i] <= edgeThreshold)) {
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          let minDist2 = Infinity;
          for (const s of colors) {
            const dr = r - s.r, dg = g - s.g, db = b - s.b;
            const d2 = dr * dr + dg * dg + db * db;
            if (d2 < minDist2) minDist2 = d2;
          }

          if (minDist2 <= featherColorMax) {
            const t2 = Math.sqrt(minDist2 / featherColorMax);
            data[idx + 3] = Math.round((1 - t2 * 0.9) * data[idx + 3]);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProgress(100);

      canvas.toBlob((blob) => {
        if (blob) {
          if (resultUrl) URL.revokeObjectURL(resultUrl);
          setResultBlob(blob);
          setResultUrl(URL.createObjectURL(blob));
          setAnimating(true);
          const duration = 1200;
          const startTime = performance.now();
          const frame = (now: number) => {
            const p = Math.min(1, (now - startTime) / duration);
            setWipeProgress(p);
            if (p < 1) requestAnimationFrame(frame);
            else setAnimating(false);
          };
          requestAnimationFrame(frame);
        }
        setProcessing(false);
      }, 'image/png');
    }, 50);
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `no_bg_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); setResultBlob(null); }
    setImageFile(null);
    setImageUrl(null);
    setSampledColors([]);
    setShowOriginal(false);
    setProgress(0);
    setAnimating(false);
    setWipeProgress(0);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F] overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Left: Image Preview */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col p-3 sm:p-4">
            {!imageFile ? (
              <label className="group relative flex flex-col items-center justify-center gap-2 flex-1 bg-[#14171C] border-2 border-dashed border-[#2D3139] hover:border-purple-500/50 rounded-lg transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Upload size={20} className="text-purple-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-300 font-medium">
                    {lang === 'ar' ? 'انقر لاختيار صورة' : 'Click to select image'}
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono uppercase">PNG, JPG, WebP</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            ) : (
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400">
                    <ImageIcon size={12} className="text-purple-500" />
                    <span>{imageFile.name}</span>
                  </div>
                  <button onClick={removeImage} className="p-1 hover:bg-red-500/20 rounded-sm text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {/* Image display */}
                <div
                  className="relative flex-1 bg-[#14171C] rounded-lg overflow-hidden border border-[#2D3139] flex items-center justify-center cursor-crosshair"
                  onClick={handleImageClick}
                >
                  {animating && resultUrl ? (
                    <div className="relative max-w-[80vw] max-h-[70vh] w-auto h-auto flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                      <img src={imageUrl!} alt="Original" className="max-w-[80vw] max-h-[70vh] w-auto h-auto" />
                      <img src={resultUrl} alt="Result" className="absolute top-0 left-0 w-full h-full object-contain"
                        style={{ clipPath: `inset(0 0 ${(1 - wipeProgress) * 100}% 0)` }} />
                    </div>
                  ) : showOriginal && resultUrl ? (
                    <img src={imageUrl!} alt="Original" className="max-w-[80vw] max-h-[70vh] w-auto h-auto" />
                  ) : (
                    <img
                      ref={imageRef}
                      src={resultUrl || imageUrl!}
                      alt="Source"
                      className="max-w-[80vw] max-h-[70vh] w-auto h-auto"
                      draggable={false}
                    />
                  )}

                  {!showOriginal && sampledColors.length > 0 && imageRef.current && (
                    <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap max-w-[60%]">
                      {sampledColors.map((color, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: `rgb(${color.r},${color.g},${color.b})` }}
                          onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                          title={`rgb(${color.r},${color.g},${color.b})`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {processing && (
                  <div className="shrink-0 space-y-1">
                    <div className="flex justify-between text-[8px] text-gray-500 font-mono">
                      <span>{lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
                      <span className="text-purple-400">{progress}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#2D3139] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex flex-col max-h-[50vh] lg:max-h-none">
          <div className="overflow-y-auto flex-1 p-3 space-y-3">
            {/* Auto Detect Button */}
            {imageFile && !processing && (
              <button
                onClick={autoDetectBackground}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
              >
                <Sparkles size={14} />
                {lang === 'ar' ? 'إزالة الخلفية تلقائياً' : 'Auto Remove Background'}
              </button>
            )}

            {/* Sampled Colors */}
            {imageFile && (
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Droplets size={12} className="text-purple-500" />
                    {lang === 'ar' ? 'عينات اللون' : 'Color Samples'}
                  </h3>
                  {sampledColors.length > 0 && (
                    <button onClick={clearColors} className="text-[8px] text-red-400 hover:text-red-300 font-mono uppercase tracking-wider">
                      {lang === 'ar' ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </div>
                {sampledColors.length === 0 ? (
                  <p className="text-[8px] text-gray-600 font-mono">
                    {lang === 'ar'
                      ? 'اضغط "إزالة الخلفية تلقائياً" أو انقر على الخلفية يدوياً'
                      : 'Click "Auto Remove" or click on background areas'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {sampledColors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-[#1A1D23] border border-[#2D3139] rounded px-1.5 py-1 group">
                        <div className="w-4 h-4 rounded border border-white/20 shrink-0"
                          style={{ backgroundColor: `rgb(${color.r},${color.g},${color.b})` }} />
                        <span className="text-[7px] font-mono text-gray-500">{color.r},{color.g},{color.b}</span>
                        <button onClick={() => removeColor(i)}
                          className="p-0.5 hover:bg-red-500/20 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tolerance Slider */}
            {imageFile && sampledColors.length > 0 && !processing && (
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Eraser size={12} className="text-orange-500" />
                    {lang === 'ar' ? 'الحساسية' : 'Tolerance'}
                  </h3>
                  <span className="text-[9px] font-mono text-orange-400">{tolerance}%</span>
                </div>
                <input
                  type="range" min="1" max="100" value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#2D3139] rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-[7px] text-gray-600 font-mono">
                  <span>{lang === 'ar' ? 'دقيق' : 'Precise'}</span>
                  <span>{lang === 'ar' ? 'واسع' : 'Broad'}</span>
                </div>
              </div>
            )}

            {/* Process Button */}
            {imageFile && sampledColors.length > 0 && !processing && (
              <button
                onClick={() => processImage()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
              >
                <Eraser size={14} />
                {lang === 'ar' ? 'تطبيق الإزالة' : 'Apply Removal'}
              </button>
            )}

            {/* Result */}
            {resultUrl && !processing && !animating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-green-400 uppercase tracking-widest">
                    <CheckCircle2 size={12} />
                    {lang === 'ar' ? 'تمت الإزالة' : 'Done'}
                  </div>
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="flex items-center gap-1 px-2 py-1 bg-[#1A1D23] border border-[#2D3139] rounded text-[8px] font-mono text-gray-400 hover:text-white transition-all"
                  >
                    {showOriginal ? <EyeOff size={10} /> : <Eye size={10} />}
                    {showOriginal
                      ? (lang === 'ar' ? 'النتيجة' : 'Result')
                      : (lang === 'ar' ? 'الأصلي' : 'Original')}
                  </button>
                </div>
                {!showOriginal && (
                  <button
                    onClick={downloadResult}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-green-500/30"
                  >
                    <Download size={14} />
                    {lang === 'ar' ? 'تحميل PNG' : 'Download PNG'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="p-3 border-t border-[#2D3139] bg-[#0F1115] mt-auto">
            <div className="flex items-start gap-2">
              <AlertCircle size={10} className="text-purple-500 shrink-0 mt-0.5" />
              <p className="text-[7px] text-gray-500 leading-relaxed font-mono">
                {lang === 'ar'
                  ? 'يحدد الخلفية المتصلة بحافة الصورة فقط • يحافظ على تفاصيل الجسم الداخلية • حواف ناعمة'
                  : 'Removes background connected to image edges only • Preserves internal details • Smooth edges'}
              </p>
            </div>
          </div>

          <canvas ref={resultCanvasRef} className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
