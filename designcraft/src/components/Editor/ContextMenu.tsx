import React, { useEffect, useRef } from 'react';
import { useDcLang } from '../../hooks/useDcLang';
import { 
  Copy, 
  Scissors, 
  ClipboardPaste, 
  Trash2, 
  CopyPlus, 
  ArrowUpToLine, 
  ArrowDownToLine,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export interface ContextMenuOptions {
  visible: boolean;
  x: number;
  y: number;
  hasSelection: boolean;
  hasClipboard: boolean;
}

interface ContextMenuProps {
  options: ContextMenuOptions;
  onClose: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  options,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward
}) => {
  const { t, lang } = useDcLang();

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Use capture to close immediately before other events
    if (options.visible) {
      document.addEventListener('mousedown', handleClickOutside, true);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [options.visible, onClose]);

  if (!options.visible) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-56 bg-[#0B132B]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ 
        top: `${options.y}px`, 
        left: `${options.x}px`,
        direction: 'ltr'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="p-1 space-y-0.5">
        <MenuItem 
          icon={<Copy className="w-4 h-4" />} 
          label={t.ctxCopy} 
          shortcut="Ctrl+C"
          disabled={!options.hasSelection}
          onClick={() => handleAction(onCopy)} 
        />
        <MenuItem 
          icon={<Scissors className="w-4 h-4" />} 
          label={t.ctxCut} 
          shortcut="Ctrl+X"
          disabled={!options.hasSelection}
          onClick={() => handleAction(onCut)} 
        />
        <MenuItem 
          icon={<ClipboardPaste className="w-4 h-4" />} 
          label={t.ctxPaste} 
          shortcut="Ctrl+V"
          disabled={!options.hasClipboard}
          onClick={() => handleAction(onPaste)} 
        />
        <MenuItem 
          icon={<CopyPlus className="w-4 h-4" />} 
          label={t.ctxDuplicate} 
          shortcut="Ctrl+D"
          disabled={!options.hasSelection}
          onClick={() => handleAction(onDuplicate)} 
        />
        
        <div className="h-px bg-slate-700/50 my-1 mx-2" />
        
        <MenuItem 
          icon={<ArrowUpToLine className="w-4 h-4" />} 
          label={t.ctxBringFront} 
          shortcut="]"
          disabled={!options.hasSelection}
          onClick={() => handleAction(onBringToFront)} 
        />
        <MenuItem 
          icon={<ChevronUp className="w-4 h-4" />} 
          label={t.ctxForward} 
          disabled={!options.hasSelection}
          onClick={() => handleAction(onBringForward)} 
        />
        <MenuItem 
          icon={<ChevronDown className="w-4 h-4" />} 
          label={t.ctxBackward} 
          disabled={!options.hasSelection}
          onClick={() => handleAction(onSendBackward)} 
        />
        <MenuItem 
          icon={<ArrowDownToLine className="w-4 h-4" />} 
          label={t.ctxSendBack} 
          shortcut="["
          disabled={!options.hasSelection}
          onClick={() => handleAction(onSendToBack)} 
        />
        
        <div className="h-px bg-slate-700/50 my-1 mx-2" />
        
        <MenuItem 
          icon={<Trash2 className="w-4 h-4" />} 
          label={t.ctxDelete} 
          shortcut="Del"
          variant="danger"
          disabled={!options.hasSelection}
          onClick={() => handleAction(onDelete)} 
        />
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, shortcut, variant = 'default', disabled, onClick }) => {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        disabled
          ? 'opacity-40 cursor-not-allowed text-slate-500'
          : variant === 'danger'
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
          : 'text-slate-300 hover:bg-sky-500/15 hover:text-sky-300'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span>{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] tracking-widest opacity-50 font-sans">
          {shortcut}
        </span>
      )}
    </button>
  );
};
