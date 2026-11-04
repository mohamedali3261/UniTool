export function elementKind(type: string) {
  if (['text', 'textbox', 'i-text'].includes(type)) return 'text';
  if (type === 'image') return 'image';
  if (type === 'line' || type === 'polyline') return 'line';
  if (type === 'group' || type === 'activeSelection') return 'group';
  if (
    ['rect', 'circle', 'ellipse', 'triangle', 'polygon', 'path'].includes(type)
  )
    return 'shape';
  return 'object';
}
export const BLEND_MODES = [
  'source-over',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
] as const;
