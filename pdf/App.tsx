/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Toolbar } from './components/Toolbar';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { EditorArea } from './components/EditorArea';
import { PDFElement, PDFFileState } from './types';
import { fileToArrayBuffer, fileToDataURL } from './lib/utils';
import { exportEditedPDF } from './utils/pdf-utils';
import { toJpeg, toPng } from 'html-to-image';

export default function App() {
  const [state, setState] = useState<PDFFileState>({
    file: null,
    numPages: 0,
    currentPage: 1,
    elements: [],
    selectedElementId: null,
    loading: false,
    error: null,
    pageRotations: {},
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  // Auto-save effect
  useEffect(() => {
    if (state.elements.length > 0) {
      localStorage.setItem('pdf_editor_elements', JSON.stringify(state.elements));
    }
  }, [state.elements]);

  // Load saved elements on mount
  useEffect(() => {
    const saved = localStorage.getItem('pdf_editor_elements');
    if (saved) {
      try {
        const elements = JSON.parse(saved);
        setState(prev => ({ ...prev, elements }));
      } catch (e) {
        console.error('Failed to load saved elements', e);
      }
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setState(prev => ({
        ...prev,
        file,
        selectedElementId: null,
        currentPage: 1,
        error: null,
      }));
    } else if (file.type.startsWith('image/')) {
      try {
        const dataUrl = await fileToDataURL(file);
        const img = new Image();
        img.onload = async () => {
          const pdfDoc = await PDFDocument.create();
          const page = pdfDoc.addPage([img.width, img.height]);
          
          let pdfImage;
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            const buffer = await fileToArrayBuffer(file);
            pdfImage = await pdfDoc.embedJpg(buffer);
          } else if (file.type === 'image/png') {
            const buffer = await fileToArrayBuffer(file);
            pdfImage = await pdfDoc.embedPng(buffer);
          }
          
          if (pdfImage) {
            page.drawImage(pdfImage, {
              x: 0,
              y: 0,
              width: img.width,
              height: img.height,
            });
          }
          
          const pdfBytes = await pdfDoc.save();
          const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
          const newFile = new File([pdfBlob], file.name.replace(/\.[^/.]+$/, "") + ".pdf", { type: 'application/pdf' });
          
          setState(prev => ({
            ...prev,
            file: newFile,
            selectedElementId: null,
            currentPage: 1,
            error: null,
          }));
        };
        img.src = dataUrl;
      } catch (err) {
        console.error("Failed to convert image to PDF", err);
        setState(prev => ({ ...prev, error: 'Failed to open image.' }));
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
      pageIndex: state.currentPage - 1,
      content: 'نص جديد (Add text)',
      fontSize: 24,
      color: '#000000',
      fontWeight: 'bold',
    };
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
  }, [state.currentPage]);

  const handleAddTextAt = useCallback((x: number, y: number) => {
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: x - 125,
      y: y - 40,
      width: 250,
      height: 80,
      pageIndex: state.currentPage - 1,
      content: 'أضف نص هنا',
      fontSize: 24,
      color: '#000000',
      fontWeight: 'normal',
    };
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
  }, [state.currentPage]);
  
  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataURL(file);
      const img = new Image();
      img.onload = () => {
        const newElement: PDFElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          x: 50,
          y: 50,
          width: img.width,
          height: img.height,
          pageIndex: state.currentPage - 1,
          src: dataUrl,
        };
        setState(prev => ({
          ...prev,
          elements: [...prev.elements, newElement],
          selectedElementId: newElement.id,
        }));
      };
      img.src = dataUrl;
    }
    e.target.value = '';
  };

  const handleAddFrame = useCallback(() => {
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image', // We'll treat it as a graphics element, or repurpose text with border
      x: 50,
      y: 50,
      width: 500,
      height: 740,
      pageIndex: state.currentPage - 1,
      borderWidth: 20,
      borderColor: '#6366f1', // Indigo border
      src: 'https://cdn-icons-png.flaticon.com/512/121/121703.png', // A generic logo placeholder
    };
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
  }, [state.currentPage]);

  const handleAddShape = useCallback((type: 'rectangle' | 'ellipse' | 'line') => {
    const isLine = type === 'line';
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 150,
      y: 150,
      width: isLine ? 200 : 150,
      height: isLine ? 4 : 150,
      pageIndex: state.currentPage - 1,
      backgroundColor: isLine ? '#000000' : 'transparent',
      borderColor: '#000000',
      borderWidth: isLine ? 0 : 4,
    };
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
  }, [state.currentPage]);

  const handleUpdateElement = (id: string, updates: Partial<PDFElement>) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el => (el.id === id ? { ...el, ...updates } : el)),
    }));
  };

  const handleDeleteElement = (id: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      selectedElementId: prev.selectedElementId === id ? null : prev.selectedElementId,
    }));
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    setState(prev => {
      const index = prev.elements.findIndex(el => el.id === id);
      if (index === -1) return prev;
      
      const newElements = [...prev.elements];
      const element = newElements[index];
      
      if (direction === 'up' && index < newElements.length - 1) {
        newElements.splice(index, 1);
        newElements.splice(index + 1, 0, element);
      } else if (direction === 'down' && index > 0) {
        newElements.splice(index, 1);
        newElements.splice(index - 1, 0, element);
      }
      
      return { ...prev, elements: newElements };
    });
  };

  const handleRotatePage = useCallback(() => {
    setState(prev => {
      const pageIndex = prev.currentPage - 1;
      const currentRotation = prev.pageRotations?.[pageIndex] || 0;
      const newRotation = (currentRotation + 90) % 360;
      return {
        ...prev,
        pageRotations: {
          ...(prev.pageRotations || {}),
          [pageIndex]: newRotation,
        }
      };
    });
  }, [state.currentPage]);

  const handleExport = async () => {
    if (!state.file) return;

    try {
      setIsExporting(true);
      const originalBuffer = await fileToArrayBuffer(state.file);
      const editedPdfBytes = await exportEditedPDF(originalBuffer, state.elements, state.pageWidth, state.pageHeight, state.pageRotations);
      
      const blob = new Blob([editedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${state.file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      setState(prev => ({ ...prev, error: 'Failed to export PDF. Please try again.' }));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    const node = document.getElementById('editor-canvas');
    if (!node) return;

    try {
      setIsExportingImage(true);
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // scale=1 ensures the exported image matches the exact original dimensions of the uploaded file
      const scale = 1;
      const dataUrl = await toJpeg(node, { 
        quality: 1.0,
        pixelRatio: 1, 
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: node.offsetWidth * scale,
        height: node.offsetHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: node.offsetWidth + 'px',
          height: node.offsetHeight + 'px'
        }
      });
      
      const link = document.createElement('a');
      const baseName = state.file ? state.file.name.replace(/\.[^/.]+$/, "") : `exported_page_${state.currentPage}`;
      link.download = `${baseName}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image export failed:', err);
      setState(prev => ({ ...prev, error: 'Failed to export Image.' }));
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportImagePng = async () => {
    const node = document.getElementById('editor-canvas');
    if (!node) return;

    try {
      setIsExportingImage(true);
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // scale=1 ensures the exported image matches the exact original dimensions of the uploaded file
      const scale = 1;
      const dataUrl = await toPng(node, { 
        pixelRatio: 1, 
        cacheBust: true,
        width: node.offsetWidth * scale,
        height: node.offsetHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: node.offsetWidth + 'px',
          height: node.offsetHeight + 'px'
        }
      });
      
      const link = document.createElement('a');
      const baseName = state.file ? state.file.name.replace(/\.[^/.]+$/, "") : `exported_page_${state.currentPage}`;
      link.download = `${baseName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Image export failed:', err);
      setState(prev => ({ ...prev, error: 'Failed to export Image.' }));
    } finally {
      setIsExportingImage(false);
    }
  };

  const selectedElement = state.elements.find(el => el.id === state.selectedElementId) || null;

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 overflow-hidden font-sans">
      <Toolbar
        onUpload={handleFileUpload}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onAddFrame={handleAddFrame}
        onAddShape={handleAddShape}
        onRotatePage={handleRotatePage}
        onExport={handleExport}
        onExportImage={handleExportImage}
        onExportImagePng={handleExportImagePng}
        hasFile={!!state.file}
        isExporting={isExporting}
        isExportingImage={isExportingImage}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:flex flex-col bg-gray-50/50">
          <SidebarLeft
            file={state.file}
            numPages={state.numPages}
            currentPage={state.currentPage}
            onPageSelect={(page) => setState(prev => ({ ...prev, currentPage: page }))}
          />
        </div>

        <EditorArea
          file={state.file}
          currentPage={state.currentPage}
          elements={state.elements}
          selectedElementId={state.selectedElementId}
          onSelectElement={(id) => setState(prev => ({ ...prev, selectedElementId: id }))}
          onUpdateElement={handleUpdateElement}
          onAddTextAt={handleAddTextAt}
          onLoadSuccess={({ numPages }) => setState(prev => ({ ...prev, numPages }))}
          onPageDimensions={(width, height) => setState(prev => ({ ...prev, pageWidth: width, pageHeight: height }))}
          pageRotation={state.pageRotations?.[state.currentPage - 1] || 0}
        />

        <div className="hidden md:flex flex-col border-l border-gray-100">
          <SidebarRight
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onMoveLayer={handleMoveLayer}
          />
        </div>
      </div>

      {state.error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-3xl shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 z-[100] flex items-center gap-4">
          <span className="font-bold">{state.error}</span>
          <button 
             onClick={() => setState(prev => ({ ...prev, error: null }))}
             className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

