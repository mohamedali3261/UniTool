import { Download, Image as ImageIcon, Plus, Type, Upload, FileImage, ChevronDown, Frame, Shapes, Square, Circle, Minus, RotateCw } from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToolbarProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddText: () => void;
  onAddImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddFrame: () => void;
  onAddShape: (type: 'rectangle' | 'ellipse' | 'line') => void;
  onRotatePage: () => void;
  onExport: () => void;
  onExportImage: () => void;
  onExportImagePng: () => void;
  hasFile: boolean;
  isExporting: boolean;
  isExportingImage: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onUpload,
  onAddText,
  onAddImage,
  onAddFrame,
  onAddShape,
  onRotatePage,
  onExport,
  onExportImage,
  onExportImagePng,
  hasFile,
  isExporting,
  isExportingImage,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  return (
    <div className="h-16 border-b border-white/20 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-6 group transition-all duration-300 transform hover:scale-105">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30 shadow-lg group-hover:rotate-6 transition-transform">
            <span className="text-white font-black text-lg italic pointer-events-none">X</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-white text-md tracking-wider leading-none">COLOR</h1>
            <span className="text-[8px] text-white/70 font-bold uppercase tracking-[0.2em]">Editor Pro</span>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all text-xs font-bold shadow-soft"
        >
          <Upload size={14} className="text-cyan-300" />
          <span>Upload</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onUpload}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />
        </button>

        {hasFile && (
          <>
            <div className="h-6 w-[1px] bg-white/20 mx-1" />
            
            <button
              onClick={onAddText}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 rounded-xl transition-all text-xs font-bold shadow-lg hover:shadow-indigo-400/30 hover:-translate-y-0.5"
            >
              <Type size={14} className="group-hover:rotate-12 transition-transform" />
              <span>Text</span>
            </button>

            <button
              onClick={() => imageInputRef.current?.click()}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all text-xs font-bold"
            >
              <ImageIcon size={14} className="text-yellow-300 group-hover:scale-110 transition-transform" />
              <span>Logo</span>
              <input
                type="file"
                ref={imageInputRef}
                onChange={onAddImage}
                accept="image/*"
                className="hidden"
              />
            </button>

            <button
              onClick={onAddFrame}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-pink-400/20 hover:bg-pink-400/30 text-white border border-white/20 rounded-xl transition-all text-xs font-bold shadow-inner"
            >
              <Frame size={14} className="text-pink-300 group-hover:rotate-45 transition-transform" />
              <span>Frame</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShapeMenu(!showShapeMenu)}
                className="group flex items-center gap-1.5 px-3 py-1.5 bg-green-400/20 hover:bg-green-400/30 text-white border border-white/20 rounded-xl transition-all text-xs font-bold shadow-inner"
              >
                <Shapes size={14} className="text-green-300 group-hover:rotate-12 transition-transform" />
                <span>Shape</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showShapeMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showShapeMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowShapeMenu(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-2"
                    >
                      <button
                        onClick={() => {
                          onAddShape('rectangle');
                          setShowShapeMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 rounded-xl transition-colors text-left group"
                      >
                        <div className="w-6 h-6 bg-green-50 text-green-600 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Square size={14} />
                        </div>
                        <span className="text-xs font-black text-gray-800">Rectangle</span>
                      </button>
                      <button
                        onClick={() => {
                          onAddShape('ellipse');
                          setShowShapeMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 rounded-xl transition-colors text-left group"
                      >
                        <div className="w-6 h-6 bg-green-50 text-green-600 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Circle size={14} />
                        </div>
                        <span className="text-xs font-black text-gray-800">Circle</span>
                      </button>
                      <button
                        onClick={() => {
                          onAddShape('line');
                          setShowShapeMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 rounded-xl transition-colors text-left group"
                      >
                        <div className="w-6 h-6 bg-green-50 text-green-600 rounded flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Minus size={14} />
                        </div>
                        <span className="text-xs font-black text-gray-800">Line</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={onRotatePage}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-white border border-white/20 rounded-xl transition-all text-xs font-bold shadow-inner"
              title="Rotate current page 90° Clockwise"
            >
              <RotateCw size={14} className="text-amber-300 group-hover:rotate-90 transition-transform duration-300" />
              <span>Rotate Page</span>
            </button>
          </>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={!hasFile || isExporting || isExportingImage}
          className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl transition-all text-xs font-black disabled:opacity-50 shadow-2xl border border-white/10"
        >
          {(isExporting || isExportingImage) ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Download size={14} className="text-pink-400" />
          )}
          <span>{isExporting || isExportingImage ? 'Processing...' : 'Export'}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowExportMenu(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-2"
              >
                <button
                  onClick={() => {
                    onExport();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group"
                >
                  <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Download size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-800">Export as PDF</span>
                    <span className="text-[9px] text-gray-400 font-bold lowercase">High quality document</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportImage();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group"
                >
                  <div className="w-8 h-8 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileImage size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-800">Export as JPG</span>
                    <span className="text-[9px] text-gray-400 font-bold lowercase">High resolution image</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    onExportImagePng();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 rounded-xl transition-colors text-left group"
                >
                  <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileImage size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-800">Export as PNG</span>
                    <span className="text-[9px] text-gray-400 font-bold lowercase">Transparent or standard image</span>
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

