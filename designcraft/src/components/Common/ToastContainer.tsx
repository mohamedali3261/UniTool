import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  // Auto-dismiss after 2 seconds (2000ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border text-xs backdrop-blur-md max-w-xs select-none ${
        toast.type === 'success'
          ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
          : toast.type === 'error'
          ? 'bg-rose-950/95 border-rose-500/50 text-rose-100'
          : toast.type === 'warning'
          ? 'bg-amber-950/95 border-amber-500/50 text-amber-100'
          : 'bg-slate-900/95 border-sky-500/50 text-slate-100'
      }`}
    >
      <div className="shrink-0">
        {toast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
        {toast.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
        {toast.type === 'info' && <Info className="w-3.5 h-3.5 text-sky-400" />}
      </div>

      <div className="flex-1 min-w-0 font-semibold text-xs truncate">
        {toast.title}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white transition p-0.5 rounded hover:bg-white/10 shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="toast-container"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-50 flex flex-col space-y-2 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
