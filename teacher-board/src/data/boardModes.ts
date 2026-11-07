import type { BoardSurface } from '../core/types';

export interface SurfacePalette {
  bg: string;
  line: string;
  axis: string;
  subLine: string;
  defaultInk: string;
  isDark: boolean;
}

export const SURFACE_PALETTES: Record<BoardSurface, SurfacePalette> = {
  white: {
    bg: '#ffffff',
    line: 'rgba(36, 121, 94, 0.15)',
    subLine: 'rgba(220, 38, 38, 0.22)',
    axis: '#2f5e4d',
    defaultInk: '#182620',
    isDark: false,
  },
  'chalk-green': {
    bg: '#1b4733',
    line: 'rgba(255, 255, 255, 0.14)',
    subLine: 'rgba(252, 211, 77, 0.28)',
    axis: 'rgba(255, 255, 255, 0.72)',
    defaultInk: '#f8faf8',
    isDark: true,
  },
  blackboard: {
    bg: '#141718',
    line: 'rgba(255, 255, 255, 0.11)',
    subLine: 'rgba(52, 211, 153, 0.28)',
    axis: 'rgba(226, 232, 240, 0.72)',
    defaultInk: '#f8fafc',
    isDark: true,
  },
  sepia: {
    bg: '#f7f1e3',
    line: 'rgba(120, 92, 56, 0.16)',
    subLine: 'rgba(185, 68, 48, 0.22)',
    axis: '#5c472c',
    defaultInk: '#2a2118',
    isDark: false,
  },
};

export const PEN_COLORS = [
  '#182620',
  '#f8fafc',
  '#24795e',
  '#dc2626',
  '#2563eb',
  '#d97706',
  '#7c3aed',
  '#db2777',
];

export const STICKY_COLORS = [
  '#fef3c7',
  '#dcfce7',
  '#dbeafe',
  '#fce7f3',
  '#ede9fe',
];
