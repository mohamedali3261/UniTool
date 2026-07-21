import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Languages, Copy, Download, Trash2, FileText, AlertCircle,
  Pause, Play, Plus, X, Timer, Type, Quote, Waveform, BookOpen,
  FileOutput, MessageSquareText
} from 'lucide-react';

interface SpeechToTextProps {
  t: any;
  lang: 'ar' | 'en';
}

interface VocabEntry {
  from: string;
  to: string;
}

interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
}

const STORAGE_KEY = 'audioflow_stt_transcript';
const STORAGE_SEGMENTS_KEY = 'audioflow_stt_segments';
const ACTIVITY_BUFFER_SIZE = 120;

export function SpeechToText({ t, lang }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [recognitionLang, setRecognitionLang] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [activityBuffer, setActivityBuffer] = useState<number[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabEntry[]>([]);
  const [punctuationEnabled, setPunctuationEnabled] = useState(true);
  const [vocabFrom, setVocabFrom] = useState('');
  const [vocabTo, setVocabTo] = useState('');
  const [editingText, setEditingText] = useState('');

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldListenRef = useRef(false);
  const isPausedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef(0);
  const langRef = useRef(recognitionLang);
  const elapsedRef = useRef(0);
  const timerRef = useRef(0);
  const activityRef = useRef<number[]>([]);
  const lastSegmentEndRef = useRef(0);
  const segmentsRef = useRef<TranscriptSegment[]>([]);
  const transcriptRefForSegments = useRef('');
  const lastPunctuationRef = useRef('');

  langRef.current = recognitionLang;

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTranscript(saved);
      transcriptRefForSegments.current = saved;
      setEditingText(saved);
    }
    const savedSegments = localStorage.getItem(STORAGE_SEGMENTS_KEY);
    if (savedSegments) {
      try {
        const parsed = JSON.parse(savedSegments);
        setSegments(parsed);
        segmentsRef.current = parsed;
      } catch {}
    }
    const savedVocab = localStorage.getItem('audioflow_stt_vocab');
    if (savedVocab) {
      try { setVocabulary(JSON.parse(savedVocab)); } catch {}
    }
  }, []);

  // Auto-save transcript + segments
  useEffect(() => {
    if (transcript) localStorage.setItem(STORAGE_KEY, transcript);
    else localStorage.removeItem(STORAGE_KEY);
  }, [transcript]);

  useEffect(() => {
    if (segments.length > 0) localStorage.setItem(STORAGE_SEGMENTS_KEY, JSON.stringify(segments));
    else localStorage.removeItem(STORAGE_SEGMENTS_KEY);
  }, [segments]);

  useEffect(() => {
    localStorage.setItem('audioflow_stt_vocab', JSON.stringify(vocabulary));
  }, [vocabulary]);

  // Check support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
    if (!SpeechRecognition) {
      setError(lang === 'ar' ? 'المتصفح لا يدعم التعرف على الصوت، استخدم Chrome أو Edge' : 'Speech recognition not supported, use Chrome or Edge');
    }
  }, [lang]);

  // Scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  // Timer
  const startTimer = useCallback(() => {
    timerRef.current = window.setInterval(() => {
      elapsedRef.current++;
      setElapsed(elapsedRef.current);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  // Audio visualization
  const stopAudioVisualization = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startAudioVisualization = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastSample = 0;

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);
        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = Math.abs(dataArray[i] - 128);
          if (v > max) max = v;
        }
        const level = Math.min(1, max / 128);
        setAudioLevel(level);

        const now = Date.now();
        if (now - lastSample > 120) {
          activityRef.current.push(level);
          if (activityRef.current.length > ACTIVITY_BUFFER_SIZE) {
            activityRef.current.shift();
          }
          setActivityBuffer([...activityRef.current]);
          lastSample = now;
        }

        if (shouldListenRef.current) {
          animFrameRef.current = requestAnimationFrame(update);
        }
      };
      animFrameRef.current = requestAnimationFrame(update);
    } catch {}
  }, []);

  // Apply vocabulary replacements
  const applyVocab = useCallback((text: string): string => {
    let result = text;
    for (const v of vocabulary) {
      if (v.from && v.to) {
        result = result.split(v.from).join(v.to);
      }
    }
    return result;
  }, [vocabulary]);

  // Add punctuation if enabled
  const addPunctuation = useCallback((text: string): string => {
    if (!punctuationEnabled) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    const last = trimmed[trimmed.length - 1];
    if (last !== '.' && last !== '?' && last !== '!' && last !== '،' && last !== '؟') {
      return trimmed + (langRef.current === 'ar-SA' ? '، ' : '. ');
    }
    return trimmed + ' ';
  }, [punctuationEnabled]);

  // Recognition
  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !shouldListenRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langRef.current;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (finalText) {
        const processed = applyVocab(addPunctuation(finalText));
        setTranscript(prev => prev + processed);
        transcriptRefForSegments.current += processed;
        const endTime = elapsedRef.current;
        segmentsRef.current.push({
          text: processed.trim(),
          startTime: lastSegmentEndRef.current,
          endTime
        });
        lastSegmentEndRef.current = endTime;
        setSegments([...segmentsRef.current]);
      }
      setInterimText(applyVocab(interim));
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(langRef.current === 'ar-SA' ? 'حدث خطأ في التعرف على الصوت' : `Recognition error: ${event.error}`);
      shouldListenRef.current = false;
      setIsListening(false);
      setPaused(false);
      stopAudioVisualization();
      stopTimer();
    };

    recognition.onend = () => {
      if (shouldListenRef.current && !isPausedRef.current) {
        startRecognition();
      } else if (!shouldListenRef.current) {
        setIsListening(false);
        setInterimText('');
        stopAudioVisualization();
        stopTimer();
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setPaused(false);
      setError(null);
    } catch {
      setError(lang === 'ar' ? 'فشل في بدء التعرف على الصوت' : 'Failed to start speech recognition');
      shouldListenRef.current = false;
      setIsListening(false);
    }
  }, [lang, applyVocab, addPunctuation, stopAudioVisualization, stopTimer]);

  // Start listening
  const startListening = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      shouldListenRef.current = true;
      isPausedRef.current = false;
      elapsedRef.current = 0;
      setElapsed(0);
      lastSegmentEndRef.current = 0;
      startAudioVisualization(stream);
      startTimer();
      startRecognition();
    }).catch(() => {
      setError(lang === 'ar' ? 'تم رفض إذن الميكروفون' : 'Microphone permission denied');
    });
  }, [lang, startAudioVisualization, startTimer, startRecognition]);

  // Pause
  const pauseListening = useCallback(() => {
    isPausedRef.current = true;
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setPaused(true);
    setInterimText('');
    stopTimer();
    stopAudioVisualization();
  }, [stopTimer, stopAudioVisualization]);

  // Resume
  const resumeListening = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      shouldListenRef.current = true;
      isPausedRef.current = false;
      setPaused(false);
      startAudioVisualization(stream);
      startTimer();
      startRecognition();
    }).catch(() => {
      setError(lang === 'ar' ? 'تم رفض إذن الميكروفون' : 'Microphone permission denied');
    });
  }, [startAudioVisualization, startTimer, startRecognition]);

  // Stop
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    isPausedRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setPaused(false);
    setInterimText('');
    stopTimer();
    stopAudioVisualization();
  }, [stopTimer, stopAudioVisualization]);

  const handleLanguageChange = (newLang: 'ar-SA' | 'en-US') => {
    if (isListening || paused) {
      setRecognitionLang(newLang);
      if (isListening) {
        pauseListening();
        setTimeout(() => resumeListening(), 300);
      }
    } else {
      setRecognitionLang(newLang);
    }
  };

  // Text editing
  const handleTextEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditingText(val);
    setTranscript(val);
    transcriptRefForSegments.current = val;
  };

  // Clear
  const clearAll = () => {
    if (isListening || paused) {
      stopListening();
    }
    setTranscript('');
    setInterimText('');
    setEditingText('');
    setSegments([]);
    segmentsRef.current = [];
    transcriptRefForSegments.current = '';
    setElapsed(0);
    elapsedRef.current = 0;
    lastSegmentEndRef.current = 0;
    setActivityBuffer([]);
    activityRef.current = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_SEGMENTS_KEY);
  };

  // Export
  const exportTxt = useCallback(() => {
    const text = transcript || editingText;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${Date.now()}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcript, editingText]);

  const exportSrt = useCallback(() => {
    if (segments.length === 0) {
      // If no segments but has text, create one segment
      const text = transcript || editingText;
      if (!text) return;
      const blob = new Blob([`1\n00:00:00,000 --> 00:00:${String(Math.max(1, elapsed)).padStart(2, '0')},000\n${text}\n`], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${Date.now()}.srt`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    const formatTime = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };
    let srt = '';
    segments.forEach((seg, i) => {
      srt += `${i + 1}\n${formatTime(seg.startTime)} --> ${formatTime(seg.endTime)}\n${seg.text}\n\n`;
    });
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${Date.now()}.srt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [segments, transcript, editingText, elapsed]);

  const exportMd = useCallback(() => {
    const text = transcript || editingText;
    if (!text) return;
    const md = `# Transcript\n\n${text}\n\n---\n*Generated by UniTool Speech-to-Text*\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${Date.now()}.md`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcript, editingText]);

  const copyText = useCallback(() => {
    const text = transcript || editingText;
    if (text) navigator.clipboard.writeText(text);
  }, [transcript, editingText]);

  // Add vocabulary
  const addVocab = () => {
    if (!vocabFrom.trim() || !vocabTo.trim()) return;
    setVocabulary(prev => [...prev, { from: vocabFrom.trim(), to: vocabTo.trim() }]);
    setVocabFrom('');
    setVocabTo('');
  };

  const removeVocab = (index: number) => {
    setVocabulary(prev => prev.filter((_, i) => i !== index));
  };

  const currentText = transcript || editingText;
  const wordCount = currentText ? currentText.split(/\s+/).filter(Boolean).length : 0;
  const charCount = currentText.length;
  const isActive = isListening || paused;
  const [mobileTab, setMobileTab] = useState<'transcript' | 'controls'>('transcript');

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F]">
      {/* Page Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <MessageSquareText size={14} className="text-white sm:size-4" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'نص إلى كلام' : 'Speech to Text'}</h1>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'تحويل الصوت المباشر إلى نص' : 'Real-time speech recognition'}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Mobile Tab Bar */}
        <div className="flex border-b border-[#2D3139] bg-[#14171C] shrink-0 lg:hidden">
          <button
            onClick={() => setMobileTab('transcript')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'transcript' ? 'text-purple-400 bg-[#1A1D23] border-b-2 border-purple-500' : 'text-gray-500'
            }`}
          >
            <FileText size={14} />
            {lang === 'ar' ? 'النص' : 'Text'}
          </button>
          <button
            onClick={() => setMobileTab('controls')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'controls' ? 'text-purple-400 bg-[#1A1D23] border-b-2 border-purple-500' : 'text-gray-500'
            }`}
          >
            <Mic size={14} />
            {lang === 'ar' ? 'تحكم' : 'Controls'}
          </button>
        </div>

        {/* Left: Transcript */}
        <div className={`flex-1 flex-col min-h-0 p-3 sm:p-4 ${mobileTab === 'transcript' ? 'flex' : 'hidden'} lg:flex`}>
          <div className="flex-1 flex flex-col bg-[#14171C] rounded-lg border border-[#2D3139] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3139] shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-purple-500" />
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  {lang === 'ar' ? 'النص' : 'Transcript'}
                </span>
                {isActive && (
                  <span className={`text-[8px] font-mono border rounded px-1.5 py-0.5 ${paused ? 'text-yellow-500 border-yellow-500/30' : 'text-green-500 border-green-500/30'}`}>
                    {paused
                      ? (lang === 'ar' ? 'متوقف مؤقتًا' : 'Paused')
                      : (lang === 'ar' ? 'تسجيل' : 'Recording')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isActive && (
                  <span className="text-[8px] font-mono text-gray-500">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</span>
                )}
                {isListening && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* Transcript Area */}
            {isListening ? (
              <div ref={transcriptRef} className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed">
                {!currentText && !interimText ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                    <Mic size={24} className="text-purple-500/30" />
                    <p className="text-[9px]">{lang === 'ar' ? 'تحدث الآن...' : 'Speak now...'}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-200 whitespace-pre-wrap">{currentText}<span className="text-gray-500">{interimText}</span></p>
                    {!interimText && <span className="inline-block w-1.5 h-3.5 bg-purple-500 animate-pulse ml-0.5 align-middle" />}
                  </div>
                )}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={editingText}
                onChange={handleTextEdit}
                className={`flex-1 bg-transparent p-3 font-mono text-xs leading-relaxed text-gray-200 resize-none outline-none placeholder:text-gray-600 ${paused ? 'border-l-2 border-yellow-500/50' : ''}`}
                placeholder={lang === 'ar' ? 'سيظهر النص هنا...' : 'Transcript will appear here...'}
                dir="auto"
              />
            )}

            {/* Voice Activity Timeline */}
            {activityBuffer.length > 1 && (
              <div className="shrink-0 px-3 py-1.5 border-t border-[#2D3139]">
                <div className="flex items-end gap-[1px] h-6">
                  {activityBuffer.map((level, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all duration-100"
                      style={{
                        height: `${Math.max(4, level * 24)}px`,
                        backgroundColor: level > 0.15
                          ? `hsl(${120 - level * 120}, 70%, ${40 + level * 30}%)`
                          : '#2D3139'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Audio Level Meter */}
            {isListening && (
              <div className="shrink-0 px-3 py-1 border-t border-[#2D3139]">
                <div className="flex items-center gap-[2px]">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const threshold = (i + 1) / 30;
                    return (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-75"
                        style={{ backgroundColor: audioLevel >= threshold ? (audioLevel > 0.6 ? '#ef4444' : '#8b5cf6') : '#2D3139' }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Record Button at bottom of transcript (mobile) */}
            <div className="shrink-0 border-t border-[#2D3139] px-3 py-2 flex gap-2">
              <button
                onClick={() => {
                  if (isListening) pauseListening();
                  else if (paused) resumeListening();
                  else startListening();
                }}
                disabled={supported === false}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all font-bold text-[10px] uppercase tracking-wider shadow-lg",
                  isListening
                    ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-yellow-500/20"
                    : paused
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-500/20"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/20",
                  supported === false && "opacity-50 cursor-not-allowed"
                )}
              >
                {isListening ? <><Pause size={14} /> {lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}</>
                  : paused ? <><Play size={14} /> {lang === 'ar' ? 'استئناف' : 'Resume'}</>
                  : <><Mic size={14} /> {lang === 'ar' ? 'بدء التسجيل' : 'Start'}</>}
              </button>
              {isActive && (
                <button
                  onClick={stopListening}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/40 text-red-400 rounded-lg transition-all text-[9px] font-mono"
                >
                  <MicOff size={12} /> {lang === 'ar' ? 'إيقاف' : 'Stop'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className={`lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex-col overflow-y-auto ${mobileTab === 'controls' ? 'flex' : 'hidden'} lg:flex`}>
          <div className="flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3">

            {/* Support Warning */}
            {supported === false && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-start gap-2">
                <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[8px] font-mono text-red-300">{lang === 'ar' ? 'استخدم Chrome أو Edge' : 'Use Chrome or Edge'}</p>
              </div>
            )}

            {/* Record / Pause / Resume Button */}
            <button
              onClick={() => {
                if (isListening) pauseListening();
                else if (paused) resumeListening();
                else startListening();
              }}
              disabled={supported === false}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-lg transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg",
                isListening
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-yellow-500/30"
                  : paused
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-500/30"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/30",
                supported === false && "opacity-50 cursor-not-allowed"
              )}
            >
              {isListening ? <><Pause size={16} /> {lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}</>
                : paused ? <><Play size={16} /> {lang === 'ar' ? 'استئناف' : 'Resume'}</>
                : <><Mic size={16} /> {lang === 'ar' ? 'بدء التسجيل' : 'Start'}</>}
            </button>

            {/* Stop Button (when active) */}
            {isActive && (
              <button
                onClick={stopListening}
                className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/40 text-red-400 rounded-lg transition-all text-[9px] sm:text-[10px] font-mono"
              >
                <MicOff size={12} /> {lang === 'ar' ? 'إيقاف كلي' : 'Stop'}
              </button>
            )}

            {/* Language */}
            <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5">
                <Languages size={12} className="text-purple-500" />
                <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'اللغة' : 'Language'}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleLanguageChange('ar-SA')}
                  className={cn("flex-1 py-2 text-[9px] font-mono uppercase rounded transition-all tracking-wider",
                    recognitionLang === 'ar-SA' ? "bg-purple-600 text-white" : "bg-[#1A1D23] text-gray-400 hover:text-white border border-[#2D3139]"
                  )}>العربية</button>
                <button onClick={() => handleLanguageChange('en-US')}
                  className={cn("flex-1 py-2 text-[9px] font-mono uppercase rounded transition-all tracking-wider",
                    recognitionLang === 'en-US' ? "bg-purple-600 text-white" : "bg-[#1A1D23] text-gray-400 hover:text-white border border-[#2D3139]"
                  )}>English</button>
              </div>
            </div>

            {/* Punctuation Toggle */}
            <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Quote size={12} className="text-purple-500" />
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'ترقيم تلقائي' : 'Auto Punctuation'}</span>
              </div>
              <button
                onClick={() => setPunctuationEnabled(!punctuationEnabled)}
                className={cn(
                  "w-8 h-4 rounded-full transition-all relative",
                  punctuationEnabled ? "bg-purple-600" : "bg-[#2D3139]"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                  punctuationEnabled ? "left-[18px]" : "left-0.5"
                )} />
              </button>
            </div>

            {/* Statistics */}
            {(currentText || isActive) && (
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Timer size={12} className="text-purple-500" />
                  <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'إحصائيات' : 'Stats'}</h3>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-[#1A1D23] rounded p-1 text-center sm:p-1.5">
                    <p className="text-[7px] font-mono text-gray-600 uppercase">{lang === 'ar' ? 'كلمات' : 'Words'}</p>
                    <p className="text-[10px] font-mono text-purple-400">{wordCount}</p>
                  </div>
                  <div className="bg-[#1A1D23] rounded p-1 text-center sm:p-1.5">
                    <p className="text-[7px] font-mono text-gray-600 uppercase">{lang === 'ar' ? 'أحرف' : 'Chars'}</p>
                    <p className="text-[10px] font-mono text-blue-400">{charCount}</p>
                  </div>
                  <div className="bg-[#1A1D23] rounded p-1 text-center sm:p-1.5">
                    <p className="text-[7px] font-mono text-gray-600 uppercase">{lang === 'ar' ? 'الوقت' : 'Time'}</p>
                    <p className="text-[10px] font-mono text-green-400">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Export */}
            {currentText && !isActive && (
              <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <FileOutput size={12} className="text-purple-500" />
                  <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'تصدير' : 'Export'}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={exportTxt}
                    className="flex-1 py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-purple-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">TXT</button>
                  <button onClick={exportSrt}
                    className="flex-1 py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-purple-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">SRT</button>
                  <button onClick={exportMd}
                    className="flex-1 py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-purple-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">MD</button>
                  <button onClick={copyText}
                    className="flex-1 py-1.5 bg-[#1A1D23] border border-[#2D3139] hover:border-blue-500/50 text-gray-300 hover:text-white rounded text-[8px] font-mono transition-all">
                    <Copy size={10} className="inline" />
                  </button>
                </div>
              </div>
            )}

            {/* Vocabulary */}
            <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2 sm:p-2.5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-purple-500" />
                <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'المفردات' : 'Vocabulary'}</h3>
              </div>
              <div className="flex gap-1">
                <input value={vocabFrom} onChange={e => setVocabFrom(e.target.value)} placeholder={lang === 'ar' ? 'من' : 'From'}
                  className="flex-1 bg-[#1A1D23] border border-[#2D3139] rounded px-1.5 py-1 text-[8px] font-mono text-gray-300 outline-none focus:border-purple-500/50 placeholder:text-gray-600" />
                <input value={vocabTo} onChange={e => setVocabTo(e.target.value)} placeholder={lang === 'ar' ? 'إلى' : 'To'}
                  className="flex-1 bg-[#1A1D23] border border-[#2D3139] rounded px-1.5 py-1 text-[8px] font-mono text-gray-300 outline-none focus:border-purple-500/50 placeholder:text-gray-600" />
                <button onClick={addVocab} className="p-1 bg-purple-600 hover:bg-purple-500 rounded text-white transition-all"><Plus size={12} /></button>
              </div>
              {vocabulary.length > 0 && (
                <div className="space-y-0.5 max-h-20 overflow-y-auto">
                  {vocabulary.map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1A1D23] rounded px-1.5 py-0.5">
                      <span className="text-[7px] font-mono text-gray-400">{v.from} → {v.to}</span>
                      <button onClick={() => removeVocab(i)} className="p-0.5 hover:bg-red-500/20 rounded text-gray-600 hover:text-red-400"><X size={8} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clear */}
            {currentText && (
              <button onClick={clearAll}
                className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-[#1A1D23] border border-[#2D3139] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all text-[9px] sm:text-[10px] font-mono">
                <Trash2 size={12} /> {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
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
