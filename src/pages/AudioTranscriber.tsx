import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileAudio, AlertCircle, Loader2, Copy, Download,
  FileText, Trash2, Key, CheckCircle2, FileOutput, Quote, Timer, X, Mic
} from 'lucide-react';

interface AudioTranscriberProps {
  t: any;
  lang: 'ar' | 'en';
}

const API_KEY_STORAGE = 'audioflow_gemini_key';
const SUPPORTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'];

export function AudioTranscriber({ t, lang }: AudioTranscriberProps) {
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [segments, setSegments] = useState<{ text: string; i: number }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = window.setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

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
    if (f && SUPPORTED_TYPES.includes(f.type)) {
      setFile(f);
      setTranscript('');
      setError(null);
      setSegments([]);
    } else {
      setError(lang === 'ar' ? 'صيغة ملف غير مدعومة' : 'Unsupported file format');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setTranscript('');
      setError(null);
      setSegments([]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setTranscript('');
    setError(null);
    setSegments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  };

  const transcribe = useCallback(async () => {
    if (!file || !apiKey) return;

    setTranscribing(true);
    setError(null);
    setTranscript('');
    setSegments([]);
    startTimer();

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'audio/mpeg';
      const prompt = lang === 'ar'
        ? 'فرغ هذا المقطع الصوتي كاملاً مع جميع الكلمات المنطوقة. حافظ على اللغة الأصلية كما هي — عربي وإنجليزي وأي خليط بينهما. لا تغير أو تترجم الكلمات. أعد النص فقط.'
        : 'Transcribe this audio completely, preserving the original spoken language — Arabic, English, or any mix. Do not translate or alter words. Return only the transcript.';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } }
              ]
            }]
          })
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message || (lang === 'ar' ? 'فشل في الاتصال' : 'API error'));
      }

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setTranscript(text);
        const lines = text.split('\n').filter(l => l.trim());
        setSegments(lines.map((l, i) => ({ text: l.trim(), i: i + 1 })));
      } else {
        throw new Error(lang === 'ar' ? 'لم يتم العثور على نص في الرد' : 'No text in response');
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error'));
    } finally {
      setTranscribing(false);
      stopTimer();
    }
  }, [file, apiKey, lang]);

  const exportTxt = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${file?.name.replace(/\.[^.]+$/, '') || Date.now()}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSrt = () => {
    if (segments.length === 0) return;
    const dur = Math.max(elapsed, 60);
    const segDur = dur / segments.length;
    let srt = '';
    segments.forEach((seg, i) => {
      const start = i * segDur;
      const end = (i + 1) * segDur;
      const fmt = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };
      srt += `${seg.i}\n${fmt(start)} --> ${fmt(end)}\n${seg.text}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${file?.name.replace(/\.[^.]+$/, '') || Date.now()}.srt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMd = () => {
    if (!transcript) return;
    const md = `# Transcript: ${file?.name || 'Audio'}\n\n${transcript}\n\n---\n*Transcribed via MediaFlow*\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${file?.name.replace(/\.[^.]+$/, '') || Date.now()}.md`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyText = () => {
    if (transcript) navigator.clipboard.writeText(transcript);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const wordCount = transcript ? transcript.split(/\s+/).filter(Boolean).length : 0;
  const [mobileTab, setMobileTab] = useState<'transcript' | 'controls'>('transcript');

  const handleTranscriptScroll = () => {
    const el = transcriptRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    setShowScrollIndicator(!atBottom);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F]">
      {/* Page Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <FileAudio size={14} className="text-white sm:size-4" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'تفريغ صوتي' : 'Audio Transcriber'}</h1>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'تفريغ الملفات الصوتية إلى نص' : 'Transcribe audio files to text'}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Mobile Tab Bar */}
        <div className="flex border-b border-[#2D3139] bg-[#14171C] shrink-0 lg:hidden">
          <button
            onClick={() => setMobileTab('transcript')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'transcript' ? 'text-cyan-400 bg-[#1A1D23] border-b-2 border-cyan-500' : 'text-gray-500'
            }`}
          >
            <FileText size={14} />
            {lang === 'ar' ? 'التفريغ' : 'Transcribe'}
          </button>
          <button
            onClick={() => setMobileTab('controls')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'controls' ? 'text-cyan-400 bg-[#1A1D23] border-b-2 border-cyan-500' : 'text-gray-500'
            }`}
          >
            <Mic size={14} />
            {lang === 'ar' ? 'تحكم' : 'Controls'}
          </button>
        </div>

        {/* Left: Upload + Transcript */}
        <div className={`flex-1 flex-col min-h-0 p-3 sm:p-4 ${mobileTab === 'transcript' ? 'flex' : 'hidden'} lg:flex`}>
          <div className="flex-1 flex flex-col bg-[#14171C] rounded-lg border border-[#2D3139] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3139] shrink-0">
              <div className="flex items-center gap-2">
                <FileAudio size={14} className="text-cyan-500" />
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  {lang === 'ar' ? 'تفريغ صوتي' : 'Audio Transcriber'}
                </span>
              </div>
              {file && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-mono text-gray-500">{file.name} ({formatFileSize(file.size)})</span>
                  {!transcribing && (
                    <button onClick={removeFile} className="p-0.5 hover:bg-red-500/20 rounded text-gray-600 hover:text-red-400">
                      <X size={10} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            {!file ? (
              /* Upload Area */
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
                    {lang === 'ar' ? 'اسحب الملف الصوتي هنا' : 'Drop audio file here'}
                  </p>
                  <p className="text-[9px] text-gray-600 font-mono">MP3, WAV, OGG, M4A, WebM</p>
                </div>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} className="hidden" />
              </div>
            ) : transcribing ? (
              /* Loading */
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-cyan-500 animate-spin" />
                <p className="text-[10px] font-mono text-gray-400">{lang === 'ar' ? 'جاري التفريغ...' : 'Transcribing...'}</p>
                <p className="text-[8px] font-mono text-gray-600">{formatTime(elapsed)}</p>
              </div>
            ) : transcript ? (
              /* Transcript Display */
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <div
                  className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed scrollbar-thin"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#2D3139 transparent' }}
                  ref={transcriptRef}
                  onScroll={handleTranscriptScroll}
                >
                  <p className="text-gray-200 whitespace-pre-wrap">{transcript}</p>
                </div>
                {showScrollIndicator && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#14171C] via-[#14171C]/80 to-transparent pointer-events-none flex items-end justify-center pb-1">
                    <div className="w-6 h-1 rounded-full bg-gray-600 animate-bounce" />
                  </div>
                )}
              </div>
            ) : (
              /* Ready but no transcript yet */
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-600">
                <CheckCircle2 size={20} className="text-green-500/50" />
                <p className="text-[9px]">{lang === 'ar' ? 'اضغط على "تفريغ" لبدء المعالجة' : 'Click "Transcribe" to start'}</p>
              </div>
            )}

            {/* Transcribe Button at bottom */}
            <div className="shrink-0 border-t border-[#2D3139] px-3 py-2">
              <button
                onClick={transcribe}
                disabled={!file || !apiKey || transcribing}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-lg transition-all font-bold text-[9px] sm:text-[10px] uppercase tracking-wider shadow-lg",
                  "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20",
                  (!file || !apiKey || transcribing) && "opacity-50 cursor-not-allowed"
                )}
              >
                {transcribing ? (
                  <><Loader2 size={14} className="animate-spin" /> {lang === 'ar' ? 'جاري التفريغ...' : 'Transcribing...'}</>
                ) : (
                  <><FileAudio size={14} /> {lang === 'ar' ? 'تفريغ الصوت' : 'Transcribe'}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className={`lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex-col overflow-y-auto ${mobileTab === 'controls' ? 'flex' : 'hidden'} lg:flex`}>
          <div className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3">

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
              disabled={!file || !apiKey || transcribing}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-lg transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg",
                "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30",
                (!file || !apiKey || transcribing) && "opacity-50 cursor-not-allowed"
              )}
            >
              {transcribing ? (
                <><Loader2 size={16} className="animate-spin" /> {lang === 'ar' ? 'جاري التفريغ...' : 'Transcribing...'}</>
              ) : (
                <><FileAudio size={16} /> {lang === 'ar' ? 'تفريغ الصوت' : 'Transcribe'}</>
              )}
            </button>

            {/* Stats */}
            {transcript && (
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
                    <p className="text-[7px] font-mono text-gray-600 uppercase">{lang === 'ar' ? 'وقت المعالجة' : 'Time'}</p>
                    <p className="text-[10px] font-mono text-blue-400">{formatTime(elapsed)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Export */}
            {transcript && (
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <FileOutput size={12} className="text-cyan-500" />
                  <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'تصدير' : 'Export'}</h3>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button onClick={exportTxt} className="py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-cyan-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">TXT</button>
                  <button onClick={exportSrt} className="py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-cyan-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">SRT</button>
                  <button onClick={exportMd} className="py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-cyan-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">MD</button>
                  <button onClick={copyText} className="py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-blue-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">
                    <Copy size={10} className="inline" />
                  </button>
                </div>
              </div>
            )}

            {/* Clear */}
            {transcript && (
              <button onClick={() => { setTranscript(''); setSegments([]); }} className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-[#1A1D23] border border-[#2D3139] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all text-[9px] sm:text-[10px] font-mono">
                <Trash2 size={12} /> {lang === 'ar' ? 'مسح النص' : 'Clear Text'}
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-start gap-2">
                <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[8px] font-mono text-red-300">{error}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(' ');
}
