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

/** Logo splash: original dark background, compact centered logo */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0C0F] overflow-hidden flex items-center justify-center">
      <img
        src="/UniTool_logo.png"
        alt="UniTool"
        draggable={false}
        className="w-40 h-40 sm:w-56 sm:h-56 object-contain"
      />
    </div>
  );
}
