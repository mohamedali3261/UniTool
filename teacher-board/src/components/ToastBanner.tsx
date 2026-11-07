import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useBoard } from '../app/BoardContext';

export const ToastBanner: React.FC = () => {
  const { toast } = useBoard();
  if (!toast) return null;

  return (
    <div className="tb-toast" role="status" aria-live="polite">
      <CheckCircle2 size={15} />
      <span>{toast}</span>
    </div>
  );
};
