import { useEffect } from 'react';

/**
 * Resolves physical key letter using KeyboardEvent.code first (`KeyZ` -> `'z'`, `KeyY` -> `'y'`, `KeyS` -> `'s'`),
 * ensuring Ctrl/Cmd+Z and Ctrl/Cmd+Y work identically on Arabic (`ئ`, `غ`) and English (`z`, `y`) keyboards.
 */
export function resolvePhysicalKey(event: Pick<KeyboardEvent, 'code' | 'key'>): string {
  if (typeof event.code === 'string' && /^Key[A-Z]$/.test(event.code)) {
    return event.code.slice(3).toLowerCase();
  }
  return (event.key || '').toLowerCase();
}

export function useStudioShortcuts(handlers: {
  onUndo: () => void;
  onRedo: () => void;
  onSaveProject: () => void;
}): void {
  const { onUndo, onRedo, onSaveProject } = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.altKey) return;
      if (!(e.ctrlKey || e.metaKey)) return;

      const key = resolvePhysicalKey(e);
      if (key !== 'z' && key !== 'y' && key !== 's') return;

      if (key === 's') {
        e.preventDefault();
        onSaveProject();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isTextControl = Boolean(
        target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable),
      );
      if (isTextControl) return;

      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
      } else if (key === 'y') {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onUndo, onRedo, onSaveProject]);
}
