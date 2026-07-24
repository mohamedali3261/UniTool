import { motion, AnimatePresence } from 'motion/react';
import { X as XIcon } from 'lucide-react';
import { mobileNavItems } from '../config/navigation';
import { cn } from '../lib/utils';

interface Props {
  open: boolean;
  lang: 'ar' | 'en';
  t: any;
  currentPage: string;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

export function MobileMenu({ open, lang, t, currentPage, onNavigate, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          >
            <div className="bg-[#14171C] rounded-t-2xl border-t border-[#2D3139] mx-2 shadow-2xl">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-1 rounded-full bg-[#2D3139]" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">{lang === 'ar' ? 'الصفحات' : 'Pages'}</span>
                <button onClick={onClose} className="p-1 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-full transition-colors">
                  <XIcon size={14} />
                </button>
              </div>
              
              {/* Grid */}
              <div className="px-4 pb-5 grid grid-cols-4 gap-3">
                {mobileNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onClose(); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                      currentPage === item.id
                        ? item.activeBg
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <item.icon size={18} className="text-white" />
                    </div>
                    <span className={`text-[8px] font-mono text-center leading-tight ${
                      currentPage === item.id ? 'text-white' : 'text-gray-400'
                    }`}>
                      {lang === 'ar' ? item.labelAr : item.labelEn}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Footer */}
              <div className="px-5 pb-4 pt-2 border-t border-[#2D3139]">
                <p className="text-[7px] font-mono text-gray-600 text-center">{t.title} v1.0</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
