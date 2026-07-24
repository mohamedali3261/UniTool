import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ErrorScreenProps {
  error: string;
}

export function ErrorScreen({ error }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center p-6 text-center" dir="rtl">
      <div className="max-w-md w-full bg-[#1A1D23] border border-red-900/30 p-8 rounded-sm">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
        <h2 className="text-white font-mono text-lg mb-2">SYSTEM_FAILURE</h2>
        <p className="text-gray-500 text-[10px] font-mono uppercase mb-6 leading-relaxed">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full py-3 bg-red-600 text-white font-mono text-[10px] hover:bg-red-700">Reboot</button>
      </div>
    </div>
  );
}

interface LoadingScreenProps {
  lang: 'ar' | 'en';
  t: any;
}

export function LoadingScreen({ lang, t }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#0A0C0F] flex items-center justify-center font-mono" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center flex flex-col items-center justify-center px-6">
        <img src="/UniTool_logo.png" alt="UniTool Logo" className="w-64 h-64 sm:w-80 sm:h-80 object-contain" />

        {/* Equalizer Bars */}
        <div className="flex gap-1 justify-center h-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: ["20%", "100%", "20%"] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 rounded-full"
              style={{
                background: `linear-gradient(to top, #6366f1, #a855f7, #ec4899)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
