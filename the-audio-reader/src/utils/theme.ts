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
  const sepia = theme === 'sepia';
  return {
    wrapper: 'bg-[var(--site-page)] text-[var(--site-ink)]',
    navbar: 'bg-[var(--site-panel)] border-[var(--site-line)] text-[var(--site-ink)]',
    sidebar: 'bg-[var(--site-panel)] border-[var(--site-line)] text-[var(--site-ink)]',
    canvas: sepia ? 'bg-[#fbf4e6] border-[#dacfb8] text-[#4a3c2b]' : theme === 'midnight' ? 'bg-[#080808] border-[var(--site-line)] text-[var(--site-ink)]' : 'bg-[var(--site-panel)] border-[var(--site-line)] text-[var(--site-ink)]',
    controls: 'bg-[var(--site-panel)] border-[var(--site-line)] text-[var(--site-ink)]',
    player: 'bg-[var(--site-panel)] border-[var(--site-line)] text-[var(--site-ink)]',
    modal: 'bg-[var(--site-panel)] border-[var(--site-line)] text-[var(--site-ink)]',
    activeChunk: sepia ? 'text-[#4a3c2b]' : 'text-[var(--site-ink)]',
    wordHighlight: `${sepia ? 'text-[#24795e]' : 'text-[var(--site-accent-ink)]'} font-medium underline decoration-emerald-500 decoration-2`,
    inactiveChunk: sepia ? 'text-[#64533b]' : 'text-[var(--site-muted)] hover:text-[var(--site-ink)]',
    buttonSecondary: 'bg-[var(--site-raised)] border-[var(--site-line)] text-[var(--site-ink)]',
    textPrimary: 'text-[var(--site-ink)]',
    textMuted: 'text-[var(--site-muted)]',
    borderColor: 'border-[var(--site-line)]',
    headingText: 'text-[var(--site-accent-ink)] border-[var(--site-line)]',
  };
}
