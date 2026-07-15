import { Layout, ScrollText } from 'lucide-react';
import React from 'react';
import { Document, Page } from 'react-pdf';

interface SidebarLeftProps {
  file: File | null;
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  file,
  numPages,
  currentPage,
  onPageSelect,
}) => {
  return (
    <div className="w-64 border-r border-gray-100 bg-gray-50/30 flex flex-col h-[calc(100vh-80px)] overflow-hidden shrink-0">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-white">
        <Layout size={18} className="text-indigo-500" />
        <span className="font-bold text-gray-800 text-sm uppercase tracking-widest">Navigator</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {!file ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
               <ScrollText size={32} className="text-gray-200" />
            </div>
            <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Waiting for file...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`thumbnail_${index + 1}`}
                onClick={() => onPageSelect(index + 1)}
                className={`cursor-pointer group relative rounded-2xl border-2 transition-all overflow-hidden bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  currentPage === index + 1
                    ? 'border-indigo-500 ring-4 ring-indigo-500/10'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="pointer-events-none transform scale-[0.4] origin-top-left -mb-[60%] -mr-[60%]">
                  <Document file={file}>
                    <Page 
                      pageNumber={index + 1} 
                      width={280} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                    />
                  </Document>
                </div>
                <div className={`absolute bottom-0 inset-x-0 py-2 px-3 text-[10px] font-black uppercase tracking-widest border-t transition-colors ${
                  currentPage === index + 1 ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white/90 backdrop-blur-sm text-gray-400 border-gray-100'
                }`}>
                  <span>Page {index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
