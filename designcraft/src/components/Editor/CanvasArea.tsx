import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { ActiveObjectProperties } from '../../types';
import { initFabricDefaults } from '../../utils/fabricHelpers';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  AlignCenter,
  Sliders
} from 'lucide-react';

interface CanvasAreaProps {
  width: number;
  height: number;
  backgroundColor: string;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  showGrid: boolean;
  isPanMode?: boolean;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onSelectionChange: (props: ActiveObjectProperties | null) => void;
  onLayersUpdate: () => void;
  onRecordHistory: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onOpenProperties?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  width,
  height,
  backgroundColor,
  zoom,
  setZoom,
  showGrid,
  isPanMode,
  onCanvasReady,
  onSelectionChange,
  onLayersUpdate,
  onRecordHistory,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onSave,
  onOpenProperties,
  onContextMenu
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const [hasSelection, setHasSelection] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  });

  // Pinch-to-zoom & Touch Pan refs
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(zoom);
  const touchPanStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  });


  // 1. Initialize Fabric Canvas with High-DPI & No-Hanging Safeguards
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    initFabricDefaults();

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: width * zoom,
      height: height * zoom,
      backgroundColor: backgroundColor || '#FFFFFF',
      preserveObjectStacking: true,
      selection: true,
      stopContextMenu: true,
      fireRightClick: true,
      enableRetinaScaling: true, // Crisp rendering on high-DPI/Retina screens without pixelation
      imageSmoothingEnabled: true
    });

    canvas.setZoom(zoom);
    fabricCanvasRef.current = canvas;
    onCanvasReady(canvas);

    const updateSelection = () => {
      const active = canvas.getActiveObject();
      if (!active) {
        setHasSelection(false);
        setSelectedType('');
        setIsLocked(false);
        onSelectionChange(null);
        return;
      }

      setHasSelection(true);
      const rawType = active.type || 'object';
      setSelectedType(rawType);
      setIsLocked(!!(active.lockMovementX || active.lockMovementY));

      const isText = rawType === 'textbox' || rawType === 'text' || rawType === 'i-text';
      const textObj = isText ? (active as fabric.Textbox) : null;
      const rectObj = rawType === 'rect' ? (active as fabric.Rect) : null;

      const props: ActiveObjectProperties = {
        type: rawType,
        left: Math.round(active.left || 0),
        top: Math.round(active.top || 0),
        width: Math.round((active.width || 0) * (active.scaleX || 1)),
        height: Math.round((active.height || 0) * (active.scaleY || 1)),
        scaleX: active.scaleX || 1,
        scaleY: active.scaleY || 1,
        angle: Math.round(active.angle || 0),
        opacity: active.opacity ?? 1,
        fill: (typeof active.fill === 'string' ? active.fill : '#0F172A') || '',
        stroke: (typeof active.stroke === 'string' ? active.stroke : '') || '',
        strokeWidth: active.strokeWidth || 0,
        lockMovementX: active.lockMovementX,
        lockMovementY: active.lockMovementY,
        lockRotation: active.lockRotation,
        lockScalingX: active.lockScalingX,
        lockScalingY: active.lockScalingY,
        fontSize: textObj ? textObj.fontSize : undefined,
        fontFamily: textObj ? textObj.fontFamily : undefined,
        fontWeight: textObj ? textObj.fontWeight : undefined,
        fontStyle: textObj ? textObj.fontStyle : undefined,
        textAlign: textObj ? textObj.textAlign : undefined,
        lineHeight: textObj ? textObj.lineHeight : undefined,
        charSpacing: textObj ? textObj.charSpacing : undefined,
        underline: textObj ? textObj.underline : undefined,
        linethrough: textObj ? textObj.linethrough : undefined,
        textBackgroundColor: textObj ? textObj.textBackgroundColor : undefined,
        rx: rectObj ? rectObj.rx : undefined,
        ry: rectObj ? rectObj.ry : undefined,
        hasBorders: active.hasBorders !== false,
        hasControls: active.hasControls !== false,
        clipCornerTL: (active as any).clipCornerTL ?? 0,
        clipCornerTR: (active as any).clipCornerTR ?? 0,
        clipCornerBR: (active as any).clipCornerBR ?? 0,
        clipCornerBL: (active as any).clipCornerBL ?? 0,
        cropTop: (active as any).cropTop ?? 0,
        cropBottom: (active as any).cropBottom ?? 0,
        cropLeft: (active as any).cropLeft ?? 0,
        cropRight: (active as any).cropRight ?? 0,
        fadeTop: (active as any).fadeTop ?? 0,
        fadeBottom: (active as any).fadeBottom ?? 0,
        fadeLeft: (active as any).fadeLeft ?? 0,
        fadeRight: (active as any).fadeRight ?? 0,
        fadeRadial: (active as any).fadeRadial ?? 0
      };

      onSelectionChange(props);
    };

    canvas.on('selection:created', updateSelection);
    canvas.on('selection:updated', updateSelection);
    canvas.on('selection:cleared', () => {
      setHasSelection(false);
      onSelectionChange(null);
    });
    canvas.on('object:modified', () => {
      updateSelection();
      onLayersUpdate();
      onRecordHistory();
    });
    canvas.on('object:added', () => {
      onLayersUpdate();
    });
    canvas.on('object:removed', () => {
      onLayersUpdate();
      onRecordHistory();
    });
    
    // Select object on right click so context menu operates on it
    canvas.on('mouse:down', (opt) => {
      if (opt.button === 3) {
        if (opt.target) {
          canvas.setActiveObject(opt.target);
          canvas.requestRenderAll();
        }
        if (onContextMenu) {
          onContextMenu(opt.e as MouseEvent);
        }
      }
    });

    // Auto-fit initial zoom calculation
    setTimeout(() => {
      if (containerRef.current) {
        const cWidth = containerRef.current.clientWidth - 40;
        const cHeight = containerRef.current.clientHeight - 80;
        const scaleX = cWidth / width;
        const scaleY = cHeight / height;
        const autoZoom = Math.min(scaleX, scaleY, 0.90);
        setZoom(Math.max(0.15, Math.min(+autoZoom.toFixed(2), 1)));
      }
    }, 80);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // 2. Global Event Listener to PREVENT ANY DRAG HANGING when mouse leaves canvas or window
  useEffect(() => {
    const handleGlobalRelease = (e: MouseEvent | TouchEvent | PointerEvent) => {
      setIsPanning(false);
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // If Fabric was mid-drag or mid-transform when cursor exited canvas bounds, safely finish it
      if ((canvas as any)._currentTransform) {
        try {
          if (typeof (canvas as any)._onMouseUp === 'function') {
            (canvas as any)._onMouseUp(e);
          }
        } catch (err) {
          (canvas as any)._currentTransform = null;
        }
        canvas.renderAll();
      }
    };

    window.addEventListener('mouseup', handleGlobalRelease, { passive: true });
    window.addEventListener('touchend', handleGlobalRelease, { passive: true });
    window.addEventListener('pointerup', handleGlobalRelease, { passive: true });
    window.addEventListener('pointercancel', handleGlobalRelease, { passive: true });
    window.addEventListener('blur', handleGlobalRelease);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
    };
  }, []);

  // 3. Synchronize Canvas Dimensions and Fabric Zoom
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.setDimensions({
      width: Math.round(width * zoom),
      height: Math.round(height * zoom)
    });
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [width, height, zoom]);

  // 4. Update Canvas Background Color
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.setBackgroundColor(backgroundColor || '#FFFFFF', () => {
      canvas.renderAll();
    });
  }, [backgroundColor]);

  // 5. Smooth Pointer-Centered Mouse Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setZoom((prev) => {
        const next = Math.max(0.1, Math.min(3.0, +(prev + delta).toFixed(2)));
        return next;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  // 6. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onDuplicate();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const canvas = fabricCanvasRef.current;
        if (canvas && canvas.getActiveObject()) {
          const active = canvas.getActiveObject();
          if (active && (active as any).isEditing) return;
          e.preventDefault();
          onDelete();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, onUndo, onRedo, onDuplicate, onSave, onDelete]);

  // 7. Touch Pinch-to-Zoom & Touch Pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        initialPinchDistRef.current = dist;
        initialZoomRef.current = zoom;

        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        touchPanStartRef.current = {
          x: midX,
          y: midY,
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop
        };
      } else if (e.touches.length === 1 && (isPanMode || isSpacePressed)) {
        const touch = e.touches[0];
        touchPanStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop
        };
        setIsPanning(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scale = dist / initialPinchDistRef.current;
        const newZoom = Math.max(0.15, Math.min(3.0, +(initialZoomRef.current * scale).toFixed(2)));
        setZoom(newZoom);

        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        const dx = midX - touchPanStartRef.current.x;
        const dy = midY - touchPanStartRef.current.y;
        container.scrollLeft = touchPanStartRef.current.scrollLeft - dx;
        container.scrollTop = touchPanStartRef.current.scrollTop - dy;
      } else if (e.touches.length === 1 && (isPanning || isPanMode || isSpacePressed)) {
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - touchPanStartRef.current.x;
        const dy = touch.clientY - touchPanStartRef.current.y;
        container.scrollLeft = touchPanStartRef.current.scrollLeft - dx;
        container.scrollTop = touchPanStartRef.current.scrollTop - dy;
      }
    };

    const handleTouchEnd = () => {
      initialPinchDistRef.current = null;
      setIsPanning(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [zoom, isPanMode, isSpacePressed, isPanning, setZoom]);

  // 8. Mouse Pan dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode || isSpacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      if (containerRef.current) {
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          scrollLeft: containerRef.current.scrollLeft,
          scrollTop: containerRef.current.scrollTop
        };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      e.preventDefault();
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };


  // Fit to screen helper
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const cWidth = containerRef.current.clientWidth - 40;
    const cHeight = containerRef.current.clientHeight - 80;
    const scaleX = cWidth / width;
    const scaleY = cHeight / height;
    const autoZoom = Math.min(scaleX, scaleY, 0.92);
    setZoom(Math.max(0.15, Math.min(+autoZoom.toFixed(2), 1)));
  }, [width, height, setZoom]);

  // Quick Action Handlers
  const handleQuickAlignCenter = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.center();
      active.setCoords();
      canvas.renderAll();
      onRecordHistory();
    }
  };

  const handleQuickBringForward = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringForward(active);
      canvas.renderAll();
      onLayersUpdate();
      onRecordHistory();
    }
  };

  const handleQuickSendBackward = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.sendBackwards(active);
      canvas.renderAll();
      onLayersUpdate();
      onRecordHistory();
    }
  };

  const handleQuickToggleLock = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const next = !active.lockMovementX;
    active.set({
      lockMovementX: next,
      lockMovementY: next,
      lockRotation: next,
      lockScalingX: next,
      lockScalingY: next
    });
    canvas.renderAll();
    setIsLocked(next);
    onLayersUpdate();
    onRecordHistory();
  };

  return (
    <div
      ref={containerRef}
      id="canvas-area-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`flex-1 h-full overflow-auto bg-[#070D1E] flex items-center justify-center p-3 sm:p-8 pb-20 md:pb-8 relative select-none ${
        isPanMode || isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{
        backgroundImage: showGrid
          ? 'radial-gradient(rgba(56, 189, 248, 0.25) 1.5px, transparent 1.5px)'
          : 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Floating Smart Action Bar for Selected Object */}
      {hasSelection && (
        <div
          id="floating-object-hud"
          className="absolute top-2.5 sm:top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 sm:gap-1 bg-[#1C2541]/95 backdrop-blur-md px-2 py-1 rounded-2xl border border-sky-500/40 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 max-w-[95vw] overflow-x-auto no-scrollbar"
        >
          <span className="text-[10px] font-bold text-sky-400 px-1 sm:px-1.5 uppercase font-mono tracking-wider max-w-[70px] sm:max-w-[80px] truncate">
            {selectedType}
          </span>

          <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

          {/* Quick Properties Toggle (Great on Mobile) */}
          {onOpenProperties && (
            <button
              type="button"
              onClick={onOpenProperties}
              title="تعديل الخصائص والألوان"
              className="p-1 sm:p-1.5 text-amber-300 hover:text-amber-200 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-[11px] font-bold"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الخصائص</span>
            </button>
          )}

          {/* Duplicate */}
          <button
            type="button"
            onClick={onDuplicate}
            title="تكرار العنصر (Ctrl+D)"
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Center */}
          <button
            type="button"
            onClick={handleQuickAlignCenter}
            title="توسيط في الكانفاس"
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          {/* Bring Forward */}
          <button
            type="button"
            onClick={handleQuickBringForward}
            title="تحريك للأمام"
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
          </button>

          {/* Send Backward */}
          <button
            type="button"
            onClick={handleQuickSendBackward}
            title="تحريك للخلف"
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
          </button>

          {/* Lock */}
          <button
            type="button"
            onClick={handleQuickToggleLock}
            title={isLocked ? 'فك القفل' : 'قفل العنصر'}
            className={`p-1 sm:p-1.5 rounded-lg transition ${
              isLocked
                ? 'text-amber-400 bg-amber-950/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <div className="h-3.5 w-px bg-slate-700 mx-0.5" />

          {/* Delete */}
          <button
            type="button"
            onClick={onDelete}
            title="حذف (Delete)"
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Artboard Frame & Canvas Container */}
      <div className="flex flex-col items-center justify-center">
        <div className="text-[10px] font-mono text-slate-400 mb-1 tracking-wider">
          لوحة التصميم ({width} × {height} px)
        </div>

        <div
          id="fabric-canvas-artboard-wrapper"
          className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] rounded-md overflow-hidden bg-white ring-2 ring-sky-500/20 transition-shadow hover:shadow-[0_30px_70px_-15px_rgba(56,189,248,0.2)] touch-none"
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Floating Bottom Control Pill (Mobile Safe above bottom nav) */}
      <div
        id="floating-zoom-pill"
        className="absolute bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#1C2541]/95 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl text-xs"
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.1, +(z - 0.1).toFixed(2)))}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="تصغير (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono font-bold text-sky-400 px-1 text-[11px] min-w-[38px] sm:min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.1).toFixed(2)))}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="تكبير (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-slate-700 mx-0.5 sm:mx-1" />

        <button
          type="button"
          onClick={fitToScreen}
          className="p-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-[11px] font-medium"
          title="ملاءمة أبعاد الشاشة"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">ملاءمة</span>
        </button>

        <button
          type="button"
          onClick={() => setZoom(1)}
          className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-mono transition"
          title="الحجم الفعلي 100%"
        >
          100%
        </button>
      </div>
    </div>
  );
};
