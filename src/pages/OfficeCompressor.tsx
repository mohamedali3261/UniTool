import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, FileImage, CheckSquare, Square, FileDown, Trash2, FileType2, FileSpreadsheet, FileText as FileTextIcon, ArrowDownUp, FileArchive } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface OfficeFile {
  id: number;
  name: string;
  originalSize: number;
  compressedSize: number;
  compressedBlob: Blob | null;
  keptOriginal: boolean;
}

const officeExts = ['.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt'];
const officeMimes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
];

export function OfficeCompressor({ t, lang }: Props) {
  const [files, setFiles] = useState<OfficeFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quality, setQuality] = useState(70);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'files' | 'export'>('upload');
  const [nextId, setNextId] = useState(1);
  const [fileMap] = useState(() => new Map<number, File>());

  const compressAll = async () => {
    if (files.length === 0) return;
    setCompressing(true);
    try {
      const updated = await Promise.all(files.map(async (f) => {
        if (f.compressedBlob) return f;
        const originalFile = fileMap.get(f.id);
        if (!originalFile) return f;

        try {
          const zip = await JSZip.loadAsync(originalFile);
          const newZip = new JSZip();
          const jpegQuality = quality / 100;
          let savedBytes = 0;

          for (const [path, entry] of Object.entries(zip.files)) {
            if (entry.dir) {
              newZip.folder(path);
              continue;
            }
            const data = await entry.async('uint8array');
            const lower = path.toLowerCase();

            // Try to re-compress images — skip tiny ones where JPEG overhead isn't worth it
            if (data.length > 20480 && lower.match(/\.(png|jpg|jpeg|gif|bmp|webp|tiff?)$/)) {
              try {
                const blob = new Blob([data]);
                const img = await createImageBitmap(blob);
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                img.close();
                const compressedBlob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', jpegQuality));
                const compressed = new Uint8Array(await compressedBlob.arrayBuffer());
                // Keep whichever is smaller
                if (compressed.length < data.length) {
                  newZip.file(path, compressed, { compression: 'DEFLATE', compressionOptions: { level: 9 } });
                  savedBytes += data.length - compressed.length;
                } else {
                  newZip.file(path, data, { compression: 'DEFLATE', compressionOptions: { level: 9 } });
                }
              } catch {
                newZip.file(path, data, { compression: 'DEFLATE', compressionOptions: { level: 9 } });
              }
            } else {
              newZip.file(path, data, { compression: 'DEFLATE', compressionOptions: { level: 9 } });
            }
          }

          const blob = await newZip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 },
          });

          const keptOriginal = blob.size >= f.originalSize;
          return { ...f, compressedSize: blob.size, compressedBlob: keptOriginal ? null : blob, keptOriginal };
        } catch {
          return { ...f, keptOriginal: true };
        }
      }));
      setFiles(updated);
    } catch {
      setError(lang === 'ar' ? 'فشل الضغط' : 'Compression failed');
    } finally {
      setCompressing(false);
    }
  };

  // Override handleFiles to store File objects
  const handleFilesWithMap = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      let idCounter = nextId;
      const newFiles: OfficeFile[] = [];

      for (const f of Array.from(inputFiles)) {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        if (!officeExts.includes(ext)) continue;
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
        setError(lang === 'ar' ? 'لم يتم العثور على ملفات أوفيس' : 'No Office files found');
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
      setError(lang === 'ar' ? 'فشل تحميل الملفات' : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [nextId, fileMap, lang]);

  const toggleFile = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map(f => f.id)));
    }
  };

  const removeFile = (id: number) => {
    fileMap.delete(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const clearAll = () => {
    fileMap.clear();
    setFiles([]);
    setSelectedIds(new Set());
    setNextId(1);
    setError(null);
  };

  const downloadSingle = (file: OfficeFile) => {
    const blob = file.keptOriginal ? fileMap.get(file.id) : file.compressedBlob;
    if (!blob) return;
    const originalFile = fileMap.get(file.id);
    const ext = originalFile ? (originalFile.name.split('.').pop() || 'docx') : 'docx';
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

    if (selected.length === 1) {
      downloadSingle(selected[0]);
      return;
    }

    const zip = new JSZip();
    for (const f of selected) {
      const blob = f.keptOriginal ? fileMap.get(f.id) : f.compressedBlob;
      if (!blob) continue;
      const originalFile = fileMap.get(f.id);
      const ext = originalFile ? (originalFile.name.split('.').pop() || 'docx') : 'docx';
      zip.file(`${f.name}.${ext}`, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_office_files.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalOriginalSize = files.reduce((s, f) => s + f.originalSize, 0);
  const totalEffectiveSize = files.reduce((s, f) => f.keptOriginal ? s + f.originalSize : s + f.compressedSize, 0);
  const allCompressed = files.length > 0 && files.every(f => f.compressedBlob || f.keptOriginal);

  const getFileIcon = (f: OfficeFile) => {
    const originalFile = fileMap.get(f.id);
    const name = originalFile ? originalFile.name : f.name;
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'docx' || ext === 'doc') return FileTextIcon;
    if (ext === 'xlsx' || ext === 'xls') return FileSpreadsheet;
    return FileType2;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-600 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 sm:w-8 sm:h-8">
          <FileArchive size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'ضغط ملفات أوفيس' : 'Office Compressor'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'ضغط ملفات Word و Excel و PowerPoint' : 'Compress Word, Excel & PowerPoint files'}</p>
        </div>
      </div>

      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
          { id: 'files', label: lang === 'ar' ? 'ملفات' : 'Files', icon: FileType2 },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id as any)}
            className={cn(
              "flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors",
              mobileTab === tab.id ? "text-sky-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          "w-full sm:w-64 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto",
          mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <label className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-sky-500/50 transition-colors bg-[#0F1115]",
                files.length > 0 ? "border-sky-500/30" : ""
              )}>
                <Upload size={20} className={files.length > 0 ? "text-sky-500" : "text-gray-500"} />
                <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
                  {files.length > 0
                    ? (lang === 'ar' ? 'إضافة ملفات أوفيس' : 'Add Office files')
                    : (lang === 'ar' ? 'اختر ملفات أوفيس' : 'Select Office files')}
                </span>
                <span className="text-[7px] font-mono text-gray-600">
                  DOCX, XLSX, PPTX, DOC, XLS, PPT
                </span>
                <input type="file" accept={officeExts.join(',') + ',application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'} multiple className="hidden" onChange={handleFilesWithMap} />
              </label>
              {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
              {!files.length && loading && (
                <div className="flex items-center gap-2 mt-3 text-[8px] text-gray-400 font-mono">
                  <Loader2 size={10} className="animate-spin" />
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              )}
              {files.length > 0 && (
                <>
                  <div className="p-3 border-b border-[#2D3139] sm:p-4">
                    <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">
                      {lang === 'ar' ? 'جودة الصور' : 'Image quality'}
                    </h3>
                    <div>
                      <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                        JPEG: {quality}%
                      </label>
                      <input type="range" min="10" max="95" step="1" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full mt-1.5 accent-sky-500" />
                      <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
                        <span>{lang === 'ar' ? 'حجم صغير' : 'Small size'}</span>
                        <span>{lang === 'ar' ? 'جودة عالية' : 'High quality'}</span>
                      </div>
                      <p className="text-[7px] font-mono text-gray-700 mt-1 leading-relaxed">
                        {lang === 'ar'
                          ? 'يتم تحويل الصور المضمنة إلى JPEG بهذه الجودة لتقليل الحجم.'
                          : 'Embedded images are converted to JPEG at this quality to reduce size.'}
                      </p>
                    </div>
                  </div>
                  <button onClick={clearAll} className="w-full py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-red-400 hover:text-red-300 border-b border-[#2D3139] hover:border-red-500/50 transition-all bg-red-950/20">
                    <Trash2 size={10} />
                    {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={cn("flex flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">
                {lang === 'ar' ? 'ملخص' : 'Summary'}
              </h3>
              <div className="space-y-2 text-[8px] font-mono text-gray-500">
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'الملفات' : 'Files'}:</span>
                  <span>{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'ar' ? 'الحجم الأصلي' : 'Original'}:</span>
                  <span className="text-gray-400">{formatBytes(totalOriginalSize)}</span>
                </div>
                {allCompressed && (
                  <>
                    <div className="flex justify-between">
                      <span>{lang === 'ar' ? 'بعد الضغط' : 'Result'}:</span>
                      <span className={cn(totalEffectiveSize < totalOriginalSize ? "text-sky-400" : "text-red-400")}>{formatBytes(totalEffectiveSize)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#2D3139] pt-2 mt-1">
                      <span className="text-gray-400">{lang === 'ar' ? 'التوفير' : 'Saved'}:</span>
                      <span className={cn("font-bold", totalEffectiveSize < totalOriginalSize ? "text-sky-400" : "text-red-400")}>
                        {totalEffectiveSize < totalOriginalSize ? `-${((1 - totalEffectiveSize / totalOriginalSize) * 100).toFixed(1)}%` : (lang === 'ar' ? 'بدون توفير' : 'No savings')}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 mt-auto space-y-2 sm:p-4">
              {!allCompressed && files.length > 0 && (
                <button
                  onClick={compressAll}
                  disabled={compressing}
                  className="w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/20"
                >
                  {compressing ? <Loader2 size={12} className="animate-spin" /> : <ArrowDownUp size={12} />}
                  {compressing
                    ? (lang === 'ar' ? 'جاري الضغط...' : 'Compressing...')
                    : (lang === 'ar' ? 'ضغط الكل' : 'Compress All')}
                </button>
              )}
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                <span>{lang === 'ar' ? 'المحدد' : 'Selected'}: {selectedIds.size}/{files.length}</span>
                <button onClick={toggleAll} className="text-sky-400 hover:text-sky-300 flex items-center gap-1">
                  {selectedIds.size === files.length ? <Square size={10} /> : <CheckSquare size={10} />}
                  {selectedIds.size === files.length
                    ? (lang === 'ar' ? 'إلغاء' : 'Deselect')
                    : (lang === 'ar' ? 'الكل' : 'All')}
                </button>
              </div>
              <button
                onClick={downloadAll}
                disabled={selectedIds.size === 0 || !allCompressed}
                className={cn(
                  "w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
                  selectedIds.size > 0 && allCompressed
                    ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500 shadow-lg shadow-sky-500/20"
                    : "bg-[#2D3139] text-gray-600 cursor-not-allowed"
                )}
              >
                <Download size={12} />
                {lang === 'ar' ? 'تحميل المحدد' : 'Download Selected'}
              </button>
            </div>
          </div>
        </aside>

        <section className={cn(
          "flex-1 overflow-y-auto bg-[#0A0C0F]",
          mobileTab === 'files' ? "flex" : "hidden sm:flex"
        )}>
          {files.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <FileArchive size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">
                  {lang === 'ar' ? 'اختر ملفات أوفيس للبدء' : 'Select Office files to start'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-gray-500">
                <FileArchive size={12} />
                <span>{files.length} {lang === 'ar' ? 'ملف' : 'file'}{files.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map(f => {
                  const savings = f.compressedSize ? ((1 - f.compressedSize / f.originalSize) * 100).toFixed(1) : null;
                  const FileIcon = getFileIcon(f);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFile(f.id)}
                      className={cn(
                        "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group",
                        selectedIds.has(f.id)
                          ? f.keptOriginal ? "border-red-500 shadow-lg shadow-red-500/20" : "border-sky-500 shadow-lg shadow-sky-500/20"
                          : "border-[#2D3139] hover:border-gray-500"
                      )}
                    >
                      <div className="h-28 bg-gradient-to-br from-[#1A1D23] to-[#14171C] flex items-center justify-center">
                        <FileIcon size={36} className={selectedIds.has(f.id) && !f.keptOriginal ? "text-sky-400" : "text-gray-600"} />
                      </div>
                      <div className="bg-[#1A1D23] p-2">
                        <p className="text-[8px] font-mono text-white truncate leading-tight">{f.name}</p>
                        <div className="flex items-center gap-2 text-[7px] font-mono text-gray-400 mt-0.5">
                          <span>{formatBytes(f.originalSize)}</span>
                          {f.compressedSize > 0 && (
                            <>
                              <ArrowDownUp size={8} className={f.keptOriginal ? "text-red-500" : "text-sky-500"} />
                              {f.keptOriginal ? (
                                <span className="text-red-400">{formatBytes(f.compressedSize)}</span>
                              ) : (
                                <span className="text-sky-400">{formatBytes(f.compressedSize)}</span>
                              )}
                              {!f.keptOriginal && <span className="text-sky-500 font-bold">-{savings}%</span>}
                            </>
                          )}
                        </div>
                        {f.keptOriginal && (
                          <p className="text-[6px] font-mono text-red-400 mt-0.5">
                            {lang === 'ar' ? 'تم الاحتفاظ بالأصلي' : 'Original kept'}
                          </p>
                        )}
                      </div>
                      <div className={cn(
                        "absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                        selectedIds.has(f.id) ? (f.keptOriginal ? "bg-red-500" : "bg-sky-500") : "bg-black/40 group-hover:bg-black/60"
                      )}>
                        {selectedIds.has(f.id) ? <CheckSquare size={12} className="text-white" /> : <Square size={12} className="text-white/60" />}
                      </div>
                      {f.compressedBlob && (
                        <button
                          onClick={e => { e.stopPropagation(); downloadSingle(f); }}
                          className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-sky-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Download size={10} className="text-white" />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); removeFile(f.id); }}
                        className="absolute top-8 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
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
