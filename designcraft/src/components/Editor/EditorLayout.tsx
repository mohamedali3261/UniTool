import React, { useState, useRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useDcLang } from '../../hooks/useDcLang';
import { fabric } from 'fabric';
import {
  SidebarTabType,
  ActiveObjectProperties,
  ProjectItem
} from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { TopBar } from './TopBar';
import { DesignTabs, DesignTabItem } from './DesignTabs';
import { SidebarTabs } from './Sidebar/SidebarTabs';
import { TextTab } from './Sidebar/TextTab';
import { ElementsTab } from './Sidebar/ElementsTab';
import { IconsTab } from './Sidebar/IconsTab';
import { ImagesTab } from './Sidebar/ImagesTab';
import { OrnamentsTab } from './Sidebar/OrnamentsTab';
import { MediaTab } from './Sidebar/MediaTab';
import { TemplatesTab } from './Sidebar/TemplatesTab';
import { BackgroundTab } from './Sidebar/BackgroundTab';
import { LayersTab } from './Sidebar/LayersTab';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { CanvasArea } from './CanvasArea';
import { ExportModal } from './Modals/ExportModal';
import { PreviewModal } from './Modals/PreviewModal';
import { ShortcutsModal } from './Modals/ShortcutsModal';
import { PexelsSearchModal } from './Modals/PexelsSearchModal';
import { ShapesModal } from './Modals/ShapesModal';
import { IconsModal } from './Modals/IconsModal';
import { ContextMenu, ContextMenuOptions } from './ContextMenu';
import {
  addRectangleToCanvas,
  addCircleToCanvas,
  addTriangleToCanvas,
  addStarToCanvas,
  addLineToCanvas,
  addArrowToCanvas,
  addBadgeToCanvas,
  addHeartToCanvas,
  addTextToCanvas,
  addIconToCanvas,
  addImageToCanvas,
  addSvgShapeToCanvas,
  bringForward,
  sendBackwards,
  bringToFront,
  sendToBack,
  alignObject,
  duplicateActiveObject,
  deleteActiveObject,
  exportCanvasImage,
  exportCanvasSvg,
  exportCanvasPdf,
  applyTextGradient,
  applyTextCurve,
  saveProjectToStorage,
  applyImageClipPathAndEdges,
  applyImageEdgeFade,
  setCanvasPatternBackground,
  setCanvasWallpaperBackground,
  addMobilePhoneMockupToCanvas
} from '../../utils/fabricHelpers';
import { BackgroundPatternItem } from '../../data/patternsCatalog';
import { DesignTemplate, TemplateObjectDef } from '../../data/templates';

interface EditorLayoutProps {
  initialProject: ProjectItem;
  onBackToDashboard: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  tabs: DesignTabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onProjectUpdated?: (project: ProjectItem) => void;
}

export interface EditorLayoutHandle {
  // Persists the live canvas synchronously; used before switching/closing tabs.
  flushSave: () => ProjectItem | undefined;
}

