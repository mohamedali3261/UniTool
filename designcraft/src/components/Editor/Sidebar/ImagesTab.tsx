import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Smartphone,
  Search
} from 'lucide-react';
import { useDcLang } from '../../../hooks/useDcLang';

interface ImagesTabProps {
  onAddImage: (url: string) => void;
  onOpenPexelsModal?: () => void;
  onAddMobileMockup?: () => void;
}

export const ImagesTab: React.FC<ImagesTabProps> = ({
  onAddImage,
  onOpenPexelsModal,
  onAddMobileMockup
}) => {
  const { t } = useDcLang();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (url) {
          setUploadedImages((prev) => [url, ...prev]);
          onAddImage(url);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-0.5">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>{t.imagesLibrary}</span>
        </h3>
        <p className="text-[11px] text-slate-400">
          {t.imagesDesc}
        </p>
      </div>

      {/* 1. Main Primary Button: Open Full Photo Library Modal */}
      {onOpenPexelsModal && (
        <button
          type="button"
          onClick={onOpenPexelsModal}
          className="group w-full p-4 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white font-bold shadow-lg hover:shadow-sky-500/20 transition flex flex-col items-center justify-center gap-2 text-center border border-sky-400/30"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition">
            <Search className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black flex items-center justify-center gap-1.5">
              <span>{t.imagesLibrary}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </div>
            <div className="text-[10px] text-sky-200 font-normal mt-0.5">
              {t.imagesClickToAdd}
            </div>
          </div>
        </button>
      )}

      {/* 2. Mobile Phone Mockup Button */}
      {onAddMobileMockup && (
        <button
          type="button"
          onClick={onAddMobileMockup}
          className="w-full p-3 rounded-xl bg-[#0B132B] hover:bg-[#152042] border border-slate-700 hover:border-sky-500 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
        >
          <Smartphone className="w-4 h-4 text-sky-400" />
          <span>{t.imagesPhoneMockup}</span>
        </button>
      )}

      {/* 3. Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-3.5 rounded-2xl border-2 border-dashed border-sky-500/30 hover:border-sky-400 bg-[#0B132B] hover:bg-[#151e36] cursor-pointer transition text-center space-y-1.5 group shadow-sm"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="w-8 h-8 rounded-xl bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto transition">
          <UploadCloud className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-white group-hover:text-sky-300">
            {t.imagesUpload}
          </div>
          <div className="text-[10px] text-slate-400">PNG, JPG, WebP, SVG</div>
        </div>
      </div>

      {/* 4. Uploaded Images Section */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>{t.imagesUploaded} ({uploadedImages.length})</span>
            <button
              onClick={() => setUploadedImages([])}
              className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> {t.imagesClearAll}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {uploadedImages.map((imgUrl, i) => (
              <div
                key={i}
                onClick={() => onAddImage(imgUrl)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-700 hover:border-sky-400 cursor-pointer transition shadow-sm"
              >
                <img src={imgUrl} alt="Uploaded" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white bg-sky-600 px-2 py-1 rounded-md">
                    {t.imagesAddMore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
