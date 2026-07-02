import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Upload, FileVideo, AlertCircle, Loader2, Key, Copy, Download,
  FileText, Trash2, CheckCircle2, FileOutput, Timer, X, Subtitles, RotateCcw, Type, Palette
} from 'lucide-react';

interface VideoSubtitlesProps {
  t: any;
  lang: 'ar' | 'en';
}

const API_KEY_STORAGE = 'audioflow_gemini_key';

export function VideoSubtitles({ t, lang }: VideoSubtitlesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<{ text: string; i: number; start?: number; end?: number }[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [resultVideoUrl, setResultVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'extracting' | 'transcribing' | 'done'>('idle');
  const [muxing, setMuxing] = useState(false);
  const [muxProgress, setMuxProgress] = useState(0);
  const [subtitleFontSize, setSubtitleFontSize] = useState(32);
  const [highlightWords, setHighlightWords] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#22d3ee');
  const [currentWordIdx, setCurrentWordIdx] = useState(-1);
  const [showPanelScroll, setShowPanelScroll] = useState(true);
  const [showMainPanelScroll, setShowMainPanelScroll] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef(0);

  const segmentTimes = useMemo(() => {
    if (segments.length === 0 || duration === 0) return [];
    if (segments[0].start !== undefined && segments[0].end !== undefined) {
      return segments.map(s => ({ start: s.start!, end: s.end!, text: s.text, i: s.i }));
    }
    const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0);
    let cur = 0;
    return segments.map((seg) => {
      const dur = (seg.text.length / totalChars) * duration;
      const start = cur;
      cur += dur;
      return { start, end: cur, text: seg.text, i: seg.i };
    });
  }, [segments, duration]);

  const getCurrentSegment = useCallback((ct: number) => {
    for (const s of segmentTimes) {
      if (ct >= s.start && ct < s.end) return s;
    }
    return segmentTimes[segmentTimes.length - 1] || null;
  }, [segmentTimes]);

  useEffect(() => {
    return () => { if (videoUrl) URL.revokeObjectURL(videoUrl); if (resultVideoUrl) URL.revokeObjectURL(resultVideoUrl); };
  }, []);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed(prev => prev + 1), 1000);
  };

  const stopTimer = () => clearInterval(timerRef.current);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem(API_KEY_STORAGE);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) {
      setFile(f);
      setVideoUrl(URL.createObjectURL(f));
      setTranscript('');
      setSegments([]);
      setCurrentSubtitle('');
      setResultVideoUrl('');
      setError(null);
      setStage('idle');
    } else {
      setError(lang === 'ar' ? 'صيغة فيديو غير مدعومة' : 'Unsupported video format');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(f));
      setTranscript('');
      setSegments([]);
      setCurrentSubtitle('');
      setResultVideoUrl('');
      setError(null);
      setStage('idle');
    }
  };

  const removeFile = () => {
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl('');
    if (resultVideoUrl) URL.revokeObjectURL(resultVideoUrl);
    setResultVideoUrl('');
    setTranscript('');
    setSegments([]);
    setCurrentSubtitle('');
    setError(null);
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || segmentTimes.length === 0) return;
    const ct = videoRef.current.currentTime;
    const seg = getCurrentSegment(ct);
    const text = seg?.text || '';
    if (text !== currentSubtitle) { setCurrentSubtitle(text); setCurrentWordIdx(-1); }
    if (text && highlightWords) {
      const words = text.split(/\s+/).filter(Boolean);
      const segDur = (seg?.end || duration) - (seg?.start || 0);
      const elapsed = ct - (seg?.start || 0);
      const idx = Math.min(Math.floor((elapsed / segDur) * words.length), words.length - 1);
      if (idx !== currentWordIdx) setCurrentWordIdx(Math.max(0, idx));
    }
  };

  const fileToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribe = useCallback(async () => {
    if (!file || !apiKey) return;

    setProcessing(true);
    setError(null);
    setTranscript('');
    setSegments([]);
    setCurrentSubtitle('');
    setProgress(0);
    startTimer();

    try {
      setStage('extracting');

      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();
      ffmpeg.on('progress', ({ progress: prog }) => {
        setProgress(Math.round(prog * 50));
      });

      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      });

      await ffmpeg.writeFile('input', await fetchFile(file));
      await ffmpeg.exec(['-i', 'input', '-vn', '-acodec', 'libmp3lame', '-q:a', '2', 'audio.mp3']);
      const audioData = await ffmpeg.readFile('audio.mp3');
      const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
      await ffmpeg.deleteFile('input');
      await ffmpeg.deleteFile('audio.mp3');

      setProgress(50);
      setStage('transcribing');

      const base64 = await fileToBase64(audioBlob);
      const prompt = lang === 'ar'
        ? 'فرغ هذا المقطع الصوتي كاملاً. أعد كل جملة في سطر منفصل مع وقت البداية والنهاية بالتنسيق التالي:\nHH:MM:SS.mmm - HH:MM:SS.mmm | النص\nمثال:\n00:00:01.200 - 00:00:03.500 | مرحبا كيف حالك\n00:00:03.800 - 00:00:06.200 | أنا بخير شكرا\nحافظ على اللغة الأصلية كما هي — عربي وإنجليزي وأي خليط. لا تترجم.\nلا تكتب أي شيء خارج التنسيق المطلوب.'
        : 'Transcribe this audio completely. Output each sentence on a separate line with start and end timestamps in this exact format:\nHH:MM:SS.mmm - HH:MM:SS.mmm | text\nExample:\n00:00:01.200 - 00:00:03.500 | Hello how are you\n00:00:03.800 - 00:00:06.200 | I am fine thank you\nPreserve the original spoken language — Arabic, English, or any mix. Do not translate.\nDo not write anything outside the required format.';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'audio/mp3', data: base64 } }
              ]
            }]
          })
        }
      );

      const result = await response.json();
      if (result.error) {
        const msg = (result.error.message || '').toLowerCase();
        if (msg.includes('quota') || msg.includes('rate') || msg.includes('resource') || msg.includes('exhausted') || result.error.code === 429) {
          throw new Error(lang === 'ar'
            ? '⚠️ تم استنفاذ حد Gemini اليومي. يتجدد تلقائياً عند منتصف الليل بتوقيت المحيط الهادئ (تقريباً 10 صباحاً بتوقيت القاهرة). ارجع بكره أو استخدم API key من إيميل مختلف.'
            : '⚠️ Gemini daily quota exhausted. Resets at midnight PT (~10 AM Cairo time). Try again tomorrow or use an API key from a different email.'
          );
        }
        if (msg.includes('high demand') || msg.includes('try again later')) {
          throw new Error(lang === 'ar'
            ? '⚠️ نموذج Gemini عليه ضغط عالي حالياً. هذا مؤقت، حاول مرة أخرى بعد عدة دقائق.'
            : '⚠️ Gemini model is currently experiencing high demand. This is temporary, please try again in a few minutes.'
          );
        }
        throw new Error(result.error.message || (lang === 'ar' ? 'فشل في الاتصال' : 'API error'));
      }

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parseTs = (t: string) => {
          const parts = t.trim().split(':');
          return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        };
        const rawLines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
        const parsedSegments: { text: string; i: number; start?: number; end?: number }[] = [];
        for (const line of rawLines) {
          const idx = line.indexOf('|');
          if (idx > 0) {
            const timePart = line.slice(0, idx).trim();
            const content = line.slice(idx + 1).trim();
            const dash = timePart.indexOf('-');
            if (dash > 0 && content) {
              try {
                const start = parseTs(timePart.slice(0, dash));
                const end = parseTs(timePart.slice(dash + 1));
                if (start < end) { parsedSegments.push({ text: content, i: parsedSegments.length + 1, start, end }); }
              } catch { /* skip unparseable */ }
            }
          }
        }
        if (parsedSegments.length > 0) {
          setTranscript(parsedSegments.map(s => s.text).join(' '));
          setSegments(parsedSegments);
        } else {
          setTranscript(text);
          const lines = rawLines.flatMap(l => l.match(/[^.!?]+[.!?]+/g) || [l]).map((l, i) => ({ text: l.trim(), i: i + 1 }));
          setSegments(lines);
        }
        setStage('done');
      } else {
        throw new Error(lang === 'ar' ? 'لم يتم العثور على نص في الرد' : 'No text in response');
      }

      setProgress(100);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error'));
    } finally {
      setProcessing(false);
      stopTimer();
    }
  }, [file, apiKey, lang]);

  const exportTxt = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${file?.name.replace(/\.[^.]+$/, '') || Date.now()}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSrt = () => {
    if (segmentTimes.length === 0) return;
    let srt = '';
    segmentTimes.forEach((seg) => {
      const fmt = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };
      srt += `${seg.i}\n${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${file?.name.replace(/\.[^.]+$/, '') || Date.now()}.srt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyText = () => {
    if (transcript) navigator.clipboard.writeText(transcript);
  };

  const generateSrt = (dur?: number) => {
    if (segmentTimes.length === 0) return '';
    let srt = '';
    segmentTimes.forEach((seg) => {
      const fmt = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };
      srt += `${seg.i}\n${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text}\n\n`;
    });
    return srt;
  };

  const drawSubtitle = (ctx: CanvasRenderingContext2D, text: string, width: number, height: number, highlightWord: boolean = false, hlWordIdx: number = -1, fontSize?: number, hlColor: string = '#22d3ee') => {
    if (!text) return;
    ctx.save();
    const isAr = /[\u0600-\u06FF]/.test(text);
    ctx.direction = isAr ? 'rtl' : 'ltr';
    const fs = fontSize ? Math.max(16, Math.min(72, fontSize)) : Math.max(22, Math.min(44, Math.round(width / 30)));
    ctx.font = `bold ${fs}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const maxW = width * 0.9;
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else { line = test; }
    }
    if (line) lines.push(line);

    const lh = fs * 1.3;
    const baseY = height - 30;

    ctx.lineWidth = Math.max(3, Math.round(fs / 8));
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';

    const flatWords = text.split(/\s+/).filter(Boolean);

    const drawWordAt = (x: number, y: number, w: string) => {
      ctx.strokeText(w, x, y);
      ctx.fillText(w, x, y);
    };

    if (highlightWord && hlWordIdx >= 0 && hlWordIdx < flatWords.length) {
      let widx = 0;
      for (let i = 0; i < lines.length; i++) {
        const y = baseY - (lines.length - 1 - i) * lh;
        const lw = lines[i].split(/\s+/).filter(Boolean);
        const lineW = ctx.measureText(lines[i]).width;
        const sx = width / 2 - lineW / 2;
        let cx = sx;
        for (let j = 0; j < lw.length; j++, widx++) {
          const w = lw[j];
          const ww = ctx.measureText(w).width;
          const wx = cx + ww / 2;
          const isHL = widx === hlWordIdx;
          ctx.fillStyle = isHL ? hlColor : '#ffffff';
          drawWordAt(wx, y, w);
          cx += ww + ctx.measureText(' ').width;
        }
      }
    } else {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < lines.length; i++) {
        const y = baseY - (lines.length - 1 - i) * lh;
        drawWordAt(width / 2, y, lines[i]);
      }
    }

    ctx.restore();
  };

  const downloadVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || segments.length === 0) return;
    const dur = video.duration || duration;
    if (dur === 0) return;

    setMuxing(true);
    setMuxProgress(0);
    setError(null);

    try {
      if (!video.videoWidth || !video.videoHeight) {
        await new Promise<void>(r => video.addEventListener('loadedmetadata', () => r(), { once: true }));
      }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const videoStream = (video as any).captureStream?.();
      if (!videoStream) throw new Error(lang === 'ar' ? 'المتصفح لا يدعم captureStream' : 'Browser does not support captureStream');
      const audioTrack = videoStream.getAudioTracks?.()?.[0];
      const canvasStream = canvas.captureStream(30);
      const mixed = new MediaStream(
        [canvasStream.getVideoTracks()[0], audioTrack].filter(Boolean)
      );

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(mixed, { mimeType: mime });
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

      let raf = 0;
      const render = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const ct = video.currentTime;
        const seg = getCurrentSegment(ct);
        let widx = -1;
        if (seg && highlightWords) {
          const wds = seg.text.split(/\s+/).filter(Boolean);
          const e = ct - seg.start;
          const sd = seg.end - seg.start;
          widx = Math.min(Math.floor((e / sd) * wds.length), wds.length - 1);
        }
        drawSubtitle(ctx, seg?.text || '', canvas.width, canvas.height, highlightWords, widx, subtitleFontSize, highlightColor);

        const pct = Math.min(Math.round((ct / dur) * 100), 99);
        setMuxProgress(pct);

        if (video.ended || ct >= dur - 0.1) {
          if (recorder.state === 'recording') recorder.stop();
          return;
        }
        raf = requestAnimationFrame(render);
      };

      recorder.onstop = () => {
        cancelAnimationFrame(raf);
        video.muted = wasMuted;
        video.pause();

        if (chunks.length) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          if (resultVideoUrl) URL.revokeObjectURL(resultVideoUrl);
          setResultVideoUrl(URL.createObjectURL(blob));
        }
        setMuxProgress(100);
        setMuxing(false);
      };

      video.pause();
      const wasMuted = video.muted;
      video.muted = true;
      video.currentTime = 0;
      await video.play().catch(() => {});
      recorder.start(1000);
      raf = requestAnimationFrame(render);
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'فشل إنشاء الفيديو المترجم' : 'Failed to create subtitled video'));
      setMuxing(false);
    }
  }, [file, segments, duration, lang, resultVideoUrl, getCurrentSegment, highlightWords, subtitleFontSize, highlightColor]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
  const [mobileTab, setMobileTab] = useState<'video' | 'controls'>('video');

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F]">
      {/* Page Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Subtitles size={14} className="text-white sm:size-4" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'ترجمة فيديو' : 'Video Subtitles'}</h1>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'تفريغ وحرق الترجمة على الفيديو' : 'Transcribe & burn subtitles into video'}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Mobile Tab Bar */}
        <div className="flex border-b border-[#2D3139] bg-[#14171C] shrink-0 lg:hidden">
          <button
            onClick={() => setMobileTab('video')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'video' ? 'text-cyan-400 bg-[#1A1D23] border-b-2 border-cyan-500' : 'text-gray-500'
            }`}
          >
            <FileVideo size={14} />
            {lang === 'ar' ? 'الفيديو' : 'Video'}
          </button>
          <button
            onClick={() => setMobileTab('controls')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'controls' ? 'text-cyan-400 bg-[#1A1D23] border-b-2 border-cyan-500' : 'text-gray-500'
            }`}
          >
            <Subtitles size={14} />
            {lang === 'ar' ? 'تحكم' : 'Controls'}
          </button>
        </div>

        {/* Left: Video + Subtitles */}
        <div className={`flex-1 flex-col min-h-0 p-3 sm:p-4 ${mobileTab === 'video' ? 'flex' : 'hidden'} lg:flex`}>
          <div className="flex-1 flex flex-col bg-[#14171C] rounded-lg border border-[#2D3139] relative">
            <div className="flex-1 flex flex-col overflow-y-auto relative"
              onScroll={e => {
                const el = e.currentTarget;
                const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
                setShowMainPanelScroll(!atBottom);
              }}
            >

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3139] shrink-0">
              <div className="flex items-center gap-2">
                <Subtitles size={14} className="text-cyan-500" />
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  {lang === 'ar' ? 'ترجمة فيديو' : 'Video Subtitles'}
                </span>
              </div>
              {file && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-mono text-gray-500">{file.name} ({formatFileSize(file.size)})</span>
                  {!processing && (
                    <button onClick={removeFile} className="p-0.5 hover:bg-cyan-500/20 rounded text-gray-600 hover:text-cyan-400" title={lang === 'ar' ? 'بداية جديدة' : 'Restart'}>
                      <RotateCcw size={10} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {!file ? (
              <div
                onDrop={handleFileDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#1A1D23] transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Upload size={24} className="text-cyan-500" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-300 font-medium">
                    {lang === 'ar' ? 'اسحب ملف الفيديو هنا' : 'Drop video file here'}
                  </p>
                  <p className="text-[9px] text-gray-600 font-mono">MP4, WebM, OGV, AVI, MOV</p>
                </div>
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
              </div>
              ) : (
              <div className="flex flex-col bg-black min-h-[300px]">
                {/* Original video player */}
                {!resultVideoUrl && (
                <div className="relative w-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                      if (videoRef.current) setDuration(videoRef.current.duration);
                    }}
                    controls
                    className="max-w-full object-contain cursor-pointer rounded"
                    style={{ maxHeight: '55vh', minHeight: '200px' }}
                  />

                  {currentSubtitle && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none px-4 z-10">
                      <div
                        className="text-center leading-snug"
                        style={{
                          fontSize: `${subtitleFontSize}px`,
                          color: 'white',
                          textShadow: '0 0 2px #000, 0 0 3px #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                          WebkitTextStroke: '1px black',
                          direction: /[\u0600-\u06FF]/.test(currentSubtitle) ? 'rtl' : 'ltr',
                        }}
                      >
                        {highlightWords && currentWordIdx >= 0 ? (
                          currentSubtitle.split(/\s+/).filter(Boolean).map((w, i) => (
                            <span key={i} style={{ color: i === currentWordIdx ? highlightColor : undefined }}>{w}{' '}</span>
                          ))
                        ) : currentSubtitle}
                      </div>
                    </div>
                  )}
                  {processing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10">
                      <Loader2 size={32} className="text-cyan-500 animate-spin" />
                      <p className="text-[10px] font-mono text-gray-400">
                        {stage === 'extracting'
                          ? (lang === 'ar' ? 'جاري استخراج الصوت...' : 'Extracting audio...')
                          : (lang === 'ar' ? 'جاري التفريغ...' : 'Transcribing...')
                        }
                      </p>
                      <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-[8px] font-mono text-gray-600">{formatTime(elapsed)}</p>
                    </div>
                  )}
                  {!transcript && !processing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <p className="text-[9px] font-mono text-gray-500">
                        {lang === 'ar' ? 'اضغط "تفريغ الفيديو" لبدء المعالجة' : 'Click "Generate Subtitles" to start'}
                      </p>
                    </div>
                  )}
                </div>
                )}

                {/* Result video player */}
                {resultVideoUrl && (
                  <div className="border-t border-[#2D3139] bg-[#0F1115]">
                    <div className="flex items-center justify-between px-3 py-1.5">
                      <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 size={10} />
                        {lang === 'ar' ? 'الفيديو النهائي' : 'Final Video'}
                      </span>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = resultVideoUrl;
                          a.download = `${(file?.name || 'video').replace(/\.[^.]+$/, '')}_subtitled.webm`;
                          a.click();
                        }}
                        className="flex items-center gap-1 text-[8px] font-mono text-gray-400 hover:text-white transition-colors"
                      >
                        <Download size={10} /> {lang === 'ar' ? 'تحميل' : 'Download'}
                      </button>
                    </div>
                    <video
                      src={resultVideoUrl}
                      controls
                      className="w-full max-h-[30vh] object-contain bg-black rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Generate Subtitles Button at bottom */}
            {file && !muxing && (
              <div className="shrink-0 border-t border-[#2D3139] px-3 py-2">
                <button
                  onClick={transcribe}
                  disabled={!apiKey || processing}
                  className={
                    "w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg transition-all font-bold text-[9px] sm:text-[10px] uppercase tracking-wider shadow-lg " +
                    "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20 " +
                    ((!apiKey || processing) ? "opacity-50 cursor-not-allowed" : "")
                  }
                >
                  {processing ? (
                    <><Loader2 size={14} className="animate-spin" /> {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</>
                  ) : (
                    <><Subtitles size={14} /> {lang === 'ar' ? 'تفريغ الفيديو' : 'Generate Subtitles'}</>
                  )}
                </button>
              </div>
            )}

          </div>
          {showMainPanelScroll && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#14171C] via-[#14171C]/80 to-transparent pointer-events-none flex items-end justify-center pb-1.5">
              <div className="w-7 h-1.5 rounded-full bg-gray-600 animate-bounce" />
            </div>
          )}
        </div>
      </div>

        {/* Right: Controls */}
        <div className={`lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex-col relative overflow-hidden ${mobileTab === 'controls' ? 'flex' : 'hidden'} lg:flex`}>
          <div
            className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 overflow-y-auto"
            onScroll={e => {
              const el = e.currentTarget;
              const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
              setShowPanelScroll(!atBottom);
            }}
          >

            {/* API Key */}
            <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Key size={12} className="text-cyan-500" />
                  <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">API Key</h3>
                </div>
                {apiKey && (
                  <button onClick={clearApiKey} className="text-[7px] text-red-400 hover:text-red-300 font-mono">
                    {lang === 'ar' ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => saveApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-[#1A1D23] border border-[#2D3139] rounded px-2 py-1.5 text-[9px] font-mono text-gray-300 outline-none focus:border-cyan-500/50"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showKey ? <X size={12} /> : <Key size={12} />}
                </button>
              </div>
              <p className="text-[7px] text-gray-600 font-mono">
                {lang === 'ar' ? 'من aistudio.google.com ⚡' : 'Get from aistudio.google.com'}
                {' '}<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">FREE</a>
              </p>
            </div>

            {/* Transcribe Button */}
            <button
              onClick={transcribe}
              disabled={!file || !apiKey || processing}
              className={
                "w-full flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-lg transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg " +
                "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30 " +
                ((!file || !apiKey || processing) ? "opacity-50 cursor-not-allowed" : "")
              }
            >
              {processing ? (
                <><Loader2 size={16} className="animate-spin" /> {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</>
              ) : (
                <><Subtitles size={16} /> {lang === 'ar' ? 'تفريغ الفيديو' : 'Generate Subtitles'}</>
              )}
            </button>

            {/* Stats */}
            {transcript && stage === 'done' && (
              <>
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Timer size={12} className="text-cyan-500" />
                    <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'إحصائيات' : 'Stats'}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="bg-[#1A1D23] rounded p-1 sm:p-1.5 text-center">
                      <p className="text-[7px] font-mono text-gray-600 uppercase">{lang === 'ar' ? 'كلمات' : 'Words'}</p>
                      <p className="text-[10px] font-mono text-cyan-400">{wordCount}</p>
                    </div>
                    <div className="bg-[#1A1D23] rounded p-1 sm:p-1.5 text-center">
                      <p className="text-[7px] font-mono text-gray-600 uppercase">{lang === 'ar' ? 'مقاطع' : 'Segments'}</p>
                      <p className="text-[10px] font-mono text-blue-400">{segments.length}</p>
                    </div>
                  </div>
                </div>

                {/* Transcript */}
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-cyan-500" />
                    <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'النص' : 'Transcript'}</h3>
                  </div>
                  <div className="max-h-24 sm:max-h-32 overflow-y-auto space-y-1 scrollbar-thin">
                    {segmentTimes.map((seg, i) => {
                      const isActive = seg.text === currentSubtitle;
                      return (
                        <div
                          key={i}
                          className={`text-[7px] font-mono leading-relaxed px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                            isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-gray-300'
                          }`}
                          style={{ direction: /[\u0600-\u06FF]/.test(seg.text) ? 'rtl' : 'ltr' }}
                          onClick={() => {
                            if (videoRef.current) {
                              videoRef.current.currentTime = seg.start;
                              videoRef.current.play();
                            }
                          }}
                        >
                          {seg.text}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Type size={12} className="text-cyan-500" />
                    <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'حجم الخط' : 'Font Size'}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={16}
                      max={64}
                      value={subtitleFontSize}
                      onChange={e => setSubtitleFontSize(Number(e.target.value))}
                      className="flex-1 h-1.5 appearance-none bg-gray-700 rounded-full cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(34,211,238,0.6)]
                        [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-[8px] font-mono text-cyan-400 w-8 text-right min-w-[28px]">{subtitleFontSize}px</span>
                  </div>
                </div>

                {/* Word Highlighting */}
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Palette size={12} className="text-cyan-500" />
                      <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'تلوين الكلمات' : 'Word Colors'}</h3>
                    </div>
                    <button
                      onClick={() => setHighlightWords(!highlightWords)}
                      className={`relative w-9 h-5 rounded-full transition-all duration-200 ${
                        highlightWords ? 'bg-cyan-500 shadow-[0_0_6px_rgba(34,211,238,0.5)]' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200 ${
                        highlightWords ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {highlightWords && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={highlightColor}
                        onChange={e => setHighlightColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={highlightColor}
                          onChange={e => setHighlightColor(e.target.value)}
                          className="flex-1 bg-[#1A1D23] border border-[#2D3139] rounded px-1.5 py-1 text-[7px] font-mono text-gray-300 outline-none focus:border-cyan-500/50 uppercase"
                          maxLength={7}
                        />
                        <div className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: highlightColor }} />
                      </div>
                    </div>
                  )}
                  <p className="text-[6px] font-mono text-gray-500 leading-relaxed">
                    {lang === 'ar' ? '🔹 شغل التلوين عشان كل كلمة تظهر بلون مميز وقت نطقها' : '🔹 Enable to highlight each word as it is spoken'}
                  </p>
                </div>

                {/* Export */}
                <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileOutput size={12} className="text-cyan-500" />
                    <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'تصدير' : 'Export'}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button onClick={exportTxt} className="py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-cyan-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">TXT</button>
                    <button onClick={exportSrt} className="py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-cyan-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">SRT</button>
                    <button onClick={copyText} className="py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-blue-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">
                      <Copy size={10} className="inline" />
                    </button>
                  </div>
                </div>

                {/* Burn Subtitles into Video */}
                  <button
                    onClick={downloadVideo}
                    disabled={muxing}
                    className={
                      "w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wider " +
                      "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/30 " +
                      (muxing ? "opacity-50 cursor-not-allowed" : "")
                    }
                  >
                  {muxing ? (
                    <><Loader2 size={14} className="animate-spin" /> {lang === 'ar' ? 'جاري التضمين...' : 'Embedding...'} {muxProgress}%</>
                  ) : (
                    <><FileVideo size={14} /> {lang === 'ar' ? 'حرق الترجمة في الفيديو' : 'Burn Subtitles into Video'}</>
                  )}
                </button>

              {/* Clear */}
              <button onClick={() => { setTranscript(''); setSegments([]); setCurrentSubtitle(''); setResultVideoUrl(''); setStage('idle'); }} className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-[#1A1D23] border border-[#2D3139] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all text-[9px] sm:text-[10px] font-mono">
                <Trash2 size={12} /> {lang === 'ar' ? 'مسح النص' : 'Clear Text'}
              </button>

              {/* Full-screen muxing overlay */}
              {muxing && (
                <div className="fixed inset-0 z-50 bg-[#0A0C0F] flex flex-col items-center justify-center gap-4">
                  <Loader2 size={48} className="text-emerald-500 animate-spin" />
                  <p className="text-sm font-mono text-gray-300">
                    {lang === 'ar' ? 'جاري حرق الترجمة...' : 'Burning subtitles...'}
                  </p>
                  <div className="w-64 h-2.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-200 rounded-full" style={{ width: `${muxProgress}%` }} />
                  </div>
                  <p className="text-[11px] font-mono text-emerald-400">{muxProgress}%</p>
                </div>
              )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-start gap-2">
                <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[8px] font-mono text-red-300">{error}</p>
              </div>
            )}
          </div>

          {showPanelScroll && (
            <div className="absolute bottom-12 left-0 right-0 h-10 bg-gradient-to-t from-[#14171C] via-[#14171C]/80 to-transparent pointer-events-none flex items-end justify-center pb-1.5">
              <div className="w-7 h-1.5 rounded-full bg-gray-600 animate-bounce" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
