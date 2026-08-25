import { ThemeMode } from '../types';

export interface ThemeConfig {
  wrapper: string;
  navbar: string;
  sidebar: string;
  canvas: string;
  controls: string;
  player: string;
  modal: string;
  activeChunk: string;
  wordHighlight: string;
  inactiveChunk: string;
  buttonSecondary: string;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
  headingText: string;
}

export function getThemeConfig(theme: ThemeMode): ThemeConfig {
  switch (theme) {
    case 'light':
      // Mapped to Deep Emerald Dark Mode (زمردي ليلي)
      return {
        wrapper: 'bg-[#031e17] text-[#e6f4f1]',
        navbar: 'bg-[#031e17]/90 border-[#0f4d3d] shadow-md text-[#e6f4f1]',
        sidebar: 'bg-[#04241c]/95 border-[#0f4d3d] text-[#e6f4f1]',
        canvas: 'bg-[#062d23] border-[#0f4d3d] shadow-2xl text-[#e6f4f1]',
        controls: 'bg-[#062d23]/90 border-[#0f4d3d] shadow-md text-[#e6f4f1]',
        player: 'bg-[#031e17]/95 border-[#0f4d3d] shadow-2xl text-[#e6f4f1]',
        modal: 'bg-[#062d23] border-[#0f4d3d] text-[#e6f4f1] shadow-2xl',
        activeChunk: 'text-[#e6f4f1]',
        wordHighlight: 'text-emerald-300 font-medium underline decoration-emerald-400 decoration-2',
        inactiveChunk: 'text-[#d1ebe5] hover:bg-[#0b3d30]/80 hover:text-white',
        buttonSecondary: 'bg-[#0b3d30] border-[#0f4d3d] text-[#d1ebe5] hover:bg-[#0f4d3d] hover:text-white',
        textPrimary: 'text-[#e6f4f1]',
        textMuted: 'text-[#6ee7b7]',
        borderColor: 'border-[#0f4d3d]',
        headingText: 'text-emerald-400 border-[#0f4d3d]',
      };

    case 'sepia':
      // Mapped to Warm Charcoal / Amber Night Mode (داكن دافئ)
      return {
        wrapper: 'bg-[#141210] text-[#f0e6d2]',
        navbar: 'bg-[#191613]/90 border-[#362e28] shadow-md text-[#f0e6d2]',
        sidebar: 'bg-[#191613]/95 border-[#362e28] text-[#f0e6d2]',
        canvas: 'bg-[#1f1b18] border-[#362e28] shadow-2xl text-[#f0e6d2]',
        controls: 'bg-[#1f1b18]/90 border-[#362e28] shadow-md text-[#f0e6d2]',
        player: 'bg-[#141210]/95 border-[#362e28] shadow-2xl text-[#f0e6d2]',
        modal: 'bg-[#1f1b18] border-[#362e28] text-[#f0e6d2] shadow-2xl',
        activeChunk: 'text-[#f0e6d2]',
        wordHighlight: 'text-amber-400 font-medium underline decoration-amber-500 decoration-2',
        inactiveChunk: 'text-[#e7d7bd] hover:bg-[#2c241e]/80 hover:text-white',
        buttonSecondary: 'bg-[#26201b] border-[#3d3229] text-[#e7d7bd] hover:bg-[#362e28] hover:text-white',
        textPrimary: 'text-[#f0e6d2]',
        textMuted: 'text-[#a89984]',
        borderColor: 'border-[#362e28]',
        headingText: 'text-[#f59e0b] border-[#362e28]',
      };

    case 'midnight':
      // Obsidian Black Night Mode (أسود حلكي)
      return {
        wrapper: 'bg-black text-zinc-100',
        navbar: 'bg-zinc-950/90 border-zinc-900 shadow-md text-zinc-100',
        sidebar: 'bg-zinc-950/95 border-zinc-900 text-zinc-200',
        canvas: 'bg-zinc-950 border-zinc-900 shadow-xl text-zinc-100',
        controls: 'bg-zinc-950/90 border-zinc-900 shadow-md text-zinc-200',
        player: 'bg-zinc-950/95 border-zinc-900 shadow-2xl text-zinc-100',
        modal: 'bg-zinc-950 border-zinc-900 text-zinc-100 shadow-2xl',
        activeChunk: 'text-zinc-100',
        wordHighlight: 'text-purple-300 font-medium underline decoration-purple-400 decoration-2',
        inactiveChunk: 'text-zinc-200 hover:bg-zinc-900/80 hover:text-white',
        buttonSecondary: 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white',
        textPrimary: 'text-zinc-100',
        textMuted: 'text-zinc-400',
        borderColor: 'border-zinc-900',
        headingText: 'text-purple-400 border-zinc-800',
      };

    case 'dark':
    default:
      // Classic Slate Night Mode (داكن كلاسيكي)
      return {
        wrapper: 'bg-slate-950 text-slate-100',
        navbar: 'bg-slate-950/90 border-slate-800/80 shadow-md text-slate-100',
        sidebar: 'bg-slate-900/95 border-slate-800 text-slate-200',
        canvas: 'bg-slate-900/80 border-slate-800/80 shadow-xl text-slate-100',
        controls: 'bg-slate-900/90 border-slate-800 shadow-md text-slate-200',
        player: 'bg-slate-950/95 border-slate-800 shadow-2xl text-slate-100',
        modal: 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl',
        activeChunk: 'text-slate-100',
        wordHighlight: 'text-indigo-300 font-medium underline decoration-indigo-400 decoration-2',
        inactiveChunk: 'text-slate-200 hover:bg-slate-800/60 hover:text-white',
        buttonSecondary: 'bg-slate-850/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white',
        textPrimary: 'text-slate-100',
        textMuted: 'text-slate-400',
        borderColor: 'border-slate-800',
        headingText: 'text-indigo-400 border-slate-800',
      };
  }
}
