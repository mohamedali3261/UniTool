import { shortcutKey } from '../../utils/keyboard';
import {applyTextFit} from '../../advanced/core/text';
import {installAlignmentGuides} from '../../utils/alignmentGuides';
import {resetEmptyText,normalTextFill} from '../../utils/textReset';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDcLang } from '../../hooks/useDcLang';
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
  onPanModeChange?: (pan: boolean) => void;
  overlays?:React.ReactNode;
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
  isPanMode, onPanModeChange,
  onCanvasReady,overlays,
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
  const { t, lang } = useDcLang();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const [hasSelection, setHasSelection] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const nudgedRef = useRef(false);
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
      targetFindTolerance: 2,
      stopContextMenu: true,
      fireRightClick: true,
      enableRetinaScaling: true, // Crisp rendering on high-DPI/Retina screens without pixelation
      imageSmoothingEnabled: true
    });

    let alive = true;
    canvas.setZoom(zoom);
    fabricCanvasRef.current = canvas;
    const removeGuides=installAlignmentGuides(canvas);
    canvas.on('text:changed',(event:any)=>{applyTextFit(event.target);if(resetEmptyText(event.target,normalTextFill(canvas.backgroundColor))){canvas.requestRenderAll();onLayersUpdate();onRecordHistory();}});
    onCanvasReady(canvas);

    // Re-render once webfonts finish loading so canvas text uses real glyph metrics
    document.fonts?.ready.then(() => {
      if (alive) canvas.requestRenderAll();
    }).catch(() => { /* ignore */ });

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
        text: textObj?.text ?? undefined,
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

    canvas.on('text:changed', updateSelection);
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
    canvas.on('object:added', (event) => {
      if (event.target) event.target.padding = 0;
      if (event.target?.type === 'image') event.target.perPixelTargetFind = true;
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
    const fitTimer = setTimeout(() => {
      if (alive && containerRef.current) {
        const cWidth = containerRef.current.clientWidth - 40;
        const cHeight = containerRef.current.clientHeight - 80;
        const scaleX = cWidth / width;
        const scaleY = cHeight / height;
        const autoZoom = Math.min(scaleX, scaleY, 0.90);
        setZoom(Math.max(0.15, Math.min(+autoZoom.toFixed(2), 1)));
      }
    }, 80);

    return () => {
      alive = false;
      clearTimeout(fitTimer);
      removeGuides();
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // 2. Global Event Listener to PREVENT ANY DRAG HANGING when mouse leaves canvas or window
  useEffect(() => {
    const handleGlobalRelease = (e: MouseEvent | TouchEvent | PointerEvent) => {
      setIsPanning(false);
      if (e.type === 'blur') setIsSpacePressed(false);
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
      if (!e.ctrlKey && !e.metaKey) return; // Normal wheel/trackpad scrolls; Ctrl+wheel zooms.
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
  // Undo/redo/duplicate/delete live in EditorLayout's global handler — handling
  // them here as well made every Ctrl+Z undo two steps and Ctrl+D duplicate twice.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]'))return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.isComposing) return;
      const key = shortcutKey(e);
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
        if (key === 'h') onPanModeChange?.(true);
        if (key === 'v') onPanModeChange?.(false);
      }
      if (e.code === 'Space' && target.tagName !== 'BUTTON') {
        e.preventDefault();
        if (!isSpacePressed) setIsSpacePressed(true);
      }
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        onSave();
      }
      if ((e.ctrlKey || e.metaKey) && key === 'a') {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const objects = canvas.getObjects().filter((obj:any) => obj.visible !== false&&obj.selectable!==false&&!obj.locked);
        if (objects.length === 0) return;
        e.preventDefault();
        const selection = new fabric.ActiveSelection(objects, { canvas });
        canvas.setActiveObject(selection);
        canvas.requestRenderAll();
      }
      if (e.key.startsWith('Arrow') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const canvas = fabricCanvasRef.current;
        const active = canvas?.getActiveObject();
        if (!canvas || !active) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft'&&!active.lockMovementX) active.left = (active.left || 0) - step;
        else if (e.key === 'ArrowRight'&&!active.lockMovementX) active.left = (active.left || 0) + step;
        else if (e.key === 'ArrowUp'&&!active.lockMovementY) active.top = (active.top || 0) - step;
        else if (e.key === 'ArrowDown'&&!active.lockMovementY) active.top = (active.top || 0) + step;
        active.setCoords();
        canvas.requestRenderAll();
        nudgedRef.current = true;
      }
      if (e.key === 'Escape') {
        const canvas = fabricCanvasRef.current;
        if (canvas && canvas.getActiveObject()) {
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
      if (e.key.startsWith('Arrow') && nudgedRef.current) {
        nudgedRef.current = false;
        onRecordHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, onSave, onRecordHistory, onPanModeChange]);

  // 7. Touch Pinch-to-Zoom & Touch Pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
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
        e.preventDefault();
        e.stopPropagation();
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
        e.stopPropagation();
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
        e.stopPropagation();
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

    container.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart, true);
      container.removeEventListener('touchmove', handleTouchMove, true);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [zoom, isPanMode, isSpacePressed, isPanning, setZoom]);

  // Panning must never hit-test or transform artwork underneath the hand.
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const pan = !!(isPanMode || isSpacePressed);
    canvas.skipTargetFind = pan;
    canvas.selection = !pan;
    canvas.defaultCursor = pan ? 'grab' : 'default';
    canvas.hoverCursor = pan ? 'grab' : 'move';
  }, [isPanMode, isSpacePressed]);

  // 8. Mouse Pan dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode || isSpacePressed || e.button === 1) {
      if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
      e.preventDefault();
      e.stopPropagation();
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
      // Center in DESIGN space (canvas.getCenter() returns zoomed viewport units)
      active.setPositionByOrigin(new fabric.Point(width / 2, height / 2), 'center', 'center');
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
      locked: next,
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
      title={lang==='ar'?'H لتحريك اللوحة، V للتحديد، مسافة مع السحب للتحريك مؤقتًا. Ctrl مع عجلة الماوس للتكبير؛ Alt لتجاهل الالتقاط.':'H: pan; V: select; Space + drag: temporary pan. Ctrl + wheel: zoom; Alt: bypass snapping.'}
      onMouseDownCapture={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`flex-1 h-full overflow-auto bg-[#070D1E] flex items-start justify-start p-3 sm:p-8 pb-20 md:pb-8 relative select-none ${
        isPanMode || isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{
        backgroundImage: showGrid
          ? 'radial-gradient(rgba(56, 189, 248, 0.25) 1.5px, transparent 1.5px)'
          : 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      <div className="absolute bottom-3 start-3 z-30 flex items-center gap-1 rounded-xl border border-slate-600 bg-slate-900 p-1 text-xs text-white" role="group" aria-label={lang === 'ar' ? 'أدوات التحريك والتحديد' : 'Canvas tools'}>
        <button type="button" aria-pressed={!isPanMode} onClick={() => onPanModeChange?.(false)} className={`rounded-lg px-2 py-2 ${!isPanMode ? 'bg-sky-600' : ''}`} title={lang === 'ar' ? 'تحديد العناصر (V)' : 'Select objects (V)'}>{lang === 'ar' ? 'تحديد' : 'Select'}</button>
        <button type="button" aria-pressed={!!isPanMode} onClick={() => onPanModeChange?.(true)} className={`rounded-lg px-2 py-2 ${isPanMode ? 'bg-sky-600' : ''}`} title={lang === 'ar' ? 'سحب اللوحة (H) أو اضغط مسافة مؤقتًا' : 'Pan canvas (H), or hold Space temporarily'}>{lang === 'ar' ? 'تحريك اللوحة' : 'Pan'}</button>
      </div>
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
              title={t.caPropsTitle}
              className="p-1 sm:p-1.5 text-amber-300 hover:text-amber-200 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-[11px] font-bold"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.caProps}</span>
            </button>
          )}

          {/* Duplicate */}
          <button
            type="button"
            onClick={onDuplicate}
            title={t.caDuplicateTitle}
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Center */}
          <button
            type="button"
            onClick={handleQuickAlignCenter}
            title={t.caCenterTitle}
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          {/* Bring Forward */}
          <button
            type="button"
            onClick={handleQuickBringForward}
            title={t.caForwardTitle}
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
          </button>

          {/* Send Backward */}
          <button
            type="button"
            onClick={handleQuickSendBackward}
            title={t.caBackwardTitle}
            className="p-1 sm:p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
          </button>

          {/* Lock */}
          <button
            type="button"
            onClick={handleQuickToggleLock}
            title={isLocked ? t.caUnlock : t.caLock}
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
            title={t.caDeleteTitle}
            className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Artboard Frame & Canvas Container */}
      <div className="m-auto shrink-0 flex flex-col items-center justify-center">
        <div className="text-[10px] font-mono text-slate-400 mb-1 tracking-wider">
          {t.caCanvasLabel} ({width} × {height} px)
        </div>

        <div
          id="fabric-canvas-artboard-wrapper"
          className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] rounded-md overflow-hidden bg-white ring-2 ring-sky-500/20 transition-shadow hover:shadow-[0_30px_70px_-15px_rgba(56,189,248,0.2)] touch-none"
        >
          <canvas ref={canvasRef} />
          {overlays}
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
          title={t.caZoomOut}
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
          title={t.caZoomIn}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-slate-700 mx-0.5 sm:mx-1" />

        <button
          type="button"
          onClick={fitToScreen}
          className="p-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-[11px] font-medium"
          title={t.caFitScreen}
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">{t.caFitLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => setZoom(1)}
          className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-mono transition"
          title={t.caActualSize}
        >
          100%
        </button>
      </div>
    </div>
  );
};
