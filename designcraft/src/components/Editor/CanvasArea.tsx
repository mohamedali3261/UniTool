import { CanvasImageCrop } from './CanvasImageCrop';
import type {CropInsets} from '../../utils/imageCrop';
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
  cropRequest: number;
  onApplyCrop: (crop: CropInsets) => void;
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
  cropRequest, onApplyCrop,
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
  const artboardWrapperRef = useRef<HTMLDivElement | null>(null);
  const zoomReadoutRef = useRef<HTMLSpanElement | null>(null);
  const liveZoomRef = useRef<number>(zoom);
  const interactiveZoomRafRef = useRef<number | null>(null);
  const zoomCommitTimerRef = useRef<number | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width, height });
  sizeRef.current = { width, height };
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const viewportFrame = useRef<number | null>(null);
  const pendingViewport = useRef<{ left: number; top: number; x: number; y: number } | null>(null);
  const pendingZoom = useRef<number | null>(null);

  const scheduleInteractiveZoom = useCallback(
    (nextZoom: number, anchor?: { x: number; y: number; worldX: number; worldY: number } | null) => {
      const clamped = Math.max(0.1, Math.min(3.0, +nextZoom.toFixed(3)));
      liveZoomRef.current = clamped;
      if (anchor) wheelAnchor.current = anchor;

      if (interactiveZoomRafRef.current === null) {
        interactiveZoomRafRef.current = requestAnimationFrame(() => {
          interactiveZoomRafRef.current = null;
          const canvas = fabricCanvasRef.current;
          const z = liveZoomRef.current;
          const { width: w, height: h } = sizeRef.current;
          if (zoomReadoutRef.current) {
            zoomReadoutRef.current.textContent = `${Math.round(z * 100)}%`;
          }
          if (canvas && canvas.upperCanvasEl) {
            const cssW = Math.max(1, Math.round(w * z));
            const cssH = Math.max(1, Math.round(h * z));
            canvas.setDimensions({ width: `${cssW}px`, height: `${cssH}px` }, { cssOnly: true });
            if (artboardWrapperRef.current) {
              artboardWrapperRef.current.style.width = `${cssW}px`;
              artboardWrapperRef.current.style.height = `${cssH}px`;
            }
            const curAnchor = wheelAnchor.current;
            if (curAnchor && containerRef.current) {
              const newRect = canvas.upperCanvasEl.getBoundingClientRect();
              containerRef.current.scrollLeft += newRect.left + curAnchor.worldX * z - curAnchor.x;
              containerRef.current.scrollTop += newRect.top + curAnchor.worldY * z - curAnchor.y;
              wheelAnchor.current = null;
            }
          }
        });
      }

      if (zoomCommitTimerRef.current !== null) {
        window.clearTimeout(zoomCommitTimerRef.current);
      }
      zoomCommitTimerRef.current = window.setTimeout(() => {
        zoomCommitTimerRef.current = null;
        const committed = Math.max(0.1, Math.min(3.0, +liveZoomRef.current.toFixed(2)));
        setZoom(committed);
      }, 90);
    },
    [setZoom]
  );

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
      scheduleInteractiveZoom(nextZoom);
    }
  };
  useEffect(() => () => {
    if (viewportFrame.current !== null) cancelAnimationFrame(viewportFrame.current);
    if (interactiveZoomRafRef.current !== null) cancelAnimationFrame(interactiveZoomRafRef.current);
    if (zoomCommitTimerRef.current !== null) window.clearTimeout(zoomCommitTimerRef.current);
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
      imageSmoothingEnabled: true,
      defaultCursor: 'var(--ut-cursor-default, default)',
      hoverCursor: 'var(--ut-cursor-move, move)',
      moveCursor: 'var(--ut-cursor-grabbing, grabbing)',
      freeDrawingCursor: 'var(--ut-cursor-crosshair, crosshair)',
      rotationCursor: 'var(--ut-cursor-grab, crosshair)',
      notAllowedCursor: 'var(--ut-cursor-not-allowed, not-allowed)',
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

  // 3. Synchronize Canvas Dimensions and Fabric Zoom (Bounded High-DPI Backstore)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (initialZoomPending.current !== null) {
      if (zoom !== initialZoomPending.current) return;
      initialZoomPending.current = null;
    }

    if (zoomCommitTimerRef.current !== null) {
      window.clearTimeout(zoomCommitTimerRef.current);
      zoomCommitTimerRef.current = null;
    }
    liveZoomRef.current = zoom;
    if (zoomReadoutRef.current) {
      zoomReadoutRef.current.textContent = `${Math.round(zoom * 100)}%`;
    }

    const MAX_BACKSTORE_EDGE = 3200;
    const cssW = Math.max(1, Math.round(width * zoom));
    const cssH = Math.max(1, Math.round(height * zoom));
    const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
    const useRetina = Math.max(cssW, cssH) * dpr <= MAX_BACKSTORE_EDGE;
    (canvas as any).enableRetinaScaling = useRetina;
    const maxLogicalEdge = useRetina ? Math.floor(MAX_BACKSTORE_EDGE / dpr) : MAX_BACKSTORE_EDGE;
    const fabricZoom = Math.min(zoom, maxLogicalEdge / Math.max(1, width, height));
    const backW = Math.max(1, Math.round(width * fabricZoom));
    const backH = Math.max(1, Math.round(height * fabricZoom));

    if (Math.abs(fabricZoom - zoom) < 1e-4) {
      canvas.setDimensions({ width: backW, height: backH });
    } else {
      canvas.setDimensions({ width: backW, height: backH }, { backstoreOnly: true });
      canvas.setDimensions({ width: `${cssW}px`, height: `${cssH}px` }, { cssOnly: true });
    }
    if (artboardWrapperRef.current) {
      artboardWrapperRef.current.style.width = `${cssW}px`;
      artboardWrapperRef.current.style.height = `${cssH}px`;
    }
    (canvas as any).__displayZoom = zoom;
    canvas.setZoom(fabricZoom);
    canvas.calcOffset();
    canvas.requestRenderAll();

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
      canvas.requestRenderAll();
    });
  }, [backgroundColor]);

  // 5. Smooth Pointer-Centered Mouse Wheel Zoom (60/120fps CSS-first + debounced crisp commit)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('button, input, textarea, select, #floating-object-hud, #floating-zoom-pill')) return;
      if (!e.deltaY) return;
      const canvas = fabricCanvasRef.current;
      if (!canvas || !canvas.upperCanvasEl) return;
      e.preventDefault();
      const rect = canvas.upperCanvasEl.getBoundingClientRect();
      const curZoom = liveZoomRef.current || zoom || 1;
      const anchor = {
        x: e.clientX,
        y: e.clientY,
        worldX: (e.clientX - rect.left) / Math.max(0.05, curZoom),
        worldY: (e.clientY - rect.top) / Math.max(0.05, curZoom)
      };
      const clampedDelta = Math.max(-120, Math.min(120, e.deltaY));
      const factor = Math.exp(-clampedDelta * 0.0022);
      const next = Math.max(0.1, Math.min(3.0, +(curZoom * factor).toFixed(3)));
      scheduleInteractiveZoom(next, anchor);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [scheduleInteractiveZoom, zoom]);

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
        initialZoomRef.current = liveZoomRef.current || fabricCanvasRef.current?.getZoom() || zoom;

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
    canvas.defaultCursor = pan ? 'var(--ut-cursor-grab, grab)' : 'var(--ut-cursor-default, default)';
    canvas.hoverCursor = pan ? 'var(--ut-cursor-grab, grab)' : 'var(--ut-cursor-move, move)';
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

  // Focus the selected image after inspector panels close, without moving artwork.
  useEffect(() => {
    let first=0, second=0;
    const focus = () => {
      cancelAnimationFrame(first); cancelAnimationFrame(second);
      const canvas=fabricCanvasRef.current, container=containerRef.current, active=canvas?.getActiveObject();
      if(!canvas || !container || active?.type!=='image') return;
      flushViewport(); panOffsetRef.current={x:0,y:0};
      if(artboardFrameRef.current)artboardFrameRef.current.style.transform='translate3d(0,0,0)';
      const box=active.getBoundingRect(true,true);
      const desiredZoom=Math.max(.1,Math.min(2.5,(container.clientWidth-64)/Math.max(1,box.width),(container.clientHeight-104)/Math.max(1,box.height)));
      setZoom(desiredZoom);
      let attempts=0;
      const waitForZoom=()=>{
        if(fabricCanvasRef.current!==canvas)return;
        const currentDisplayZoom = (canvas as any).__displayZoom ?? canvas.getZoom();
        if(Math.abs(currentDisplayZoom-desiredZoom)>.00001 && attempts++<30){first=requestAnimationFrame(waitForZoom);return;}
        second=requestAnimationFrame(()=>{
        if(fabricCanvasRef.current!==canvas || canvas.getActiveObject()!==active || !canvas.upperCanvasEl)return;
        const rect=canvas.upperCanvasEl.getBoundingClientRect(), outer=container.getBoundingClientRect(), center=fabric.util.transformPoint(active.getCenterPoint(),canvas.viewportTransform!);
        const dx=outer.left+outer.width/2-rect.left-center.x,dy=outer.top+outer.height/2-rect.top-center.y;
        const oldX=container.scrollLeft,oldY=container.scrollTop;
        container.scrollLeft-=dx;container.scrollTop-=dy;
        const x=dx+container.scrollLeft-oldX,y=dy+container.scrollTop-oldY;
        panOffsetRef.current={x,y};
        if(artboardFrameRef.current)artboardFrameRef.current.style.transform=`translate3d(${x}px,${y}px,0)`;
        window.dispatchEvent(new Event('scroll'));
      });};
      first=requestAnimationFrame(waitForZoom);
    };
    window.addEventListener('designcraft:focus-crop-image',focus);
    return()=>{window.removeEventListener('designcraft:focus-crop-image',focus);cancelAnimationFrame(first);cancelAnimationFrame(second);};
  },[setZoom]);

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
      className={`dc-canvas-workspace flex-1 h-full overflow-auto bg-[#070D1E] flex items-start justify-start p-3 sm:p-8 pb-20 md:pb-8 relative select-none ${
        isPanMode || isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{
        backgroundImage: showGrid
          ? 'radial-gradient(var(--studio-night-accent-wash, rgba(56, 189, 248, 0.25)) 1.5px, transparent 1.5px)'
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
          ref={artboardWrapperRef}
          id="fabric-canvas-artboard-wrapper"
          className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] rounded-md overflow-hidden bg-white ring-2 ring-sky-500/20 transition-shadow hover:shadow-[0_30px_70px_-15px_rgba(56,189,248,0.2)] touch-none"
        >
          <canvas ref={canvasRef} />
          {overlays}
        </div>
      </div>

    </div>
      {fabricCanvasRef.current && <CanvasImageCrop canvas={fabricCanvasRef.current} request={cropRequest} onApply={onApplyCrop} onDelete={onDelete}/>}
      {/* Outside the scrolling/transforming viewport: compact floating canvas pill + Delete action */}
      <div
        id="floating-zoom-pill"
        role="group"
        aria-label={lang === 'ar' ? 'تكبير وعرض اللوحة' : 'Canvas zoom controls'}
        className="dc-floating-zoom-pill absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-[#181818]/95 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl border border-[#383838] shadow-xl text-[11px] max-w-[calc(100%-12px)] whitespace-nowrap backdrop-blur-md"
        style={{ bottom: 'calc(var(--canvas-controls-bottom, 58px) + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.1, +(z - 0.1).toFixed(2)))}
          className="w-7 h-7 sm:w-6 sm:h-6 inline-flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-35 disabled:cursor-not-allowed"
          title={t.caZoomOut}
          aria-label={t.caZoomOut}
          disabled={zoom <= .1}
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <span
          ref={zoomReadoutRef}
          className="font-mono font-bold text-[#3ea67f] px-0.5 text-[10px] min-w-[34px] text-center select-none"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.1).toFixed(2)))}
          className="w-7 h-7 sm:w-6 sm:h-6 inline-flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-35 disabled:cursor-not-allowed"
          title={t.caZoomIn}
          aria-label={t.caZoomIn}
          disabled={zoom >= 3}
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="h-3 w-px bg-white/15 mx-0.5" />

        <button
          type="button"
          onClick={fitToScreen}
          className="h-7 sm:h-6 px-1.5 inline-flex items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition text-[10px] font-medium"
          title={t.caFitScreen}
          aria-label={t.caFitScreen}
        >
          <Maximize2 className="w-2.5 h-2.5" />
          <span className="hidden sm:inline">{t.caFitLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => setZoom(1)}
          className="h-7 sm:h-6 px-1.5 inline-flex items-center justify-center text-[10px] text-slate-300 hover:text-white hover:bg-white/10 rounded-lg font-mono transition"
          title={t.caActualSize}
        >
          100%
        </button>

        <div className="h-3 w-px bg-white/15 mx-0.5" />

        <button
          type="button"
          data-testid="floating-delete-btn"
          onClick={onDelete}
          disabled={!hasSelection || isLocked}
          className="h-7 sm:h-6 px-1.5 inline-flex items-center justify-center gap-1 rounded-lg transition text-[10px] font-semibold text-rose-400 hover:text-white hover:bg-rose-600/85 disabled:text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          title={lang === 'ar' ? 'حذف العنصر المحدد (Delete)' : 'Delete selected item (Delete)'}
          aria-label={lang === 'ar' ? 'حذف العنصر المحدد' : 'Delete selected item'}
        >
          <Trash2 className="w-3 h-3" />
          <span className="hidden sm:inline">{lang === 'ar' ? 'حذف' : 'Delete'}</span>
        </button>
      </div>
    </div>
  );
};
