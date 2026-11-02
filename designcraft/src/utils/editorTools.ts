import { fabric } from 'fabric';

export function newObjectId(): string {
  return `obj-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

export function selectedObjects(object: fabric.Object | undefined): fabric.Object[] {
  if (!object) return [];
  if (object.type === 'activeSelection') return (object as fabric.ActiveSelection).getObjects();
  return [object];
}

export function groupSelection(canvas: fabric.Canvas, name: string): 'grouped' | 'locked' | 'invalid' {
  const active = canvas.getActiveObject();
  const objects = selectedObjects(active);
  if (!active || active.type !== 'activeSelection' || objects.length < 2) return 'invalid';
  if (objects.some(object => object.lockMovementX || object.lockMovementY)) return 'locked';
  objects.forEach(object => { (object as any).id ||= newObjectId(); });
  const group = (active as fabric.ActiveSelection).toGroup();
  group.set({ id: newObjectId(), name } as any);
  group.setCoords();
  canvas.setActiveObject(group);
  canvas.fire('selection:updated', { target: group });
  canvas.requestRenderAll();
  return 'grouped';
}

export function ungroupSelection(canvas: fabric.Canvas): boolean {
  const active = canvas.getActiveObject();
  if (!active || active.type !== 'group') return false;
  const selection = (active as fabric.Group).toActiveSelection();
  if (!selection) return false;
  selection.getObjects().forEach(object => {
    (object as any).id ||= newObjectId();
    object.setCoords();
  });
  selection.setCoords();
  canvas.fire('selection:updated', { target: selection });
  canvas.requestRenderAll();
  return true;
}

/** Recolor vector/text children without tinting photos or changing transparent fills. */
export function applyBrandColor(canvas: fabric.Canvas, color: string): number {
  let changed = 0;
  const visit = (object: fabric.Object) => {
    const children = (object as fabric.Group).getObjects?.();
    if (children?.length) { children.forEach(visit); return; }
    if (object.type === 'image') return;
    if ((object.type === 'line' || !object.fill || object.fill === 'none') && object.stroke && object.stroke !== 'none') {
      object.set('stroke', color);
      changed++;
    } else if (object.fill && object.fill !== 'none') {
      object.set('fill', color);
      changed++;
    }
    object.dirty = true;
  };
  selectedObjects(canvas.getActiveObject()).forEach(visit);
  if (changed) {
    canvas.requestRenderAll();
    canvas.fire('selection:updated', { target: canvas.getActiveObject() });
  }
  return changed;
}

export function backgroundPreviewColor(background: unknown): string {
  if (typeof background === 'string' && background) return background;
  const stops = (background as any)?.colorStops;
  return typeof stops?.[0]?.color === 'string' ? stops[0].color : '#FFFFFF';
}
