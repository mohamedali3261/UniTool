import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Languages, Copy, Download, Trash2, FileText, AlertCircle } from 'lucide-react';

interface SpeechToTextProps {
  t: any;
  lang: 'ar' | 'en';
}

export function SpeechToText({ t, lang }: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recognitionLang, setRecognitionLang] = useState<'ar-SA' | 'en-US'>('ar-SA');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const shouldListenRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef(0);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
    if (!SpeechRecognition) {
      setError(lang === 'ar' ? 'المتصفح لا يدعم التعرف على الصوت، استخدم Chrome أو Edge' : 'Speech recognition not supported, use Chrome or Edge');
    }
  }, [lang]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

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

  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);
        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = Math.abs(dataArray[i] - 128);
          if (v > max) max = v;
        }
        setAudioLevel(Math.min(1, max / 128));
        if (shouldListenRef.current) {
          animFrameRef.current = requestAnimationFrame(update);
        }
      };
      animFrameRef.current = requestAnimationFrame(update);
    } catch {
      // Mic permission denied or unavailable
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
    stopAudioVisualization();
  }, [stopAudioVisualization]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    shouldListenRef.current = true;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = recognitionLang;

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
      if (finalText) setTranscript(prev => prev + finalText);
      setInterimText(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setError(lang === 'ar' ? 'حدث خطأ في التعرف على الصوت' : `Recognition error: ${event.error}`);
      shouldListenRef.current = false;
      setIsListening(false);
      stopAudioVisualization();
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        recognition.start();
      } else {
        setIsListening(false);
        setInterimText('');
        stopAudioVisualization();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
    setError(null);
    startAudioVisualization();
  }, [recognitionLang, lang, startAudioVisualization, stopAudioVisualization]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLanguageChange = (newLang: 'ar-SA' | 'en-US') => {
    const wasListening = isListening;
    setRecognitionLang(newLang);
    if (wasListening) {
      stopListening();
      setTimeout(() => startListening(), 200);
    }
  };

  const copyText = () => {
    if (transcript) navigator.clipboard.writeText(transcript);
  };

  const downloadText = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearText = () => {
    setTranscript('');
    setInterimText('');
  };

  const hasText = transcript.length > 0 || interimText.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F] overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Left: Transcript Display */}
        <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4">
          <div className="flex-1 flex flex-col bg-[#14171C] rounded-lg border border-[#2D3139] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D3139] shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-purple-500" />
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  {lang === 'ar' ? 'النص المفروغ' : 'Transcript'}
                </span>
              </div>
              {isListening && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-green-500 uppercase tracking-wider">
                    {recognitionLang === 'ar-SA' ? 'تسجيل' : 'Recording'}
                  </span>
                </div>
              )}
            </div>

            {/* Transcript Area */}
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed"
            >
              {!hasText && !isListening ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                  <Mic size={24} className="text-purple-500/30" />
                  <p className="text-[9px]">
                    {lang === 'ar' ? 'اضغط على زر التسجيل وابدأ التحدث' : 'Press record and start speaking'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-200 whitespace-pre-wrap">
                    {transcript}
                    {interimText && (
                      <span className="text-gray-500">{interimText}</span>
                    )}
                  </p>
                  {isListening && !interimText && (
                    <span className="inline-block w-1.5 h-3.5 bg-purple-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )}
            </div>

            {/* Audio Level Meter */}
            {isListening && (
              <div className="shrink-0 px-3 py-1.5 border-t border-[#2D3139]">
                <div className="flex items-center gap-2">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const threshold = (i + 1) / 20;
                    const active = audioLevel >= threshold;
                    return (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-75"
                        style={{
                          backgroundColor: active
                            ? audioLevel > 0.6
                              ? `rgb(${Math.floor(255 * (1 - (audioLevel - 0.6) / 0.4))}, ${Math.floor(255 * (audioLevel - 0.6) / 0.4)}, 100)`
                              : '#8b5cf6'
                            : '#2D3139'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex flex-col">
          <div className="overflow-y-auto flex-1 p-3 space-y-3">

            {/* Browser Support Check */}
            {supported === false && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-start gap-2">
                <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[8px] font-mono text-red-300">
                  {lang === 'ar' ? 'استخدم Chrome أو Edge للتعرف على الصوت' : 'Use Chrome or Edge for speech recognition'}
                </p>
              </div>
            )}

            {/* Record Button */}
            <button
              onClick={toggleListening}
              disabled={supported === false}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 rounded-lg transition-all font-bold text-xs uppercase tracking-wider shadow-lg",
                isListening
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/30 hover:shadow-red-500/50"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/30 hover:shadow-purple-500/50",
                supported === false && "opacity-50 cursor-not-allowed"
              )}
            >
              {isListening ? (
                <><MicOff size={16} /> {lang === 'ar' ? 'إيقاف التسجيل' : 'Stop Recording'}</>
              ) : (
                <><Mic size={16} /> {lang === 'ar' ? 'بدء التسجيل' : 'Start Recording'}</>
              )}
            </button>

            {/* Language Selector */}
            <div className="bg-[#0F1115] border border-[#2D3139] rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Languages size={12} className="text-purple-500" />
                <h3 className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  {lang === 'ar' ? 'اللغة' : 'Language'}
                </h3>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleLanguageChange('ar-SA')}
                  className={cn(
                    "flex-1 py-2 text-[9px] font-mono uppercase rounded transition-all tracking-wider",
                    recognitionLang === 'ar-SA'
                      ? "bg-purple-600 text-white"
                      : "bg-[#1A1D23] text-gray-400 hover:text-white border border-[#2D3139]"
                  )}
                >
                  العربية
                </button>
                <button
                  onClick={() => handleLanguageChange('en-US')}
                  className={cn(
                    "flex-1 py-2 text-[9px] font-mono uppercase rounded transition-all tracking-wider",
                    recognitionLang === 'en-US'
                      ? "bg-purple-600 text-white"
                      : "bg-[#1A1D23] text-gray-400 hover:text-white border border-[#2D3139]"
                  )}
                >
                  English
                </button>
              </div>
            </div>

            {/* Actions */}
            {hasText && (
              <div className="space-y-1.5">
                <button
                  onClick={copyText}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#1A1D23] border border-[#2D3139] hover:border-purple-500/50 text-gray-300 hover:text-white rounded-lg transition-all text-[10px] font-mono"
                >
                  <Copy size={12} />
                  {lang === 'ar' ? 'نسخ النص' : 'Copy Text'}
                </button>
                <button
                  onClick={downloadText}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all text-[10px] font-mono shadow-lg shadow-green-500/30"
                >
                  <Download size={12} />
                  {lang === 'ar' ? 'تحميل TXT' : 'Download TXT'}
                </button>
                <button
                  onClick={clearText}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#1A1D23] border border-[#2D3139] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all text-[10px] font-mono"
                >
                  <Trash2 size={12} />
                  {lang === 'ar' ? 'مسح النص' : 'Clear'}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-start gap-2">
                <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[8px] font-mono text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="p-3 border-t border-[#2D3139] bg-[#0F1115] mt-auto">
            <div className="flex items-start gap-2">
              <AlertCircle size={10} className="text-purple-500 shrink-0 mt-0.5" />
              <p className="text-[7px] text-gray-500 leading-relaxed font-mono">
                {lang === 'ar'
                  ? 'يستخدم Web Speech API المدمج في المتصفح • يعمل بدون خادم • يدعم العربية والإنجليزية'
                  : 'Uses browser built-in Web Speech API • No server required • Supports Arabic & English'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(' ');
}
