import { CheckCircle2, X } from 'lucide-react';

export function CalmToast({
  message,
  onDismiss,
  dismissLabel,
}: {
  message: string;
  onDismiss: () => void;
  dismissLabel: string;
}) {
  if (!message) return null;
  return (
    <div className="cv-calm-toast" role="status" aria-live="polite" data-testid="cv-calm-toast">
      <CheckCircle2 size={16} className="cv-toast-icon" aria-hidden="true" />
      <span>{message}</span>
      <button type="button" className="cv-icon-btn" onClick={onDismiss} aria-label={dismissLabel}>
        <X size={15} />
      </button>
    </div>
  );
}