export const EditorLayout = React.forwardRef<EditorLayoutHandle, EditorLayoutProps>(function EditorLayout({
  initialProject,
  onBackToDashboard,
  onShowToast,
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onProjectUpdated
}, ref) {
  const { t, lang } = useDcLang();

  // State
  const [projectTitle, setProjectTitle] = useState(initialProject.title);
  const [canvasWidth, setCanvasWidth] = useState(initialProject.width);
  const [canvasHeight, setCanvasHeight] = useState(initialProject.height);
  const [backgroundColor, setBackgroundColor] = useState(
    initialProject.canvasData?.background || '#FFFFFF'
  );
  const [zoom, setZoom] = useState(0.85);
  const [showGrid, setShowGrid] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTabType | null>('templates');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [activeProperties, setActiveProperties] = useState<ActiveObjectProperties | null>(null);
  const [layersList, setLayersList] = useState<any[]>([]);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPexelsModalOpen, setIsPexelsModalOpen] = useState(false);
  const [isShapesModalOpen, setIsShapesModalOpen] = useState(false);
  const [isIconsModalOpen, setIsIconsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuOptions>({
    visible: false,
    x: 0,
    y: 0,
    hasSelection: false,
    hasClipboard: false
  });
  
  // Custom Clipboard state
  const clipboardRef = useRef<fabric.Object | null>(null);

  // Undo / Redo Stacks
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isHistoryLockedRef = useRef<boolean>(false);

  // Record History Snapshot
  const recordHistory = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isHistoryLockedRef.current) return;

    const json = JSON.stringify(
      canvas.toJSON([
        'id',
        'name',
        'locked',
        'lockMovementX',
        'lockMovementY',
        'lockRotation',
        'clipCornerTL',
        'clipCornerTR',
        'clipCornerBR',
        'clipCornerBL',
        'cropTop',
        'cropBottom',
        'cropLeft',
        'cropRight',
        'fadeTop',
        'fadeBottom',
        'fadeLeft',
        'fadeRight',
        'fadeRadial',
        '_originalSrc',
        'hasBorders',
        'hasControls',
        'clipPath'
      ])
    );
    const newStack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    newStack.push(json);
    if (newStack.length > 30) newStack.shift();
    historyStackRef.current = newStack;
    historyIndexRef.current = newStack.length - 1;
  }, []);

  // Update Layers helper
  const updateLayersList = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    const list = objects
      .map((obj: any, index: number) => {
        let name = t.layerElement;
        const type = obj.type || 'object';
        if (type === 'textbox' || type === 'i-text' || type === 'text') {
          name = obj.text ? `${t.layerTextWithContent} "${obj.text.substring(0, 12)}..."` : t.layerText;
        } else if (type === 'rect') {
          name = t.layerRect;
        } else if (type === 'circle') {
          name = t.layerCircle;
        } else if (type === 'triangle') {
          name = t.layerTriangle;
        } else if (type === 'image') {
          name = t.layerImage;
        } else if (type === 'group') {
          name = obj.name || t.layerGroup;
        } else if (type === 'path') {
          name = t.layerPath;
        }

        return {
          id: obj.id || `obj_${index}_${Date.now()}`,
          name: obj.name || name,
          type,
          visible: obj.visible !== false,
          locked: !!obj.lockMovementX,
          rawObject: obj
        };
      })
      .reverse();

    setLayersList(list);
  }, []);

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    isHistoryLockedRef.current = true;
    historyIndexRef.current -= 1;
    const jsonState = historyStackRef.current[historyIndexRef.current];

    canvas.loadFromJSON(jsonState, () => {
      canvas.renderAll();
      updateLayersList();
      isHistoryLockedRef.current = false;
      onShowToast(t.elUndoTitle, t.elUndoMsg, 'info');
    });
  }, [updateLayersList, onShowToast]);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyStackRef.current.length - 1) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    isHistoryLockedRef.current = true;
    historyIndexRef.current += 1;
    const jsonState = historyStackRef.current[historyIndexRef.current];

    canvas.loadFromJSON(jsonState, () => {
      canvas.renderAll();
      updateLayersList();
      isHistoryLockedRef.current = false;
      onShowToast(t.elRedoTitle, t.elRedoMsg, 'info');
    });
  }, [updateLayersList, onShowToast]);

  // Context Menu Handlers
  const handleCopy = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone((cloned: fabric.Object) => {
      clipboardRef.current = cloned;
      onShowToast(t.elCopyTitle, t.elCopyMsg, 'info');
    });
  }, [onShowToast]);

  const handlePaste = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !clipboardRef.current) return;
    
    clipboardRef.current.clone((clonedObj: fabric.Object) => {
      canvas.discardActiveObject();
      
      clonedObj.set({
        left: (clonedObj.left || 0) + 20,
        top: (clonedObj.top || 0) + 20,
        evented: true,
      });

      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        (clonedObj as any).forEachObject((obj: fabric.Object) => {
          canvas.add(obj);
        });
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }
      
      clipboardRef.current!.top! += 20;
      clipboardRef.current!.left! += 20;

      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
      
      // We don't have updateLayersList in scope here easily? Wait, it's defined lower down!
      // I should define these handlers AFTER updateLayersList is defined, or just let them rely on useEffect / event handlers doing it.
      // Better yet, updateLayersList can be triggered implicitly or we can define it later. Wait, updateLayersList is a useCallback.
      // Let's just trigger a custom event or check how we can do it.
    });
  }, []);

  const handleCut = useCallback(() => {
    handleCopy();
    if (fabricCanvasRef.current) {
       deleteActiveObject(fabricCanvasRef.current);
       updateLayersList();
       recordHistory();
    }
  }, [handleCopy, updateLayersList, recordHistory]);

  // Global Keyboard Shortcuts (Copy/Paste/Cut/Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          handleCopy();
        } else if (e.key === 'v' || e.key === 'V') {
          handlePaste();
        } else if (e.key === 'x' || e.key === 'X') {
          handleCut();
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (fabricCanvasRef.current) {
            duplicateActiveObject(fabricCanvasRef.current);
            updateLayersList();
            recordHistory();
          }
        } else if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleRedo();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (fabricCanvasRef.current) {
          deleteActiveObject(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      } else if (e.key === ']') {
        if (fabricCanvasRef.current) {
          bringToFront(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      } else if (e.key === '[') {
        if (fabricCanvasRef.current) {
          sendToBack(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, handleCut, handleUndo, handleRedo, updateLayersList, recordHistory]);

  // Handle Right Click for Context Menu
  const handleContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    const canvas = fabricCanvasRef.current;
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      hasSelection: !!canvas?.getActiveObject(),
      hasClipboard: !!clipboardRef.current
    });
  }, []);

  

  // On Canvas Ready Callback
  const handleCanvasReady = useCallback(
    (canvas: fabric.Canvas) => {
      fabricCanvasRef.current = canvas;

      if (initialProject.canvasData) {
        isHistoryLockedRef.current = true;
        canvas.loadFromJSON(initialProject.canvasData, () => {
          canvas.renderAll();
          updateLayersList();
          isHistoryLockedRef.current = false;
          recordHistory();
        });
      } else {
        recordHistory();
      }
    },
    [initialProject.canvasData, recordHistory, updateLayersList]
  );

  // Handle Selection Change
  const handleSelectionChange = useCallback((props: ActiveObjectProperties | null) => {
    setActiveProperties(props);
    if (props && window.innerWidth >= 768) {
      setIsPropertiesOpen(true);
    }
  }, []);

  // Property Updater
  const handleUpdateProperty = useCallback(
    (key: keyof ActiveObjectProperties, value: any) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const active = canvas.getActiveObject();
      if (!active) return;

      if (
        key === 'cropTop' ||
        key === 'cropBottom' ||
        key === 'cropLeft' ||
        key === 'cropRight' ||
        key === 'clipCornerTL' ||
        key === 'clipCornerTR' ||
        key === 'clipCornerBR' ||
        key === 'clipCornerBL'
      ) {
        (active as any)[key] = value;
        applyImageClipPathAndEdges(active);
        canvas.renderAll();
        setActiveProperties((prev) => (prev ? { ...prev, [key]: value } : null));
        recordHistory();
        return;
      }

      if (
        key === 'fadeTop' ||
        key === 'fadeBottom' ||
        key === 'fadeLeft' ||
        key === 'fadeRight' ||
        key === 'fadeRadial'
      ) {
        (active as any)[key] = value;
        applyImageEdgeFade(active, () => {
          canvas.renderAll();
        });
        setActiveProperties((prev) => (prev ? { ...prev, [key]: value } : null));
        recordHistory();
        return;
      }

      if (key === 'textGradient') {
        applyTextGradient(active, value);
        canvas.renderAll();
        setActiveProperties((prev) => (prev ? { ...prev, textGradient: value } : null));
        recordHistory();
        return;
      }

      if (key === 'curve') {
        applyTextCurve(active, value);
        canvas.renderAll();
        setActiveProperties((prev) => (prev ? { ...prev, curve: value } : null));
        recordHistory();
        return;
      }

      if (key === 'width') {
        const currentScaleX = active.scaleX || 1;
        const currentWidth = (active.width || 0) * currentScaleX;
        if (currentWidth > 0) {
          active.scale(value / (active.width || 1));
        }
      } else if (key === 'height') {
        const currentScaleY = active.scaleY || 1;
        const currentHeight = (active.height || 0) * currentScaleY;
        if (currentHeight > 0) {
          active.scaleY = value / (active.height || 1);
        }
      } else if (key === 'lockMovementX' || key === 'lockMovementY') {
        active.set({
          lockMovementX: value,
          lockMovementY: value,
          lockRotation: value,
          lockScalingX: value,
          lockScalingY: value
        });
      } else if (key === 'rx' || key === 'ry') {
        if (active.type === 'rect') {
          active.set({ rx: value, ry: value });
        }
      } else {
        (active as any).set(key, value);
      }

      active.setCoords();
      canvas.renderAll();

      setActiveProperties((prev) => (prev ? { ...prev, [key]: value } : null));
      updateLayersList();
      recordHistory();
    },
    [recordHistory, updateLayersList]
  );

  // Persist the live canvas. Also used synchronously before tab switches so
  // unsaved edits survive the remount that happens for the next design.
  const persistProject = useCallback((): ProjectItem | undefined => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return undefined;

    const canvasJson = canvas.toJSON([
      'id',
      'name',
      'locked',
      'lockMovementX',
      'lockMovementY',
      'clipCornerTL',
      'clipCornerTR',
      'clipCornerBR',
      'clipCornerBL',
      'cropTop',
      'cropBottom',
      'cropLeft',
      'cropRight',
      'fadeTop',
      'fadeBottom',
      'fadeLeft',
      'fadeRight',
      'fadeRadial',
      '_originalSrc'
    ]);

    // Render the thumbnail from the full design, not the zoomed viewport,
    // otherwise saved design cards look pixelated.
    const thumb = exportCanvasImage(canvas, 'png', 1, 0.3, canvasWidth, canvasHeight);

    const updated: ProjectItem = {
      ...initialProject,
      title: projectTitle,
      width: canvasWidth,
      height: canvasHeight,
      thumbnail: thumb,
      updatedAt: Date.now(),
      canvasData: {
        ...canvasJson,
        background: backgroundColor
      }
    };

    saveProjectToStorage(updated);
    onProjectUpdated?.(updated);
    return updated;
  }, [initialProject, projectTitle, canvasWidth, canvasHeight, backgroundColor, onProjectUpdated]);

  // Save Project Action
  const handleSaveProject = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    setIsSaving(true);
    persistProject();

    setTimeout(() => {
      setIsSaving(false);
      onShowToast(t.elSavedTitle, t.elSavedMsg, 'success');
    }, 400);
  }, [persistProject, onShowToast]);

  useImperativeHandle(ref, () => ({
    flushSave: () => persistProject()
  }), [persistProject]);

  // Open Export Modal
  const handleOpenExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  // Open Preview Modal
  const handleOpenPreview = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const url = exportCanvasImage(canvas, 'png', 1, 1, canvasWidth, canvasHeight);
    setPreviewUrl(url);
    setIsPreviewModalOpen(true);
  }, [canvasWidth, canvasHeight]);

  // Resize Canvas Action
  const handleResizeCanvas = useCallback((w: number, h: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setCanvasWidth(w);
    setCanvasHeight(h);
    canvas.setDimensions({ width: w * zoom, height: h * zoom });
    canvas.renderAll();
    onShowToast(t.elResizeTitle, `${t.elResizeMsg} ${w} × ${h} px`, 'info');
  }, [zoom, onShowToast]);

  // Background Setters
  const handleSetBackgroundColor = useCallback((color: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    setBackgroundColor(color);
    canvas.backgroundImage = undefined;
    canvas.setBackgroundColor(color, () => {
      canvas.renderAll();
      canvas.requestRenderAll();
    });
    canvas.renderAll();
    recordHistory();
    onShowToast(t.elBgTitle, t.elBgMsg, 'success');
  }, [onShowToast, recordHistory]);

  const handleSetBackgroundGradient = useCallback((color1OrStops: string | string[], color2?: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let c1 = '#0284C7';
    let c2 = '#0F172A';

    if (Array.isArray(color1OrStops)) {
      c1 = color1OrStops[0] || '#0284C7';
      c2 = color1OrStops[1] || color1OrStops[0] || '#0F172A';
    } else if (typeof color1OrStops === 'string') {
      c1 = color1OrStops;
      c2 = color2 || color1OrStops;
    }

    const width = canvasWidth || 1080;
    const height = canvasHeight || 1080;

    const grad = new fabric.Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: width, y2: height },
      colorStops: [
        { offset: 0, color: c1 },
        { offset: 1, color: c2 }
      ]
    });

    canvas.backgroundImage = undefined;
    canvas.setBackgroundColor(grad as any, () => {
      canvas.renderAll();
      canvas.requestRenderAll();
    });
    setBackgroundColor(c1);
    recordHistory();
    onShowToast(t.elGradientTitle, t.elGradientMsg, 'success');
  }, [onShowToast, recordHistory, canvasWidth, canvasHeight]);

  const handleSetBackgroundPattern = useCallback((patternItem: BackgroundPatternItem) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (patternItem.type === 'svg-pattern') {
      setCanvasPatternBackground(canvas, patternItem.sourceUrl, () => {
        onShowToast(t.elPatternTitle, `${t.elPatternApplied} ${patternItem.nameAr}`, 'success');
        recordHistory();
      });
    } else {
      setCanvasWallpaperBackground(canvas, patternItem.sourceUrl, () => {
        onShowToast(t.elPatternTitle, `${t.elPatternApplied} ${patternItem.nameAr}`, 'success');
        recordHistory();
      });
    }
  }, [onShowToast, recordHistory]);

  // Image Filter Handler
  const handleApplyImageFilter = useCallback((filterName: string) => {    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'image') return;

    const img = active as fabric.Image;

    if (filterName === 'flipX') {
      img.set('flipX', !img.flipX);
    } else if (filterName === 'flipY') {
      img.set('flipY', !img.flipY);
    } else if (filterName === 'reset') {
      img.filters = [];
      img.set('flipX', false);
      img.set('flipY', false);
    } else {
      img.filters = img.filters || [];
      if (filterName === 'grayscale') {
        img.filters.push(new (fabric.Image.filters as any).Grayscale());
      } else if (filterName === 'sepia') {
        img.filters.push(new (fabric.Image.filters as any).Sepia());
      } else if (filterName === 'vintage') {
        if ((fabric.Image.filters as any).Vintage) {
          img.filters.push(new (fabric.Image.filters as any).Vintage());
        } else {
          img.filters.push(new (fabric.Image.filters as any).Sepia());
        }
      } else if (filterName === 'blur') {
        if ((fabric.Image.filters as any).Blur) {
          img.filters.push(new (fabric.Image.filters as any).Blur({ blur: 0.25 }));
        }
      } else if (filterName === 'invert') {
        if ((fabric.Image.filters as any).Invert) {
          img.filters.push(new (fabric.Image.filters as any).Invert());
        }
      } else if (filterName === 'brightness') {
        if ((fabric.Image.filters as any).Brightness) {
          img.filters.push(new (fabric.Image.filters as any).Brightness({ brightness: 0.15 }));
        }
      } else if (filterName === 'contrast') {
        if ((fabric.Image.filters as any).Contrast) {
          img.filters.push(new (fabric.Image.filters as any).Contrast({ contrast: 0.2 }));
        }
      } else if (filterName === 'vivid') {
        const F = fabric.Image.filters as any;
        if (F.Saturation) img.filters.push(new F.Saturation({ saturation: 0.5 }));
        if (F.Contrast) img.filters.push(new F.Contrast({ contrast: 0.15 }));
        if (F.Brightness) img.filters.push(new F.Brightness({ brightness: 0.05 }));
      } else if (filterName === 'noir') {
        const F = fabric.Image.filters as any;
        if (F.Grayscale) img.filters.push(new F.Grayscale());
        if (F.Contrast) img.filters.push(new F.Contrast({ contrast: 0.3 }));
      } else if (filterName === 'warm') {
        const F = fabric.Image.filters as any;
        if (F.BlendColor) {
          img.filters.push(new F.BlendColor({ color: '#FFB266', mode: 'multiply', alpha: 0.35 }));
        }
        if (F.Saturation) img.filters.push(new F.Saturation({ saturation: 0.15 }));
      } else if (filterName === 'cool') {
        const F = fabric.Image.filters as any;
        if (F.BlendColor) {
          img.filters.push(new F.BlendColor({ color: '#9EC5FF', mode: 'multiply', alpha: 0.35 }));
        }
        if (F.Contrast) img.filters.push(new F.Contrast({ contrast: 0.1 }));
      }
    }

    if (img.applyFilters) {
      try {
        img.applyFilters();
      } catch (err) {
        console.warn('Filter apply error:', err);
      }
    }
    canvas.renderAll();
    onShowToast(t.elFilterTitle, `${t.elFilterApplied} ${filterName}`, 'info');
  }, [onShowToast]);

  // ---- Apply a ready-made template: replaces background + adds composed objects ----
  // NOTE: canvas.getWidth() returns the ZOOMED screen size, not the design size.
  // Fabric object coordinates live in design space, so we use canvasWidth/canvasHeight.
  const handleApplyTemplate = useCallback((tpl: DesignTemplate) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let cW = canvasWidth || 1080;
    let cH = canvasHeight || 1080;

    // If the canvas already has objects, ask to REPLACE them with the template
    const sizeChanged = !!tpl.exactSize && (cW !== tpl.baseW || cH !== tpl.baseH);
    const existing = canvas.getObjects();
    if (existing.length > 0) {
      const message = sizeChanged
        ? `${t.tplOverlayConfirm}\n\n${t.tplResizeNote} ${tpl.baseW} × ${tpl.baseH} px`
        : t.tplOverlayConfirm;
      const ok = window.confirm(message);
      if (!ok) return;
      canvas.remove(...existing);
    }

    // Google Play asset templates carry their official size and adopt it
    if (tpl.exactSize) {
      cW = tpl.baseW;
      cH = tpl.baseH;
    }
    const scale = Math.min(cW / tpl.baseW, cH / tpl.baseH);

    if (sizeChanged) {
      setCanvasWidth(cW);
      setCanvasHeight(cH);
      canvas.setDimensions({ width: cW * zoom, height: cH * zoom });
      setTimeout(() => {
        const container = document.getElementById('canvas-area-container');
        if (!container) return;
        const fit = Math.min(
          (container.clientWidth - 40) / cW,
          (container.clientHeight - 80) / cH,
          0.9
        );
        setZoom(Math.max(0.15, Math.min(+fit.toFixed(2), 1)));
      }, 60);
    }

    // Background: solid or diagonal gradient
    canvas.backgroundImage = undefined;
    if (tpl.bg2) {
      const grad = new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: cW, y2: cH },
        colorStops: [
          { offset: 0, color: tpl.bg },
          { offset: 1, color: tpl.bg2 }
        ]
      });
      canvas.setBackgroundColor(grad as any, () => canvas.renderAll());
    } else {
      canvas.setBackgroundColor(tpl.bg, () => canvas.renderAll());
    }
    setBackgroundColor(tpl.bg);

    // Compose objects
    const makeFill = (o: TemplateObjectDef, w: number, h: number) => {
      if (!o.fill2) return o.fill || '#0284C7';
      return new fabric.Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: { x1: 0, y1: 0, x2: w, y2: h },
        colorStops: [
          { offset: 0, color: o.fill || '#0284C7' },
          { offset: 1, color: o.fill2 }
        ]
      }) as any;
    };
    const makeShadow = (o: TemplateObjectDef) => {
      if (!o.shadow) return undefined;
      return new fabric.Shadow({
        color: o.shadow.color,
        blur: (o.shadow.blur ?? 0.02) * tpl.baseW * scale,
        offsetX: (o.shadow.offsetX ?? 0) * tpl.baseW * scale,
        offsetY: (o.shadow.offsetY ?? 0) * tpl.baseW * scale
      });
    };

    tpl.objects.forEach((o) => {
      const left = o.x * cW;
      const top = o.y * cH;

      if (o.type === 'circle') {
        const radius = Math.max(4, (o.size ?? 0.1) * tpl.baseW * scale / 2);
        const circle = new fabric.Circle({
          left,
          top,
          originX: 'center',
          originY: 'center',
          radius,
          fill: makeFill(o, radius * 2, radius * 2),
          opacity: o.opacity ?? 1,
          shadow: makeShadow(o)
        });
        canvas.add(circle);
      } else if (o.type === 'rect') {
        const rectW = Math.max(4, (o.w ?? 0.3) * cW);
        const rectH = Math.max(3, (o.h ?? 0.05) * cH);
        const rect = new fabric.Rect({
          left,
          top,
          originX: 'center',
          originY: 'center',
          width: rectW,
          height: rectH,
          fill: makeFill(o, rectW, rectH),
          rx: (o.rx ?? 0) * cW,
          ry: (o.rx ?? 0) * cW,
          opacity: o.opacity ?? 1,
          angle: o.rotation ?? 0,
          shadow: makeShadow(o)
        });
        canvas.add(rect);
      } else {
        const fontSize = Math.max(10, (o.size ?? 0.06) * tpl.baseW * scale);
        const textWidth = Math.min(cW * 0.92, fontSize * 14);
        const boxWidth = o.w ? Math.min(cW * 0.96, o.w * cW) : textWidth;
        const textbox = new fabric.Textbox(o.text || ' ', {
          left,
          top,
          originX: 'center',
          originY: 'center',
          fontFamily: o.fontFamily || 'Cairo',
          fontSize,
          fontWeight: o.fontWeight ?? 700,
          fill: makeFill(o, boxWidth, fontSize * 1.35),
          textAlign: 'center',
          lineHeight: 1.3,
          width: boxWidth,
          styles: {},
          angle: o.rotation ?? 0,
          splitByGrapheme: false,
          shadow: makeShadow(o)
        });
        canvas.add(textbox);
      }
    });

    canvas.renderAll();
    updateLayersList();
    recordHistory();
    onShowToast(t.tplToastTitle, `${lang === 'ar' ? tpl.nameAr : tpl.nameEn} · ${cW} × ${cH}`, 'success');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    // scroll canvas into view on mobile
    setTimeout(() => {
      document.getElementById('canvas-area-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  }, [onShowToast, recordHistory, lang, canvasWidth, canvasHeight, zoom]);

  // ---- Quick PNG download straight from the top bar ----
  // Always exports at 2× the full design size, regardless of the current zoom.
  const handleQuickExportPng = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    handleSaveProject();
    const dataUrl = exportCanvasImage(canvas, 'png', 1, 2, canvasWidth, canvasHeight);
    if (!dataUrl) {
      onShowToast(t.quickExportErrorTitle, t.quickExportErrorMsg, 'error');
      return;
    }
    const link = document.createElement('a');
    link.download = `${(projectTitle || 'design').trim()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(t.quickExportTitle, `${t.quickExportMsg} PNG · 2×`, 'success');
  }, [onShowToast, projectTitle, canvasWidth, canvasHeight]);

  // Sidebar Tab Select
  const handleSelectSidebarTab = (tab: SidebarTabType) => {
    if (activeSidebarTab === tab && isSidebarOpen) {
      setIsSidebarOpen(false);
    } else {
      setActiveSidebarTab(tab);
      setIsSidebarOpen(true);
    }
  };

  const getTabTitle = (tab: SidebarTabType) => {
    switch (tab) {
      case 'templates': return t.titleTemplates;
      case 'text': return t.titleText;
      case 'elements': return t.titleElements;
      case 'media': return t.titleMedia;
      case 'background': return t.titleBackground;
      case 'layers': return t.titleLayers;
      default: return t.tools;
    }
  };

  const renderSidebarContent = () => {
    switch (activeSidebarTab) {
      case 'text':
        return (
          <TextTab
            activeProperties={activeProperties}
            onUpdateProperty={handleUpdateProperty}
            onAddText={(options) => {
              if (fabricCanvasRef.current) {
                addTextToCanvas(fabricCanvasRef.current, options.text, options);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddHeading={() => {
              if (fabricCanvasRef.current) {
                addTextToCanvas(fabricCanvasRef.current, t.defaultHeading, { fontSize: 44, fontWeight: 'bold' });
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddSubheading={() => {
              if (fabricCanvasRef.current) {
                addTextToCanvas(fabricCanvasRef.current, t.defaultSubheading, { fontSize: 28, fontWeight: '600' });
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddBodyText={() => {
              if (fabricCanvasRef.current) {
                addTextToCanvas(fabricCanvasRef.current, t.defaultBody, { fontSize: 18 });
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
          />
        );
      case 'elements':
        return (
          <ElementsTab
            onAddRectangle={(fill, rx) => {
              if (fabricCanvasRef.current) {
                addRectangleToCanvas(fabricCanvasRef.current, { fill, rx });
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddCircle={(fill) => {
              if (fabricCanvasRef.current) {
                addCircleToCanvas(fabricCanvasRef.current, fill);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddTriangle={(fill) => {
              if (fabricCanvasRef.current) {
                addTriangleToCanvas(fabricCanvasRef.current, fill);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddStar={(fill) => {
              if (fabricCanvasRef.current) {
                addStarToCanvas(fabricCanvasRef.current, fill);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddLine={(stroke) => {
              if (fabricCanvasRef.current) {
                addLineToCanvas(fabricCanvasRef.current, stroke);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddArrow={(stroke) => {
              if (fabricCanvasRef.current) {
                addArrowToCanvas(fabricCanvasRef.current, stroke);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddBadge={(fill) => {
              if (fabricCanvasRef.current) {
                addBadgeToCanvas(fabricCanvasRef.current, fill);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddHeart={(fill) => {
              if (fabricCanvasRef.current) {
                addHeartToCanvas(fabricCanvasRef.current, fill);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onOpenShapesModal={() => setIsShapesModalOpen(true)}
          />
        );
      case 'templates':
        return (
          <TemplatesTab onApplyTemplate={handleApplyTemplate} />
        );
      case 'media':
        return (
          <MediaTab
            imagesContent={
              <ImagesTab
                onAddImage={(url) => {
                  if (fabricCanvasRef.current) {
                    addImageToCanvas(fabricCanvasRef.current, url);
                    updateLayersList();
                    recordHistory();
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                    setTimeout(() => {
                      document.getElementById('canvas-area-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                }}
                onOpenPexelsModal={() => setIsPexelsModalOpen(true)}
                onAddMobileMockup={() => {
                  if (fabricCanvasRef.current) {
                    addMobilePhoneMockupToCanvas(fabricCanvasRef.current);
                    updateLayersList();
                    recordHistory();
                    onShowToast(t.elPhoneTitle, t.elPhoneMsg, 'success');
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }
                }}
              />
            }
            iconsContent={
              <IconsTab
                onAddIcon={(iconName, color) => {
                  if (fabricCanvasRef.current) {
                    addIconToCanvas(fabricCanvasRef.current, iconName, color);
                    updateLayersList();
                    recordHistory();
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }
                }}
                onOpenIconsModal={() => setIsIconsModalOpen(true)}
              />
            }
            ornamentsContent={
              <OrnamentsTab
                onAddOrnament={(item, fillColor) => {
                  if (fabricCanvasRef.current) {
                    addSvgShapeToCanvas(
                      fabricCanvasRef.current,
                      item.svgPath,
                      item.viewBox || '0 0 200 200',
                      fillColor || item.defaultFill || '#F59E0B',
                      item.defaultStroke || '',
                      item.defaultStrokeWidth || 0
                    );
                    updateLayersList();
                    recordHistory();
                    onShowToast(t.elOrnamentTitle, `${t.elShapeAdded} ${item.nameAr} ${t.elToBoard}`, 'success');
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }
                }}
                canvasBackgroundColor={backgroundColor}
                onChangeCanvasColor={handleSetBackgroundColor}
                onChangeCanvasGradient={handleSetBackgroundGradient}
              />
            }
          />
        );
      case 'background':
        return (
          <BackgroundTab
            currentColor={backgroundColor}
            onSelectColor={handleSetBackgroundColor}
            onSelectGradient={handleSetBackgroundGradient}
            onSelectPattern={handleSetBackgroundPattern}
          />
        );
      case 'layers':
        return (
          <LayersTab
            layers={layersList}
            onSelectLayer={(id) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const found = layersList.find((l) => l.id === id);
              if (found && found.rawObject) {
                canvas.setActiveObject(found.rawObject);
                canvas.renderAll();
              }
            }}
            onToggleVisibility={(id) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const found = layersList.find((l) => l.id === id);
              if (found && found.rawObject) {
                found.rawObject.visible = !found.rawObject.visible;
                canvas.renderAll();
                updateLayersList();
                recordHistory();
              }
            }}
            onToggleLock={(id) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const found = layersList.find((l) => l.id === id);
              if (found && found.rawObject) {
                const next = !found.rawObject.lockMovementX;
                found.rawObject.set({
                  lockMovementX: next,
                  lockMovementY: next,
                  lockRotation: next,
                  lockScalingX: next,
                  lockScalingY: next
                });
                canvas.renderAll();
                updateLayersList();
                recordHistory();
              }
            }}
            onDeleteLayer={(id) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const found = layersList.find((l) => l.id === id);
              if (found && found.rawObject) {
                canvas.remove(found.rawObject);
                canvas.renderAll();
                updateLayersList();
                recordHistory();
              }
            }}
            onMoveLayerUp={(id) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const found = layersList.find((l) => l.id === id);
              if (found && found.rawObject) {
                bringForward(canvas);
                updateLayersList();
                recordHistory();
              }
            }}
            onMoveLayerDown={(id) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const found = layersList.find((l) => l.id === id);
              if (found && found.rawObject) {
                sendBackwards(canvas);
                updateLayersList();
                recordHistory();
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  const renderPropertiesPanelContent = () => (
    <PropertiesPanel
      activeProperties={activeProperties}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      backgroundColor={backgroundColor}
      onUpdateProperty={handleUpdateProperty}
      onAlign={(alignment) => {
        if (fabricCanvasRef.current) alignObject(fabricCanvasRef.current, alignment);
      }}
      onBringForward={() => {
        if (fabricCanvasRef.current) {
          bringForward(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      }}
      onSendBackward={() => {
        if (fabricCanvasRef.current) {
          sendBackwards(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      }}
      onBringToFront={() => {
        if (fabricCanvasRef.current) {
          bringToFront(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      }}
      onSendToBack={() => {
        if (fabricCanvasRef.current) {
          sendToBack(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      }}
      onDuplicate={() => {
        if (fabricCanvasRef.current) {
          duplicateActiveObject(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      }}
      onDelete={() => {
        if (fabricCanvasRef.current) {
          deleteActiveObject(fabricCanvasRef.current);
          updateLayersList();
          recordHistory();
        }
      }}
      onToggleLock={() => {
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
        setActiveProperties((p) => (p ? { ...p, lockMovementX: next } : null));
        updateLayersList();
        recordHistory();
      }}
      onApplyImageFilter={handleApplyImageFilter}
      onResizeCanvas={handleResizeCanvas}
      onSetBackgroundColor={handleSetBackgroundColor}
      onSetBackgroundGradient={handleSetBackgroundGradient}
      onDeselect={() => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.discardActiveObject();
          fabricCanvasRef.current.renderAll();
          setActiveProperties(null);
        }
      }}
      onClosePanel={() => setIsPropertiesOpen(false)}
    />
  );

  return (
    <div
      id="editor-layout"
      dir="ltr"
      className="h-screen w-screen bg-[#070D1E] flex flex-col overflow-hidden select-none font-sans"
    >
      {/* 1. Top Bar */}
      <TopBar
        title={projectTitle}
        onUpdateTitle={setProjectTitle}
        onBackToDashboard={onBackToDashboard}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyStackRef.current.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
        onZoomOut={() => setZoom((z) => Math.max(0.15, +(z - 0.1).toFixed(2)))}
        onResetZoom={() => setZoom(1)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onOpenPreview={handleOpenPreview}
        onOpenExport={handleOpenExport}
        onSave={handleSaveProject}
        onQuickDownload={handleQuickExportPng}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        isSaving={isSaving}
        width={canvasWidth}
        height={canvasHeight}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isPropertiesOpen={isPropertiesOpen}
        onToggleProperties={() => setIsPropertiesOpen(!isPropertiesOpen)}
        isPanMode={isPanMode}
        onTogglePanMode={() => setIsPanMode(!isPanMode)}
      />

      {/* 2. Open Design Tabs */}
      <DesignTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewTab={onNewTab}
        onBackToDashboard={onBackToDashboard}
      />

      {/* 3. Workspace Body: Rail + Drawer + Canvas Area + Properties Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost Sidebar Icon Rail (Desktop only) */}
        <SidebarTabs
          activeTab={isSidebarOpen ? activeSidebarTab : null}
          onSelectTab={handleSelectSidebarTab}
          variant="rail"
        />

        {/* Desktop Sidebar Expanded Drawer Panel */}
        {isSidebarOpen && (
          <div className="hidden md:flex flex-col w-80 bg-[#1C2541] border-r border-slate-700/60 shrink-0 h-full overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-[#0B132B] border-b border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {getTabTitle(activeSidebarTab)}
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label={t.close}
                title={t.close}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* Canvas Workspace Center */}
        <div id="canvas-wrapper-area" className="flex-1 overflow-hidden relative flex bg-[#0B132B]/50" onContextMenu={handleContextMenu}>
          <ContextMenu
            options={contextMenu}
            onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            onDuplicate={() => {
              if (fabricCanvasRef.current) {
                duplicateActiveObject(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
            onDelete={() => {
              if (fabricCanvasRef.current) {
                deleteActiveObject(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
            onBringToFront={() => {
              if (fabricCanvasRef.current) {
                bringToFront(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
            onSendToBack={() => {
              if (fabricCanvasRef.current) {
                sendToBack(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
            onBringForward={() => {
              if (fabricCanvasRef.current) {
                bringForward(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
            onSendBackward={() => {
              if (fabricCanvasRef.current) {
                sendBackwards(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
          />
          <CanvasArea
            width={canvasWidth}
            height={canvasHeight}
            backgroundColor={backgroundColor}
            zoom={zoom}
            setZoom={setZoom}
            showGrid={showGrid}
            isPanMode={isPanMode}
            onCanvasReady={handleCanvasReady}
            onSelectionChange={handleSelectionChange}
            onLayersUpdate={updateLayersList}
            onRecordHistory={recordHistory}
            onContextMenu={handleContextMenu}
            onDuplicate={() => {
              if (fabricCanvasRef.current) {
                duplicateActiveObject(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
            onDelete={() => {
              if (fabricCanvasRef.current) {
                deleteActiveObject(fabricCanvasRef.current);
                updateLayersList();
                recordHistory();
              }
            }}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSave={handleSaveProject}
            onOpenProperties={() => setIsPropertiesOpen(true)}
          />
        </div>

        {/* Desktop Right Properties Panel */}
        {isPropertiesOpen && (
          <div className="hidden md:flex h-full shrink-0">
            {renderPropertiesPanelContent()}
          </div>
        )}
      </div>

      {/* 3. Mobile Bottom Navigation Bar */}
      <SidebarTabs
        activeTab={isSidebarOpen ? activeSidebarTab : null}
        onSelectTab={handleSelectSidebarTab}
        variant="bottom-bar"
        hasSelection={!!activeProperties}
        onToggleProperties={() => setIsPropertiesOpen(!isPropertiesOpen)}
        isPropertiesOpen={isPropertiesOpen}
      />

      {/* 4. Mobile Bottom Sheet Drawer for Sidebar Tools */}
      {isSidebarOpen && activeSidebarTab && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="fixed inset-x-0 bottom-14 z-50 h-[72vh] max-h-[560px] bg-[#1C2541] rounded-t-3xl border-t border-sky-500/40 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="px-4 pt-3 pb-2 border-b border-slate-700/70 bg-[#0B132B] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-slate-600 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
                <span className="text-sm font-bold text-white mt-1">
                  {getTabTitle(activeSidebarTab)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                aria-label={t.close}
                title={t.close}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {renderSidebarContent()}
            </div>
          </div>
        </div>
      )}

      {/* 5. Mobile Bottom Sheet for Properties Panel */}
      {isPropertiesOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPropertiesOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="fixed inset-x-0 bottom-14 z-50 h-[75vh] max-h-[560px] bg-[#1C2541] rounded-t-3xl border-t border-sky-500/40 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="w-8 h-1 bg-slate-600 rounded-full mx-auto my-2" />
            <div className="flex-1 overflow-hidden">
              {renderPropertiesPanelContent()}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={(format, quality, multiplier) => {
          if (!fabricCanvasRef.current) return '';
          return exportCanvasImage(
            fabricCanvasRef.current,
            format,
            quality,
            multiplier,
            canvasWidth,
            canvasHeight
          );
        }}
        onExportSvg={() => {
          if (!fabricCanvasRef.current) return '';
          return exportCanvasSvg(fabricCanvasRef.current, canvasWidth, canvasHeight);
        }}
        onExportPdf={async (filename) => {
          if (!fabricCanvasRef.current) return;
          await exportCanvasPdf(fabricCanvasRef.current, filename, canvasWidth, canvasHeight);
        }}
        defaultTitle={projectTitle}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onShowToast={onShowToast}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        previewUrl={previewUrl}
        title={projectTitle}
        width={canvasWidth}
        height={canvasHeight}
        onOpenExport={() => {
          setIsPreviewModalOpen(false);
          setIsExportModalOpen(true);
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      <PexelsSearchModal
        isOpen={isPexelsModalOpen}
        onClose={() => setIsPexelsModalOpen(false)}
        onSelectImage={(url) => {
          if (fabricCanvasRef.current) {
            addImageToCanvas(fabricCanvasRef.current, url);
            updateLayersList();
            recordHistory();
            setIsPexelsModalOpen(false);
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
            setTimeout(() => {
              document.getElementById('canvas-area-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            onShowToast(t.elImageInsertedTitle, t.elImageInsertedMsg, 'success');
          }
        }}
      />

      <ShapesModal
        isOpen={isShapesModalOpen}
        onClose={() => setIsShapesModalOpen(false)}
        onSelectShape={(shape, fill) => {
          if (fabricCanvasRef.current) {
            if (shape.type === 'rect') addRectangleToCanvas(fabricCanvasRef.current, { fill, rx: 0 });
            else if (shape.type === 'circle') addCircleToCanvas(fabricCanvasRef.current, fill);
            else if (shape.type === 'triangle') addTriangleToCanvas(fabricCanvasRef.current, fill);
            else if (shape.type === 'star') addStarToCanvas(fabricCanvasRef.current, fill);
            else if (shape.svgPath) {
              addSvgShapeToCanvas(
                fabricCanvasRef.current,
                shape.svgPath,
                shape.viewBox,
                fill,
                shape.defaultStroke,
                shape.defaultStrokeWidth
              );
            }
            updateLayersList();
            recordHistory();
            onShowToast(t.elShapeTitle, `${t.elShapeAdded} ${shape.nameAr} ${t.elToBoard}`, 'success');
          }
        }}
      />

      <IconsModal
        isOpen={isIconsModalOpen}
        onClose={() => setIsIconsModalOpen(false)}
        onSelectIcon={(iconName, color) => {
          if (fabricCanvasRef.current) {
            addIconToCanvas(fabricCanvasRef.current, iconName, color);
            updateLayersList();
            recordHistory();
            onShowToast(t.elIconTitle, `${t.elIconAdded} ${iconName} ${t.elToBoard}`, 'success');
          }
        }}
      />
    </div>
  );
});
