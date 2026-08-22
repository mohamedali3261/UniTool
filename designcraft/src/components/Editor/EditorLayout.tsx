import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { SidebarTabs } from './Sidebar/SidebarTabs';
import { TextTab } from './Sidebar/TextTab';
import { ElementsTab } from './Sidebar/ElementsTab';
import { IconsTab } from './Sidebar/IconsTab';
import { ImagesTab } from './Sidebar/ImagesTab';
import { OrnamentsTab } from './Sidebar/OrnamentsTab';
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
  applyColorToObject,
  applyColorToGroupChildren,
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

interface EditorLayoutProps {
  initialProject: ProjectItem;
  onBackToDashboard: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  initialProject,
  onBackToDashboard,
  onShowToast
}) => {
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
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTabType | null>('text');
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
        let name = 'عنصر';
        const type = obj.type || 'object';
        if (type === 'textbox' || type === 'i-text' || type === 'text') {
          name = obj.text ? `نص: "${obj.text.substring(0, 12)}..."` : 'نص';
        } else if (type === 'rect') {
          name = 'مستطيل';
        } else if (type === 'circle') {
          name = 'دائرة';
        } else if (type === 'triangle') {
          name = 'مثلث';
        } else if (type === 'image') {
          name = 'صورة';
        } else if (type === 'group') {
          name = obj.name || 'مجموعة أو أيقونة';
        } else if (type === 'path') {
          name = 'مسار فيكتور / شكل';
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
      onShowToast('تراجع', 'تم التراجع عن خطوة واحدة', 'info');
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
      onShowToast('إعادة', 'تمت إعادة الخطوة الملغاة', 'info');
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
      onShowToast('تم النسخ', 'تم نسخ العنصر بنجاح', 'info');
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
      } else if (key === 'fill' || key === 'stroke') {
        // Set on the object itself, then propagate into SVG icon group children
        (active as any).set(key, value);
        if (active.type === 'group') {
          applyColorToGroupChildren(active, { [key]: value });
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

  // Save Project Action
  const handleSaveProject = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
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

    const thumb = canvas.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 });

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

    setTimeout(() => {
      setIsSaving(false);
      onShowToast('تم الحفظ بنجاح', 'تم حفظ التغييرات على جهازك بنجاح', 'success');
    }, 400);
  }, [initialProject, projectTitle, canvasWidth, canvasHeight, backgroundColor, onShowToast]);

  // Open Export Modal
  const handleOpenExport = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  // Open Preview Modal
  const handleOpenPreview = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const url = exportCanvasImage(canvas, 'png', 1, 1);
    setPreviewUrl(url);
    setIsPreviewModalOpen(true);
  }, []);

  // Resize Canvas Action
  const handleResizeCanvas = useCallback((w: number, h: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setCanvasWidth(w);
    setCanvasHeight(h);
    canvas.setDimensions({ width: w * zoom, height: h * zoom });
    canvas.renderAll();
    onShowToast('تغيير الأبعاد', `تم تعديل قياس اللوحة إلى ${w} × ${h} بكسل`, 'info');
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
    onShowToast('تغيير خلفية الكانفاس', 'تم تطبيق اللون بنجاح', 'success');
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

    const width = canvas.getWidth() || 1080;
    const height = canvas.getHeight() || 1080;

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
    onShowToast('تغير خلفية الكانفاس', 'تم تطبيق التدرج اللوني بنجاح', 'success');
  }, [onShowToast, recordHistory]);

  const handleSetBackgroundPattern = useCallback((patternItem: BackgroundPatternItem) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (patternItem.type === 'svg-pattern') {
      setCanvasPatternBackground(canvas, patternItem.sourceUrl, () => {
        onShowToast('تغيير الخلفية', `تم تطبيق ${patternItem.nameAr}`, 'success');
        recordHistory();
      });
    } else {
      setCanvasWallpaperBackground(canvas, patternItem.sourceUrl, () => {
        onShowToast('تغيير الخلفية', `تم تطبيق ${patternItem.nameAr}`, 'success');
        recordHistory();
      });
    }
  }, [onShowToast, recordHistory]);

  // Image Filter Handler
  const handleApplyImageFilter = useCallback((filterName: string) => {
    const canvas = fabricCanvasRef.current;
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
    onShowToast('تعديل الصورة', `تم تنفيذ الإجراء: ${filterName}`, 'info');
  }, [onShowToast]);

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
      case 'text': return 'إضافة وتنسيق النصوص';
      case 'elements': return 'الأشكال والعناصر';
      case 'ornaments': return 'الزخارف والنقوش الإسلامية';
      case 'icons': return 'مكتبة الأيقونات والرموز';
      case 'images': return 'مكتبة صور';
      case 'layers': return 'إدارة الطبقات';
      default: return 'الأدوات';
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
                addTextToCanvas(fabricCanvasRef.current, 'عنوان رئيسي جذاب', { fontSize: 44, fontWeight: 'bold' });
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddSubheading={() => {
              if (fabricCanvasRef.current) {
                addTextToCanvas(fabricCanvasRef.current, 'عنوان فرعي توضيحي', { fontSize: 28, fontWeight: '600' });
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onAddBodyText={() => {
              if (fabricCanvasRef.current) {
                addTextToCanvas(fabricCanvasRef.current, 'هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى.', { fontSize: 18 });
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
      case 'icons':
        return (
          <IconsTab
            onAddIcon={(iconName, color) => {
              if (fabricCanvasRef.current) {
                addIconToCanvas(fabricCanvasRef.current, iconName, color);
                updateLayersList();
                recordHistory();
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            onUpdateSelectedIconColor={(color) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const active = canvas.getActiveObject();
              if (!active || active.type !== 'group') return;
              applyColorToObject(active, { fill: color, stroke: color });
              canvas.renderAll();
              setActiveProperties((prev) => (prev ? { ...prev, fill: color, stroke: color } : null));
              recordHistory();
            }}            onOpenIconsModal={() => setIsIconsModalOpen(true)}
          />
        );
      case 'images':
        return (
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
                onShowToast('إطار هاتف', 'تم إضافة هيكل هاتف ذكي تفاعلي لموك أب الصور', 'success');
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
          />
        );
      case 'ornaments':
        return (
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
                onShowToast('إدراج زخرفة', `تمت إضافة ${item.nameAr} إلى اللوحة`, 'success');
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }
            }}
            canvasBackgroundColor={backgroundColor}
            onChangeCanvasColor={handleSetBackgroundColor}
            onChangeCanvasGradient={handleSetBackgroundGradient}
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
                canvas.bringForward(found.rawObject);
                canvas.renderAll();
                updateLayersList();
                recordHistory();
              }
            }}
            onMoveLayerDown={(id) => {
              const canvas = fabricCanvasRef.current;
              if (!canvas) return;
              const found = layersList.find((l) => l.id === id);
              if (found && found.rawObject) {
                canvas.sendBackwards(found.rawObject);
                canvas.renderAll();
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
    <div id="editor-layout" className="h-screen w-screen bg-[#070D1E] flex flex-col overflow-hidden select-none font-sans">
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

      {/* 2. Workspace Body: Rail + Drawer + Canvas Area + Properties Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost Sidebar Icon Rail (Desktop only) */}
        <SidebarTabs
          activeTab={isSidebarOpen ? activeSidebarTab : null}
          onSelectTab={handleSelectSidebarTab}
          variant="rail"
        />

        {/* Desktop Sidebar Expanded Drawer Panel */}
        {isSidebarOpen && (
          <div className="hidden md:flex flex-col w-80 bg-[#1C2541] border-l border-slate-700/60 shrink-0 h-full overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-[#0B132B] border-b border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {getTabTitle(activeSidebarTab)}
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
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
          return exportCanvasImage(fabricCanvasRef.current, format, quality, multiplier);
        }}
        onExportSvg={() => {
          if (!fabricCanvasRef.current) return '';
          return exportCanvasSvg(fabricCanvasRef.current);
        }}
        onExportPdf={async (filename) => {
          if (!fabricCanvasRef.current) return;
          await exportCanvasPdf(fabricCanvasRef.current, filename);
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
            onShowToast('تم إدراج الصورة بنجاح', 'تمت إضافة الصورة إلى لوحة التصميم والانتقال إليها مباشرة', 'success');
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
            onShowToast('إدراج شكل', `تمت إضافة ${shape.nameAr} إلى اللوحة`, 'success');
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
            onShowToast('إدراج أيقونة', `تمت إضافة أيقونة ${iconName} إلى اللوحة`, 'success');
          }
        }}
      />
    </div>
  );
};
