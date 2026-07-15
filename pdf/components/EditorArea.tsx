import { motion } from 'motion/react';
import React from 'react';
import { Document, Page } from 'react-pdf';
import { PDFElement } from '../types';

interface EditorAreaProps {
  file: File | null;
  currentPage: number;
  elements: PDFElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<PDFElement>) => void;
  onAddTextAt: (x: number, y: number) => void;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onPageDimensions: (width: number, height: number) => void;
  pageRotation?: number;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  file,
  currentPage,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddTextAt,
  onLoadSuccess,
  onPageDimensions,
  pageRotation = 0,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = React.useState({ width: 0, height: 0 });

  const handlePageLoadSuccess = (page: any) => {
    const { width, height } = page.getViewport({ scale: 1 });
    setPageSize({ width, height });
    onPageDimensions(width, height);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (selectedElementId) {
        onSelectElement(null);
      }
    }
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-auto p-8 min-h-0 relative" ref={containerRef}>
      {!file ? (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
             <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-blue-500 font-bold text-2xl">PDF</span>
             </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">No PDF Loaded</h2>
          <p className="text-gray-400 mt-2">Upload a PDF file from the toolbar to start editing</p>
        </div>
      ) : (
        <div 
          className="relative shadow-2xl shadow-gray-400/50 shrink-0 mx-auto" 
          ref={pageRef} 
          id="editor-canvas"
          style={{ width: pageSize.width || 'auto', height: pageSize.height || 'auto' }}
        >
          <Document 
            file={file} 
            onLoadSuccess={onLoadSuccess}
            loading={<div className="w-[595px] h-[842px] bg-white animate-pulse" />}
          >
            <Page
              pageNumber={currentPage}
              onLoadSuccess={handlePageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              renderMode="canvas"
              rotate={pageRotation}
              className="rounded-sm overflow-hidden"
            />
          </Document>

          <div className="absolute inset-0 z-10 cursor-crosshair" onClick={handleOverlayClick}>
            {elements
              .filter((el) => el.pageIndex === currentPage - 1)
              .map((el) => (
                <DraggableElement
                  key={el.id}
                  element={el}
                  isSelected={selectedElementId === el.id}
                  onSelect={() => onSelectElement(el.id)}
                  onUpdate={(updates) => onUpdateElement(el.id, updates)}
                  pageWidth={pageSize.width}
                  pageHeight={pageSize.height}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface DraggableElementProps {
  element: PDFElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PDFElement>) => void;
  pageWidth: number;
  pageHeight: number;
}

const DraggableElement: React.FC<DraggableElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  pageWidth,
  pageHeight,
}) => {
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startItemX = element.x;
    const startItemY = element.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newX = Math.max(0, Math.min(pageWidth - element.width, startItemX + deltaX));
      const newY = Math.max(0, Math.min(pageHeight - element.height, startItemY + deltaY));
      
      onUpdate({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;
    const startXPos = element.x;
    const startYPos = element.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let updates: Partial<PDFElement> = {};

      if (direction.includes('e')) {
        updates.width = Math.max(10, startWidth + deltaX);
      }
      if (direction.includes('s')) {
        updates.height = Math.max(10, startHeight + deltaY);
      }
      if (direction.includes('w')) {
        const newWidth = Math.max(10, startWidth - deltaX);
        if (newWidth !== startWidth) {
           updates.width = newWidth;
           updates.x = startXPos + (startWidth - newWidth);
        }
      }
      if (direction.includes('n')) {
        const newHeight = Math.max(10, startHeight - deltaY);
        if (newHeight !== startHeight) {
          updates.height = newHeight;
          updates.y = startYPos + (startHeight - newHeight);
        }
      }

      if (element.type === 'image' && updates.width) {
         const aspectRatio = startWidth / startHeight;
         const newH = updates.width / aspectRatio;
         if (direction.includes('n')) {
             updates.y = startYPos + (startHeight - newH);
         }
         updates.height = newH;
      }

      onUpdate(updates);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: element.y,
        left: element.x,
        width: element.width,
        height: element.height,
        cursor: 'move',
        zIndex: isSelected ? 30 : 20,
        rotate: element.rotation || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        border: element.borderWidth ? `${element.borderWidth}px solid ${element.borderColor || '#000'}` : 'none',
        filter: element.filter || 'none',
      }}
      onMouseDown={handleDragStart}
    >
      <div 
        className={`w-full h-full relative group ${isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300'}`}
        style={{
          color: element.color,
          fontSize: `${element.fontSize}px`,
          fontWeight: element.fontWeight,
          fontFamily: 'sans-serif', // We can improve this
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          wordBreak: 'break-word',
          direction: 'auto', // Handles Arabic/English
          backgroundColor: element.backgroundColor,
          borderRadius: element.type === 'ellipse' ? '50%' : '0',
        }}
      >
        {element.type === 'text' ? (
          <div className="w-full h-full p-1 whitespace-pre-wrap flex items-center justify-center text-center select-none">
            {element.content}
          </div>
        ) : element.type === 'image' ? (
          <img 
            src={element.src} 
            alt="logo" 
            className="w-full h-full pointer-events-none select-none block" 
            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
            draggable={false}
          />
        ) : null}

        {/* Resize Handles */}
        {isSelected && (
          <>
            <div 
               className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white rounded-full cursor-se-resize z-40 shadow-lg hover:scale-125 transition-transform" 
               onMouseDown={(e) => handleResize(e, 'se')}
            />
            <div 
               className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white rounded-full cursor-ne-resize z-40 shadow-lg hover:scale-125 transition-transform" 
               onMouseDown={(e) => handleResize(e, 'ne')}
            />
            <div 
               className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white rounded-full cursor-sw-resize z-40 shadow-lg hover:scale-125 transition-transform" 
               onMouseDown={(e) => handleResize(e, 'sw')}
            />
            <div 
               className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-white rounded-full cursor-nw-resize z-40 shadow-lg hover:scale-125 transition-transform" 
               onMouseDown={(e) => handleResize(e, 'nw')}
            />
          </>
        )}
      </div>
    </motion.div>
  );
};
