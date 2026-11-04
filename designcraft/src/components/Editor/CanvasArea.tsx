import { formatCanvasDimension, fittedInitialZoom } from '../../utils/mobilePerformance';
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
  const initialZoomPending = useRef<number | null>(null);

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

  // An unselected object must receive a completed click/tap before Fabric
  // may transform it on a subsequent gesture. First-drag always navigates.
  const pendingSelection = useRef<{ target: fabric.Object | null; x: number; y: number; moved: boolean } | null>(null);
  const artboardFrameRef = useRef<HTMLDivElement | null>(null);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const viewportFrame = useRef<number | null>(null);
  const pendingViewport = useRef<{ left: number; top: number; x: number; y: number } | null>(null);
  const pendingZoom = useRef<number | null>(null);
  // Latest event wins: navigation never re-renders React or Fabric per move.
  const flushViewport = () => {
    if (viewportFrame.current !== null) cancelAnimationFrame(viewportFrame.current);
    viewportFrame.current = null;
    const next = pendingViewport.current;
    pendingViewport.current = null;
    if (next && containerRef.current && artboardFrameRef.current) {
      containerRef.current.scrollLeft = next.left;
      containerRef.current.scrollTop = next.top;
      artboardFrameRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
    }
    if (pendingZoom.current !== null) {
      const nextZoom = pendingZoom.current;
      pendingZoom.current = null;
      setZoom(nextZoom);
    }
  };
  useEffect(() => () => {
    if (viewportFrame.current !== null) cancelAnimationFrame(viewportFrame.current);
    pendingViewport.current = null;
    pendingZoom.current = null;
  }, []);
  const panOrigin = useRef({ x: 0, y: 0, freeX: false, freeY: false });
  const beginViewportPan = () => {
    flushViewport();
    const el = containerRef.current!;
    panOrigin.current = { ...panOffsetRef.current, freeX: panOffsetRef.current.x !== 0 || el.scrollWidth <= el.clientWidth, freeY: panOffsetRef.current.y !== 0 || el.scrollHeight <= el.clientHeight };
  };
  const moveViewport = (left: number, top: number, dx: number, dy: number) => {
    if (pendingSelection.current && Math.hypot(dx, dy) > 6) pendingSelection.current.moved = true;
    const origin = panOrigin.current;

    const next = { x: origin.x + (origin.freeX ? dx : 0), y: origin.y + (origin.freeY ? dy : 0) };
    panOffsetRef.current = next;
    pendingViewport.current = { ...next, left: origin.freeX ? left : left - dx, top: origin.freeY ? top : top - dy };
    if (viewportFrame.current === null) viewportFrame.current = requestAnimationFrame(flushViewport);
  };

  // Pinch-to-zoom & Touch Pan refs
  const touchPanning = useRef(false);
  const wheelAnchor = useRef<{ x: number; y: number; worldX: number; worldY: number } | null>(null);
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

    const initialZoom = fittedInitialZoom(width, height, Math.max(40, (containerRef.current?.clientWidth || 400) - 40), Math.max(40, (containerRef.current?.clientHeight || 500) - 80));
    initialZoomPending.current = initialZoom;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: Math.round(width * initialZoom),
      height: Math.round(height * initialZoom),
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
    canvas.setZoom(initialZoom);
    setZoom(initialZoom);
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
        src: rawType === 'image' ? (active as fabric.Image).getSrc() : undefined,
        imageWidth: rawType === 'image' ? active.width : undefined,
        imageHeight: rawType === 'image' ? active.height : undefined,
        flipX: !!active.flipX,
        flipY: !!active.flipY,
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
        strokeDashArray: active.strokeDashArray || undefined,
        strokeUniform: active.strokeUniform,
        strokeLineCap: active.strokeLineCap,
        globalCompositeOperation: active.globalCompositeOperation,
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
      if (!(canvas as any).__studioInitializing) onLayersUpdate();
    });
    canvas.on('object:removed', () => {
      if ((canvas as any).__studioInitializing) return;
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

    return () => {
      alive = false;
      removeGuides();
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // 2. Global Event Listener to PREVENT ANY DRAG HANGING when mouse leaves canvas or window
  useEffect(() => {
    const handleGlobalRelease = (e: MouseEvent | TouchEvent | PointerEvent) => {
      flushViewport();
      setIsPanning(false);
      touchPanning.current = false;
      if (e.type === 'blur') setIsSpacePressed(false);
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      if (e.type === 'blur' || e.type === 'pointercancel' || e.type === 'touchcancel') pendingSelection.current = null;
      if (e.type === 'mouseup' || e.type === 'touchend') {
        const pending = pendingSelection.current;
        pendingSelection.current = null;
        const point = 'changedTouches' in e ? e.changedTouches[0] : e as MouseEvent;
        if (pending && point && !pending.moved && Math.hypot(point.clientX - pending.x, point.clientY - pending.y) <= 6) {
          if (pending.target && canvas.getObjects().includes(pending.target)) canvas.setActiveObject(pending.target);
          else if (!pending.target) canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }

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
    window.addEventListener('touchcancel', handleGlobalRelease, { passive: true });
    window.addEventListener('pointerup', handleGlobalRelease, { passive: true });
    window.addEventListener('pointercancel', handleGlobalRelease, { passive: true });
    window.addEventListener('blur', handleGlobalRelease);

    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('touchcancel', handleGlobalRelease);
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
    };
  }, []);

  // 3. Synchronize Canvas Dimensions and Fabric Zoom
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (initialZoomPending.current !== null) {
      if (zoom !== initialZoomPending.current) return;
      initialZoomPending.current = null;
    }
    canvas.setDimensions({
      width: Math.round(width * zoom),
      height: Math.round(height * zoom)
    });
    canvas.setZoom(zoom);
    canvas.renderAll();
    const anchor = wheelAnchor.current;
    if (anchor && containerRef.current) {
      const rect = canvas.upperCanvasEl.getBoundingClientRect();
      containerRef.current.scrollLeft += rect.left + anchor.worldX * zoom - anchor.x;
      containerRef.current.scrollTop += rect.top + anchor.worldY * zoom - anchor.y;
      wheelAnchor.current = null;
    }
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
      if ((e.target as HTMLElement).closest('button, input, textarea, select, #floating-object-hud')) return;
      if (!e.deltaY) return;
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.upperCanvasEl.getBoundingClientRect();
      wheelAnchor.current = { x: e.clientX, y: e.clientY, worldX: (e.clientX - rect.left) / canvas.getZoom(), worldY: (e.clientY - rect.top) / canvas.getZoom() };
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
        pendingSelection.current = null;
        e.preventDefault();
        e.stopPropagation();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        beginViewportPan();
        initialPinchDistRef.current = dist;
        initialZoomRef.current = fabricCanvasRef.current?.getZoom() || zoom;

        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        touchPanStartRef.current = {
          x: midX,
          y: midY,
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop
        };
      } else if (e.touches.length === 1) {
        const canvas = fabricCanvasRef.current;
        const target = canvas?.findTarget(e, false);
        if (!isPanMode && !isSpacePressed && target && target === canvas?.getActiveObject()) return;
        if (!isPanMode && !isSpacePressed) pendingSelection.current = { target: target || null, x: e.touches[0].clientX, y: e.touches[0].clientY, moved: false };
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        beginViewportPan();
        touchPanStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop
        };
        touchPanning.current = true;
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
        pendingZoom.current = newZoom;

        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        const dx = midX - touchPanStartRef.current.x;
        const dy = midY - touchPanStartRef.current.y;
        moveViewport(touchPanStartRef.current.scrollLeft, touchPanStartRef.current.scrollTop, dx, dy);
      } else if (e.touches.length === 1 && touchPanning.current) {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        const dx = touch.clientX - touchPanStartRef.current.x;
        const dy = touch.clientY - touchPanStartRef.current.y;
        moveViewport(touchPanStartRef.current.scrollLeft, touchPanStartRef.current.scrollTop, dx, dy);
      }
    };

    const handleTouchEnd = () => {
      flushViewport();
      initialPinchDistRef.current = null;
      touchPanning.current = false;
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
  }, [isPanMode, isSpacePressed, setZoom]);

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
    const canvas = fabricCanvasRef.current;
    const target = canvas?.findTarget(e.nativeEvent, false);
    if (isPanMode || isSpacePressed || e.button === 1 || (e.button === 0 && (!target || target !== canvas?.getActiveObject()))) {
      if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.button === 0 && !isPanMode && !isSpacePressed) pendingSelection.current = { target: target || null, x: e.clientX, y: e.clientY, moved: false };
      setIsPanning(true);
      if (containerRef.current) {
        beginViewportPan();
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
      moveViewport(panStartRef.current.scrollLeft, panStartRef.current.scrollTop, dx, dy);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };


  // Fit to screen helper
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    flushViewport();
    panOffsetRef.current = { x: 0, y: 0 };
    if (artboardFrameRef.current) artboardFrameRef.current.style.transform = 'translate3d(0, 0, 0)';
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
    <div id="canvas-workspace" className="relative flex-1 min-w-0 h-full overflow-hidden">
    <div
      ref={containerRef}
      id="canvas-area-container"
      title={lang==='ar'?'H لتحريك اللوحة، V للتحديد، مسافة مع السحب للتحريك مؤقتًا. عجلة الماوس للتكبير؛ اسحب المساحة الفارغة لتحريك اللوحة؛ Alt لتجاهل الالتقاط.':'H: pan; V: select; Space + drag: temporary pan. Wheel: zoom; drag empty space: pan; Alt: bypass snapping.'}
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
        backgroundSize: '20px 20px',
        overscrollBehavior: 'contain',
        touchAction: 'none'
      }}
    >
      {/* Artboard Frame & Canvas Container */}
      <div ref={artboardFrameRef} className="m-auto shrink-0 flex flex-col items-center justify-center" style={{ willChange: 'transform' }}>
        <div data-testid="canvas-size-label" className="text-[10px] font-mono text-slate-400 mb-1 tracking-wider whitespace-nowrap">
          {t.caCanvasLabel} <bdi dir="ltr">({formatCanvasDimension(width)} × {formatCanvasDimension(height)} px)</bdi>
        </div>

        <div
          id="fabric-canvas-artboard-wrapper"
          className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] rounded-md overflow-hidden bg-white ring-2 ring-sky-500/20 transition-shadow hover:shadow-[0_30px_70px_-15px_rgba(56,189,248,0.2)] touch-none"
        >
          <canvas ref={canvasRef} />
          {overlays}
        </div>
      </div>

    </div>
      {/* Outside the scrolling/transforming viewport: controls stay docked. */}
      <div
        id="floating-zoom-pill"
        role="group"
        aria-label={lang === 'ar' ? 'تكبير وعرض اللوحة' : 'Canvas zoom controls'}
        className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#1C2541]/95 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl text-xs max-w-[calc(100%-16px)] whitespace-nowrap"
        style={{ bottom: 'calc(var(--canvas-controls-bottom, 64px) + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.1, +(z - 0.1).toFixed(2)))}
          className="min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-35 disabled:cursor-not-allowed"
          title={t.caZoomOut}
          aria-label={t.caZoomOut}
          disabled={zoom <= .1}
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono font-bold text-sky-400 px-1 text-[11px] min-w-[38px] sm:min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.1).toFixed(2)))}
          className="min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-35 disabled:cursor-not-allowed"
          title={t.caZoomIn}
          aria-label={t.caZoomIn}
          disabled={zoom >= 3}
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-slate-700 mx-0.5 sm:mx-1" />

        <button
          type="button"
          onClick={fitToScreen}
          className="min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 p-1 text-slate-300 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-[11px] font-medium"
          title={t.caFitScreen}
          aria-label={t.caFitScreen}
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">{t.caFitLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => setZoom(1)}
          className="min-h-9 sm:min-h-0 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded font-mono transition"
          title={t.caActualSize}
        >
          100%
        </button>
      </div>
    </div>
  );
};
