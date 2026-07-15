import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, FileImage, CheckSquare, Square, FileDown, Trash2, Video, ArrowDownUp, Film } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';
import { loadFFmpeg } from '../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface VideoFile {
  id: number;
  name: string;
  originalSize: number;
  compressedSize: number;
  compressedBlob: Blob | null;
  keptOriginal: boolean;
}

export function VideoCompressor({ t, lang }: Props) {
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [crf, setCrf] = useState(28);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'files' | 'export'>('upload');
  const [nextId, setNextId] = useState(1);
  const [fileMap] = useState(() => new Map<number, File>());

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      let idCounter = nextId;
      const newFiles: VideoFile[] = [];

      for (const f of Array.from(inputFiles)) {
        if (!f.type.startsWith('video/')) continue;
        const id = idCounter++;
        fileMap.set(id, f);
        newFiles.push({
          id,
          name: f.name.replace(/\.[^.]+$/, ''),
          originalSize: f.size,
          compressedSize: 0,
          compressedBlob: null,
          keptOriginal: false,
        });
      }

      if (newFiles.length === 0) {
        setError(lang === 'ar' ? 'لم يتم العثور على فيديوهات' : 'No video files found');
        setLoading(false);
        return;
      }

      setFiles(prev => [...prev, ...newFiles]);
      setNextId(idCounter);
      setSelectedIds(prev => {
        const next = new Set(prev);
        newFiles.forEach(f => next.add(f.id));
        return next;
      });
    } catch {
      setError(lang === 'ar' ? 'فشل تحميل الفيديو' : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [nextId, fileMap, lang]);

  const getExt = (name: string) => (name.split('.').pop() || 'mp4').toLowerCase();

  const progressRef = useRef<{ current: number; id: number; fileName: string }>({ current: 0, id: -1, fileName: '' });

  const compressOne = async (f: VideoFile): Promise<VideoFile> => {
    const originalFile = fileMap.get(f.id);
    if (!originalFile) return { ...f, keptOriginal: true };

    try {
      const ffmpeg = await loadFFmpeg();
      const inputName = `vinput_${f.id}`;
      const ext = getExt(originalFile.name);
      const outputName = `voutput_${f.id}.${ext}`;

      progressRef.current = { current: 0, id: f.id, fileName: f.name };

      ffmpeg.on('progress', ({ progress }) => {
        const pct = Math.round(progress * 100);
        progressRef.current = { ...progressRef.current, current: pct };
      });

      await ffmpeg.writeFile(inputName, await fetchFile(originalFile));

      const command = ['-i', inputName, '-c:v', 'libx264', '-crf', String(crf), '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-y', outputName];

      const result = await ffmpeg.exec(command);
      if (result !== 0) throw new Error('FFmpeg failed');

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: `video/${ext}` });

      // Clean up files from virtual FS
      try { await ffmpeg.deleteFile(inputName); } catch {}
      try { await ffmpeg.deleteFile(outputName); } catch {}

      const keptOriginal = blob.size >= f.originalSize;
      return { ...f, compressedSize: blob.size, compressedBlob: keptOriginal ? null : blob, keptOriginal };
    } catch (err) {
      console.error('Video compression error:', err);
      return { ...f, keptOriginal: true };
    }
  };

  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  const compressAll = async () => {
    if (files.length === 0) return;
    setCompressing(true);
    setProgress(0);
    setCurrentFile('');
    try {
      for (const f of files) {
        if (f.compressedBlob || f.keptOriginal) continue;
        setCurrentFile(f.name);
        setProgress(0);
        const updated = await compressOne(f);
        setFiles(prev => prev.map(p => p.id === f.id ? updated : p));
        setProgress(100);
      }
    } catch {
      setError(lang === 'ar' ? 'فشل الضغط' : 'Compression failed');
    } finally {
      setCompressing(false);
      setCurrentFile('');
      setProgress(0);
    }
  };

  // Poll progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(progressRef.current.current);
      if (progressRef.current.fileName) setCurrentFile(progressRef.current.fileName);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const toggleFile = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === files.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(files.map(f => f.id)));
  };

  const removeFile = (id: number) => {
    fileMap.delete(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const clearAll = () => { fileMap.clear(); setFiles([]); setSelectedIds(new Set()); setNextId(1); setError(null); };

  const downloadSingle = (file: VideoFile) => {
    const blob = file.keptOriginal ? fileMap.get(file.id) : file.compressedBlob;
    if (!blob) return;
    const originalFile = fileMap.get(file.id);
    const ext = originalFile ? getExt(originalFile.name) : 'mp4';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    const selected = files.filter(f => selectedIds.has(f.id) && (f.compressedBlob || f.keptOriginal));
    if (selected.length === 0) return;
    if (selected.length === 1) { downloadSingle(selected[0]); return; }
    const zip = new JSZip();
    for (const f of selected) {
      const blob = f.keptOriginal ? fileMap.get(f.id) : f.compressedBlob;
      if (!blob) continue;
      const originalFile = fileMap.get(f.id);
      const ext = originalFile ? getExt(originalFile.name) : 'mp4';
      zip.file(`${f.name}.${ext}`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `compressed_videos.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalOriginalSize = files.reduce((s, f) => s + f.originalSize, 0);
  const totalEffectiveSize = files.reduce((s, f) => f.keptOriginal ? s + f.originalSize : s + f.compressedSize, 0);
  const allCompressed = files.length > 0 && files.every(f => f.compressedBlob || f.keptOriginal);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 sm:w-8 sm:h-8">
          <Film size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'ضغط الفيديو' : 'Video Compressor'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'ضغط وتقليل حجم ملفات الفيديو' : 'Compress and reduce video file size'}</p>
        </div>
      </div>

      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
          { id: 'files', label: lang === 'ar' ? 'فيديو' : 'Videos', icon: Video },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMobileTab(tab.id as any)}
            className={cn("flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors", mobileTab === tab.id ? "text-rose-500 bg-[#1A1D23]" : "text-gray-500")}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn("w-full sm:w-64 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto", mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <label className={cn("flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-rose-500/50 transition-colors bg-[#0F1115]", files.length > 0 ? "border-rose-500/30" : "")}>
                <Upload size={20} className={files.length > 0 ? "text-rose-500" : "text-gray-500"} />
                <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">{files.length > 0 ? (lang === 'ar' ? 'إضافة فيديوهات' : 'Add more videos') : (lang === 'ar' ? 'اختر ملفات فيديو' : 'Select video files')}</span>
                <span className="text-[7px] font-mono text-gray-600">MP4, AVI, MOV, MKV, WEBM</span>
                <input type="file" accept="video/*" multiple className="hidden" onChange={handleFiles} />
              </label>
              {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
              {files.length > 0 && (
                <button onClick={clearAll} className="w-full mt-3 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20">
                  <Trash2 size={10} />{lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">{lang === 'ar' ? 'الجودة' : 'Quality'}</h3>
              <div>
                <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                  CRF: {crf} ({crf <= 22 ? (lang === 'ar' ? 'عالية' : 'High') : crf <= 28 ? (lang === 'ar' ? 'متوسطة' : 'Medium') : (lang === 'ar' ? 'منخفضة' : 'Low')})
                </label>
                <input type="range" min="18" max="40" step="1" value={crf} onChange={e => setCrf(parseInt(e.target.value))} className="w-full mt-1.5 accent-rose-500" />
                <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
                  <span>{lang === 'ar' ? 'جودة عالية' : 'High quality'}</span>
                  <span>{lang === 'ar' ? 'حجم صغير' : 'Small size'}</span>
                </div>
                <p className="text-[7px] font-mono text-gray-700 mt-1 leading-relaxed">
                  {lang === 'ar' ? 'CRF 18 = جودة عالية / CRF 40 = حجم صغير' : 'CRF 18 = high quality / CRF 40 = small size'}
                </p>
              </div>
            </div>
          </div>

          <div className={cn("flex flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            {allCompressed && (
              <div className="p-3 border-b border-[#2D3139] sm:p-4">
                <div className="space-y-2 text-[8px] font-mono text-gray-500">
                  <div className="flex justify-between"><span>{lang === 'ar' ? 'الملفات' : 'Files'}:</span><span>{files.length}</span></div>
                  <div className="flex justify-between"><span>{lang === 'ar' ? 'الحجم الأصلي' : 'Original'}:</span><span className="text-gray-400">{formatBytes(totalOriginalSize)}</span></div>
                  <div className="flex justify-between"><span>{lang === 'ar' ? 'بعد الضغط' : 'Result'}:</span><span className={cn(totalEffectiveSize < totalOriginalSize ? "text-rose-400" : "text-red-400")}>{formatBytes(totalEffectiveSize)}</span></div>
                  <div className="flex justify-between border-t border-[#2D3139] pt-2 mt-1">
                    <span className="text-gray-400">{lang === 'ar' ? 'التوفير' : 'Saved'}:</span>
                    <span className={cn("font-bold", totalEffectiveSize < totalOriginalSize ? "text-rose-400" : "text-red-400")}>
                      {totalEffectiveSize < totalOriginalSize ? `-${((1 - totalEffectiveSize / totalOriginalSize) * 100).toFixed(1)}%` : (lang === 'ar' ? 'بدون توفير' : 'No savings')}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="p-3 mt-auto space-y-2 sm:p-4">
              {!allCompressed && files.length > 0 && (
                <button onClick={compressAll} disabled={compressing}
                  className="w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-500/20 disabled:opacity-60">
                  {compressing ? <Loader2 size={12} className="animate-spin" /> : <ArrowDownUp size={12} />}
                  {compressing ? (lang === 'ar' ? `جاري الضغط... ${progress}%` : `Compressing... ${progress}%`) : (lang === 'ar' ? 'ضغط الكل' : 'Compress All')}
                </button>
              )}
              {compressing && currentFile && (
                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 h-1 bg-[#2D3139] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[6px] font-mono text-gray-500 truncate max-w-[80px]">{currentFile}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                <span>{lang === 'ar' ? 'المحدد' : 'Selected'}: {selectedIds.size}/{files.length}</span>
                <button onClick={toggleAll} className="text-rose-400 hover:text-rose-300 flex items-center gap-1">
                  {selectedIds.size === files.length ? <Square size={10} /> : <CheckSquare size={10} />}
                  {selectedIds.size === files.length ? (lang === 'ar' ? 'إلغاء' : 'Deselect') : (lang === 'ar' ? 'الكل' : 'All')}
                </button>
              </div>
              <button onClick={downloadAll} disabled={selectedIds.size === 0 || !allCompressed}
                className={cn("w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5", selectedIds.size > 0 && allCompressed ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-500/20" : "bg-[#2D3139] text-gray-600 cursor-not-allowed")}>
                <Download size={12} />{lang === 'ar' ? 'تحميل المحدد' : 'Download Selected'}
              </button>
            </div>
          </div>
        </aside>

        <section className={cn("flex-1 overflow-y-auto bg-[#0A0C0F]", mobileTab === 'files' ? "flex" : "hidden sm:flex")}>
          {files.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <Film size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">{lang === 'ar' ? 'اختر فيديوهات للبدء' : 'Select videos to start'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-gray-500">
                <Film size={12} />
                <span>{files.length} {lang === 'ar' ? 'فيديو' : 'video'}{files.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-700 mx-1">|</span>
                <span className="text-rose-400/70">CRF {crf}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map(f => {
                  const savings = f.compressedSize ? ((1 - f.compressedSize / f.originalSize) * 100).toFixed(1) : null;
                  return (
                    <div key={f.id} onClick={() => toggleFile(f.id)}
                      className={cn("relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group bg-[#1A1D23]", selectedIds.has(f.id) ? f.keptOriginal ? "border-red-500 shadow-lg shadow-red-500/20" : "border-rose-500 shadow-lg shadow-rose-500/20" : "border-[#2D3139] hover:border-gray-500")}>
                      <div className="h-28 bg-gradient-to-br from-[#1A1D23] to-[#0A0C0F] flex items-center justify-center">
                        <Film size={36} className={selectedIds.has(f.id) && !f.keptOriginal ? "text-rose-400" : "text-gray-600"} />
                      </div>
                      <div className="bg-[#1A1D23] p-2">
                        <p className="text-[8px] font-mono text-white truncate leading-tight">{f.name}</p>
                        <div className="flex items-center gap-2 text-[7px] font-mono text-gray-400 mt-0.5">
                          <span>{formatBytes(f.originalSize)}</span>
                          {f.compressedSize > 0 && (
                            <><ArrowDownUp size={8} className={f.keptOriginal ? "text-red-500" : "text-rose-500"} />
                              {f.keptOriginal ? <span className="text-red-400">{formatBytes(f.compressedSize)}</span> : <span className="text-rose-400">{formatBytes(f.compressedSize)}</span>}
                              {!f.keptOriginal && <span className="text-rose-500 font-bold">-{savings}%</span>}</>
                          )}
                        </div>
                        {f.keptOriginal && <p className="text-[6px] font-mono text-red-400 mt-0.5">{lang === 'ar' ? 'تم الاحتفاظ بالأصلي' : 'Original kept'}</p>}
                      </div>
                      <div className={cn("absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all", selectedIds.has(f.id) ? (f.keptOriginal ? "bg-red-500" : "bg-rose-500") : "bg-black/40 group-hover:bg-black/60")}>
                        {selectedIds.has(f.id) ? <CheckSquare size={12} className="text-white" /> : <Square size={12} className="text-white/60" />}
                      </div>
                      {f.compressedBlob && (
                        <button onClick={e => { e.stopPropagation(); downloadSingle(f); }} className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Download size={10} className="text-white" />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); removeFile(f.id); }} className="absolute top-8 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={9} className="text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
