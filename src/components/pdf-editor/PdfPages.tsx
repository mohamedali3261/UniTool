import { FileText } from 'lucide-react';
import React from 'react';
import { Document, Page } from 'react-pdf';

interface Props {
  file: File | null;
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export const PdfPages: React.FC<Props> = ({ file, numPages, currentPage, onPageSelect }) => {
  if (!file) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <FileText size={12} className="text-blue-500" />
        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Pages</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from(new Array(numPages), (_, i) => (
          <button
            key={i}
            onClick={() => onPageSelect(i + 1)}
            className={`w-8 h-10 rounded text-[9px] font-mono font-bold transition-all border ${
              currentPage === i + 1
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-lg'
                : 'bg-[#0F1115] border-[#2D3139] text-gray-500 hover:text-gray-300 hover:border-gray-500/50'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
