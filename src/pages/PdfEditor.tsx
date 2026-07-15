import { useState, useCallback, useEffect } from 'react';
import { FileText, FileImage } from 'lucide-react';
import { PDFElement } from '../types/pdf';
import { fileToArrayBuffer, fileToDataURL } from '../utils/file-utils';
import { exportEditedPDF } from '../utils/pdf-export';
import { PdfEditorArea } from '../components/pdf-editor/PdfEditorArea';
import { PdfToolbar } from '../components/pdf-editor/PdfToolbar';
import { PdfProperties } from '../components/pdf-editor/PdfProperties';
import { PdfPages } from '../components/pdf-editor/PdfPages';
import { PDFDocument } from 'pdf-lib';

interface Props {
  t: any;
  lang: 'ar' | 'en';
}

export function PdfEditor({ t, lang }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [elements, setElements] = useState<PDFElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'properties'>('editor');

  useEffect(() => {
    if (elements.length > 0) {
      localStorage.setItem('pdf_editor_elements', JSON.stringify(elements));
    }
  }, [elements]);

  useEffect(() => {
    const saved = localStorage.getItem('pdf_editor_elements');
    if (saved) {
      try { setElements(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.type === 'application/pdf') {
      setFile(f);
      setSelectedElementId(null);
      setCurrentPage(1);
      setError(null);
    } else if (f.type.startsWith('image/')) {
      try {
        const dataUrl = await fileToDataURL(f);
        const img = new Image();
        img.onload = async () => {
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([img.width, img.height]);
          const buffer = await fileToArrayBuffer(f);
          const pdfImage = f.type === 'image/png' ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer);
          page.drawImage(pdfImage, { x: 0, y: 0, width: img.width, height: img.height });
          const pdfBytes = await pdfDoc.save();
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const newFile = new File([pdfBlob], f.name.replace(/\.[^/.]+$/, '') + '.pdf', { type: 'application/pdf' });
          setFile(newFile);
          setSelectedElementId(null);
          setCurrentPage(1);
          setError(null);
        };
        img.src = dataUrl;
      } catch (err) {
        setError(lang === 'ar' ? 'فشل تحويل الصورة إلى PDF' : 'Failed to convert image to PDF');
      }
    }
  };

  const handleAddText = useCallback(() => {
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: 100,
      y: 100,
      width: 250,
      height: 80,
      pageIndex: currentPage - 1,
      content: lang === 'ar' ? 'نص جديد' : 'New text',
      fontSize: 24,
      color: '#000000',
      fontWeight: 'bold',
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [currentPage, lang]);

  const handleAddTextAt = useCallback((x: number, y: number) => {
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: x - 125,
      y: y - 40,
      width: 250,
      height: 80,
      pageIndex: currentPage - 1,
      content: lang === 'ar' ? 'أضف نص هنا' : 'Add text here',
      fontSize: 24,
      color: '#000000',
      fontWeight: 'normal',
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [currentPage, lang]);

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const dataUrl = await fileToDataURL(f);
      const img = new Image();
      img.onload = () => {
        const newElement: PDFElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          x: 50,
          y: 50,
          width: img.width,
          height: img.height,
          pageIndex: currentPage - 1,
          src: dataUrl,
        };
        setElements(prev => [...prev, newElement]);
        setSelectedElementId(newElement.id);
      };
      img.src = dataUrl;
    }
    e.target.value = '';
  };

  const handleAddShape = useCallback((type: 'rectangle' | 'ellipse' | 'line') => {
    const isLine = type === 'line';
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 150,
      y: 150,
      width: isLine ? 200 : 150,
      height: isLine ? 4 : 150,
      pageIndex: currentPage - 1,
      backgroundColor: isLine ? '#000000' : 'transparent',
      borderColor: '#000000',
      borderWidth: isLine ? 0 : 4,
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  }, [currentPage]);

  const handleUpdateElement = (id: string, updates: Partial<PDFElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const handleDeleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElementId(prev => prev === id ? null : prev);
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index === -1) return prev;
      const newElements = [...prev];
      const element = newElements[index];
      if (direction === 'up' && index < newElements.length - 1) {
        newElements.splice(index, 1);
        newElements.splice(index + 1, 0, element);
      } else if (direction === 'down' && index > 0) {
        newElements.splice(index, 1);
        newElements.splice(index - 1, 0, element);
      }
      return newElements;
    });
  };

  const handleExport = async () => {
    if (!file) return;
    try {
      setIsExporting(true);
      const originalBuffer = await fileToArrayBuffer(file);
      const editedPdfBytes = await exportEditedPDF(originalBuffer, elements, pageWidth, pageHeight, pageRotations);
      const blob = new Blob([editedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited_${file.name}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(lang === 'ar' ? 'فشل التصدير' : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;
  const icon = !file ? FileText : FileImage;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C0F]">
      {/* Page Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] bg-[#0F1115]/50 shrink-0 sm:px-6 sm:py-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <FileText size={14} className="text-white sm:size-4" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-white sm:text-base">{lang === 'ar' ? 'تعديل PDF' : 'PDF Editor'}</h1>
          <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono">{lang === 'ar' ? 'إضافة نصوص وصور على ملفات PDF' : 'Add text, images & shapes to PDF files'}</p>
        </div>
      </div>

      {/* Toolbar */}
      <PdfToolbar
        onUpload={handleFileUpload}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onAddShape={handleAddShape}
        onExport={handleExport}
        hasFile={!!file}
        isExporting={isExporting}
        lang={lang}
      />

      {/* Mobile Tab Bar */}
      {file && (
        <div className="flex border-b border-[#2D3139] bg-[#14171C] shrink-0 lg:hidden">
          <button
            onClick={() => setMobileTab('editor')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'editor' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            <FileText size={14} />
            {lang === 'ar' ? 'المحرر' : 'Editor'}
          </button>
          <button
            onClick={() => setMobileTab('properties')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-wider transition-all ${
              mobileTab === 'properties' ? 'text-blue-400 bg-[#1A1D23] border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            <FileImage size={14} />
            {lang === 'ar' ? 'خصائص' : 'Properties'}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Page Navigator (sidebar) */}
        {file && (
          <div className="hidden lg:flex flex-col p-2 border-r border-[#2D3139] bg-[#14171C]">
            <PdfPages file={file} numPages={numPages} currentPage={currentPage} onPageSelect={setCurrentPage} />
          </div>
        )}

        {/* Center: Editor Area */}
        <div className={`flex-1 flex flex-col min-h-0 ${file ? (mobileTab === 'editor' ? 'flex' : 'hidden') : ''} lg:flex`}>
          <PdfEditorArea
            file={file}
            currentPage={currentPage}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onUpdateElement={handleUpdateElement}
            onAddTextAt={handleAddTextAt}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onPageDimensions={(w, h) => { setPageWidth(w); setPageHeight(h); }}
            pageRotation={pageRotations[currentPage - 1] || 0}
          />
        </div>

        {/* Right: Properties Panel */}
        <div className={`lg:w-64 border-t lg:border-t-0 lg:border-l border-[#2D3139] bg-[#14171C] flex-col ${file ? (mobileTab === 'properties' ? 'flex' : 'hidden') : 'hidden'} lg:flex`}>
          <PdfProperties
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onMoveLayer={handleMoveLayer}
            lang={lang}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-xl shadow-2xl border border-red-500/30 z-[100] flex items-center gap-3 text-[9px] font-mono">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="bg-white/20 hover:bg-white/30 rounded p-0.5">✕</button>
        </div>
      )}
    </div>
  );
}
