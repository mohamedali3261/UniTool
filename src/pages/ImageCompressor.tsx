import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, FileImage, CheckSquare, Square, FileDown, Trash2, ImagePlus, ArrowDownUp, Percent, FolderOpen } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

interface CompressedFile {
  id: number;
  name: string;
  relativePath?: string;
  originalSize: number;
  compressedSize: number;
  originalDataUrl: string;
  compressedDataUrl: string;
  format: string;
  quality: number;
  keptOriginal: boolean;
}

export function ImageCompressor({ t, lang }: Props) {
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('webp');
  const [quality, setQuality] = useState(85);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'upload' | 'files' | 'export'>('upload');
  const [nextId, setNextId] = useState(1);
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');
  const [rootFolderName, setRootFolderName] = useState<string>('');
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (uploadMode === 'folder' && folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.removeAttribute('multiple');
    }
  }, [uploadMode]);

  const mimeMap: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mimeType = mimeMap[format] || 'image/jpeg';

  const loadImageToCanvas = (dataUrl: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d')!;
        if (format === 'jpeg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, c.width, c.height);
        }
        ctx.drawImage(img, 0, 0);
        resolve(c);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const compressImage = async (dataUrl: string, originalSize: number): Promise<{ blob: Blob; dataUrl: string; keptOriginal: boolean }> => {
    const canvas = await loadImageToCanvas(dataUrl);
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve({ blob, dataUrl: result, keptOriginal: blob.size >= originalSize });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, mimeType, quality / 100);
    });
  };

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = e.target.files;
    if (!inputFiles || inputFiles.length === 0) return;
    setError(null);
    setLoading(true);

    try {
      let idCounter = nextId;
      const newFiles: CompressedFile[] = [];
      let folderName = '';

      for (const f of Array.from(inputFiles)) {
        if (!f.type.startsWith('image/')) continue;
        if (!folderName && uploadMode === 'folder' && f.webkitRelativePath) {
          folderName = f.webkitRelativePath.split('/')[0];
        }
        const dataUrl = await new Promise<string>(resolve => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(f);
        });
        const name = f.name.replace(/\.[^.]+$/, '');
        newFiles.push({
          id: idCounter++,
          name,
          relativePath: uploadMode === 'folder' && f.webkitRelativePath
            ? f.webkitRelativePath.substring(f.webkitRelativePath.indexOf('/') + 1).replace(/\.[^.]+$/, '')
            : undefined,
          originalSize: f.size,
          compressedSize: 0,
          originalDataUrl: dataUrl,
          compressedDataUrl: '',
          format,
          quality,
          keptOriginal: false,
        });
      }

      if (newFiles.length === 0) {
        setError(lang === 'ar' ? 'لم يتم العثور على صور' : 'No images found');
        setLoading(false);
        return;
      }

      if (folderName) setRootFolderName(folderName);

      setFiles(prev => [...prev, ...newFiles]);
      setNextId(idCounter);
      setSelectedIds(prev => {
        const next = new Set(prev);
        newFiles.forEach(f => next.add(f.id));
        return next;
      });
    } catch {
      setError(lang === 'ar' ? 'فشل تحميل الصور' : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [nextId, format, quality, lang, uploadMode]);

  const compressAll = async () => {
    if (files.length === 0) return;
    setCompressing(true);
    try {
      const updated = await Promise.all(files.map(async (f) => {
        if (f.compressedDataUrl) return f;
        const { blob, dataUrl, keptOriginal } = await compressImage(f.originalDataUrl, f.originalSize);
        return { ...f, compressedSize: blob.size, compressedDataUrl: dataUrl, keptOriginal };
      }));
      setFiles(updated);
    } catch {
      setError(lang === 'ar' ? 'فشل الضغط' : 'Compression failed');
    } finally {
      setCompressing(false);
    }
  };

  const compressSingle = async (id: number) => {
    const file = files.find(f => f.id === id);
    if (!file || file.compressedDataUrl) return;
    try {
      const { blob, dataUrl, keptOriginal } = await compressImage(file.originalDataUrl, file.originalSize);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, compressedSize: blob.size, compressedDataUrl: dataUrl, keptOriginal } : f));
    } catch {
      setError(lang === 'ar' ? 'فشل ضغط الملف' : 'File compression failed');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const downloadSingle = (file: CompressedFile) => {
    const url = file.keptOriginal ? file.originalDataUrl : file.compressedDataUrl;
    if (!url) return;
    const ext = file.keptOriginal ? 'original' : format;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = async () => {
    const selected = files.filter(f => selectedIds.has(f.id) && (f.compressedDataUrl));
    if (selected.length === 0) return;

    if (selected.length === 1) {
      downloadSingle(selected[0]);
      return;
    }

    const zip = new JSZip();
    for (const f of selected) {
      const url = f.keptOriginal ? f.originalDataUrl : f.compressedDataUrl;
      const blob = await fetch(url).then(r => r.blob());
      const ext = f.keptOriginal ? 'original' : format;
      const zipPath = f.relativePath
        ? `${rootFolderName}/${f.relativePath}.${ext}`
        : `${f.name}.${ext}`;
      zip.file(zipPath, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = rootFolderName ? `${rootFolderName}_compressed.zip` : `compressed_images.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setFiles([]);
    setSelectedIds(new Set());
    setNextId(1);
    setError(null);
    setRootFolderName('');
  };

  const removeFile = (id: number) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

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

  const totalOriginalSize = files.reduce((s, f) => s + f.originalSize, 0);
  const totalEffectiveSize = files.reduce((s, f) => f.keptOriginal ? s + f.originalSize : s + f.compressedSize, 0);
  const allCompressed = files.length > 0 && files.every(f => f.compressedDataUrl);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-4 sm:py-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 sm:w-8 sm:h-8">
          <Percent size={14} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-white sm:text-sm">{lang === 'ar' ? 'ضغط الصور' : 'Image Compressor'}</h1>
          <p className="text-[8px] text-gray-500 font-mono sm:text-[9px]">{lang === 'ar' ? 'ضغط الصور مع الحفاظ على الجودة' : 'Compress images while preserving quality'}</p>
        </div>
      </div>

      <div className="flex border-b border-[#2D3139] bg-[#14171C] sm:hidden shrink-0">
        {[
          { id: 'upload', label: lang === 'ar' ? 'رفع' : 'Upload', icon: Upload },
          { id: 'files', label: lang === 'ar' ? 'صور' : 'Images', icon: FileImage },
          { id: 'export', label: lang === 'ar' ? 'تصدير' : 'Export', icon: FileDown },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id as any)}
            className={cn(
              "flex-1 py-2.5 flex flex-col items-center gap-1 font-mono text-[7px] uppercase tracking-widest transition-colors",
              mobileTab === tab.id ? "text-emerald-500 bg-[#1A1D23]" : "text-gray-500"
            )}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          "w-full sm:w-72 bg-[#14171C] border-r border-[#2D3139] flex flex-col shrink-0 overflow-y-auto",
          mobileTab === 'upload' || mobileTab === 'export' ? "flex" : "hidden sm:flex"
        )}>
          <div className={cn(mobileTab === 'upload' ? "block" : "hidden sm:block")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setUploadMode('files')}
                  className={cn(
                    "flex-1 py-1.5 text-[8px] font-mono uppercase tracking-wider rounded-md border transition-all",
                    uploadMode === 'files'
                      ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                      : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                  )}
                >
                  {lang === 'ar' ? 'ملفات' : 'Files'}
                </button>
                <button
                  onClick={() => setUploadMode('folder')}
                  className={cn(
                    "flex-1 py-1.5 text-[8px] font-mono uppercase tracking-wider rounded-md border transition-all",
                    uploadMode === 'folder'
                      ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                      : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                  )}
                >
                  {lang === 'ar' ? 'مجلد' : 'Folder'}
                </button>
              </div>
              <label className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-[#2D3139] rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors bg-[#0F1115]",
                files.length > 0 ? "border-emerald-500/30" : ""
              )}>
                {uploadMode === 'folder' ? (
                  <Upload size={20} className={files.length > 0 ? "text-emerald-500" : "text-gray-500"} />
                ) : (
                  <ImagePlus size={20} className={files.length > 0 ? "text-emerald-500" : "text-gray-500"} />
                )}
                <span className="text-[9px] font-mono text-gray-400 text-center leading-relaxed">
                  {files.length > 0
                    ? (uploadMode === 'folder'
                      ? (lang === 'ar' ? 'إضافة مجلد' : 'Add more folder')
                      : (lang === 'ar' ? 'إضافة صور' : 'Add more images'))
                    : (uploadMode === 'folder'
                      ? (lang === 'ar' ? 'اختر مجلد' : 'Select folder')
                      : (lang === 'ar' ? 'اختر صور' : 'Select images'))}
                </span>
                <span className="text-[7px] font-mono text-gray-600">
                  {uploadMode === 'folder'
                    ? (lang === 'ar' ? 'جميع الصور داخل المجلدات الفرعية' : 'All images in sub-folders')
                    : 'PNG, JPG, WebP'}
                </span>
                <input
                  ref={uploadMode === 'files' ? fileInputRef : folderInputRef}
                  type="file"
                  accept="image/*"
                  multiple={uploadMode === 'files'}
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>
              {rootFolderName && uploadMode === 'folder' && (
                <p className="text-[8px] font-mono text-emerald-400 mt-2 text-center truncate flex items-center justify-center gap-1">
                  <FolderOpen size={10} /> {rootFolderName}
                </p>
              )}
              {error && <p className="text-[8px] text-red-400 mt-2 font-mono">{error}</p>}
              {loading && (
                <div className="flex items-center gap-2 mt-3 text-[8px] text-gray-400 font-mono">
                  <Loader2 size={10} className="animate-spin" />
                  {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </div>
              )}
              {files.length > 0 && (
                <button onClick={clearAll} className="w-full mt-3 py-2 flex items-center justify-center gap-1.5 text-[8px] font-mono text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-500/50 rounded-md transition-all bg-red-950/20">
                  <Trash2 size={10} />
                  {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              )}
            </div>
          </div>

          <div className={cn("flex flex-col flex-1", mobileTab === 'export' ? "flex" : "hidden sm:flex")}>
            <div className="p-3 border-b border-[#2D3139] sm:p-4">
              <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 sm:text-[10px]">
                {lang === 'ar' ? 'الإعدادات' : 'Settings'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                    {lang === 'ar' ? 'الصيغة' : 'Format'}
                  </label>
                  <div className="flex gap-1 mt-1.5">
                    {(['jpeg', 'png', 'webp'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={cn(
                          "flex-1 py-2 text-[9px] font-mono uppercase tracking-wider rounded-md border transition-all sm:py-2.5",
                          format === f
                            ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                            : "bg-[#0F1115] border-[#2D3139] text-gray-500 hover:border-gray-500"
                        )}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider sm:text-[9px]">
                    {lang === 'ar' ? 'الجودة' : 'Quality'}: {quality}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="1"
                    value={quality}
                    onChange={e => setQuality(parseInt(e.target.value))}
                    className="w-full mt-1.5 accent-emerald-500"
                  />
                  <div className="flex justify-between text-[7px] font-mono text-gray-600 mt-1">
                    <span>50%</span>
                    <span className="text-emerald-500/70">{quality >= 90 ? (lang === 'ar' ? 'جودة عالية' : 'High quality') : ''}</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="p-3 border-b border-[#2D3139] sm:p-4">
                <div className="space-y-2 text-[8px] font-mono text-gray-500">
                  <div className="flex justify-between">
                    <span>{lang === 'ar' ? 'الملفات' : 'Files'}:</span>
                    <span>{files.length}</span>
                  </div>
                  {uploadMode === 'folder' && rootFolderName && (
                    <div className="flex justify-between">
                      <span>{lang === 'ar' ? 'المجلد' : 'Folder'}:</span>
                      <span className="text-gray-400 truncate max-w-[120px]">{rootFolderName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{lang === 'ar' ? 'الحجم الأصلي' : 'Original'}:</span>
                    <span className="text-gray-400">{formatBytes(totalOriginalSize)}</span>
                  </div>
                  {allCompressed && (
                    <>
                      <div className="flex justify-between">
                        <span>{lang === 'ar' ? 'بعد الضغط' : 'Result'}:</span>
                        <span className={cn(totalEffectiveSize < totalOriginalSize ? "text-emerald-400" : "text-red-400")}>{formatBytes(totalEffectiveSize)}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#2D3139] pt-2 mt-1">
                        <span className="text-gray-400">{lang === 'ar' ? 'التوفير' : 'Saved'}:</span>
                        <span className={cn("font-bold", totalEffectiveSize < totalOriginalSize ? "text-emerald-400" : "text-red-400")}>
                          {totalEffectiveSize < totalOriginalSize ? `-${((1 - totalEffectiveSize / totalOriginalSize) * 100).toFixed(1)}%` : (lang === 'ar' ? 'بدون توفير' : 'No savings')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="p-3 mt-auto space-y-2 sm:p-4">
              {!allCompressed && files.length > 0 && (
                <button
                  onClick={compressAll}
                  disabled={compressing}
                  className={cn(
                    "w-full py-3 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all sm:py-3.5",
                    "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
                  )}
                >
                  {compressing ? <Loader2 size={12} className="animate-spin" /> : <ArrowDownUp size={12} />}
                  {compressing
                    ? (lang === 'ar' ? 'جاري الضغط...' : 'Compressing...')
                    : (lang === 'ar' ? 'ضغط الكل' : 'Compress All')}
                </button>
              )}
              <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                <span>{lang === 'ar' ? 'المحدد' : 'Selected'}: {selectedIds.size}/{files.length}</span>
                <button onClick={toggleAll} className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
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
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
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
                <Percent size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-[10px] font-mono text-gray-600">
                  {lang === 'ar' ? 'اختر صور للبدء' : 'Select images to start'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3 text-[9px] font-mono text-gray-500">
                <FileImage size={12} />
                <span>{files.length} {lang === 'ar' ? 'صورة' : 'image'}{files.length !== 1 ? 's' : ''}</span>
                <span className="text-gray-700 mx-1">|</span>
                <span className="text-emerald-400/70">
                  {format.toUpperCase()} ({quality}%)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map(f => {
                  const savings = f.compressedSize ? ((1 - f.compressedSize / f.originalSize) * 100).toFixed(1) : null;
                  const bigger = f.keptOriginal;
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFile(f.id)}
                      className={cn(
                        "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group bg-white",
                        selectedIds.has(f.id)
                          ? bigger ? "border-red-500 shadow-lg shadow-red-500/20" : "border-emerald-500 shadow-lg shadow-emerald-500/20"
                          : "border-[#2D3139] hover:border-gray-500"
                      )}
                    >
                      <img src={f.originalDataUrl} alt={f.name} className="w-full h-auto" draggable={false} />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[8px] font-mono text-white truncate leading-tight">
                          {f.relativePath || f.name}
                        </p>
                        {f.relativePath && f.relativePath !== f.name && (
                          <p className="text-[6px] font-mono text-gray-500 truncate leading-tight">{f.name}</p>
                        )}
                        <div className="flex items-center gap-2 text-[7px] font-mono text-gray-400 mt-0.5">
                          <span>{formatBytes(f.originalSize)}</span>
                          {f.compressedSize > 0 && (
                            <>
                              <ArrowDownUp size={8} className={bigger ? "text-red-500" : "text-emerald-500"} />
                              {bigger ? (
                                <span className="text-red-400">{formatBytes(f.compressedSize)}</span>
                              ) : (
                                <span className="text-emerald-400">{formatBytes(f.compressedSize)}</span>
                              )}
                              {!bigger && <span className="text-emerald-500 font-bold">-{savings}%</span>}
                            </>
                          )}
                        </div>
                        {bigger && (
                          <p className="text-[6px] font-mono text-red-400 mt-0.5">
                            {lang === 'ar' ? 'تم الاحتفاظ بالأصلي' : 'Original kept'}
                          </p>
                        )}
                      </div>
                      <div className={cn(
                        "absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                        selectedIds.has(f.id) ? (bigger ? "bg-red-500" : "bg-emerald-500") : "bg-black/40 group-hover:bg-black/60"
                      )}>
                        {selectedIds.has(f.id) ? <CheckSquare size={12} className="text-white" /> : <Square size={12} className="text-white/60" />}
                      </div>
                      {!f.compressedDataUrl ? (
                        <button
                          onClick={e => { e.stopPropagation(); compressSingle(f.id); }}
                          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 hover:bg-emerald-600 text-white text-[7px] font-mono opacity-0 group-hover:opacity-100 transition-all"
                        >
                          {lang === 'ar' ? 'ضغط' : 'Compress'}
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); downloadSingle(f); }}
                          className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-emerald-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
