import { House, Grid2X2, Palette, Film, PenTool, Shapes, Presentation, Table2, BookOpen, HardDrive } from 'lucide-react';
import { sitePages } from '../config/sitePages';

/** Navigation-only grouping. Removing a link never removes its workspace. */
const icons = [House, Grid2X2, Palette, Film, PenTool, Shapes, Presentation, Table2, BookOpen, HardDrive];
const groups = [
  { id: 'start', ar: 'ابدأ من هنا', en: 'Start here', hrefs: ['/index.html', '/app.html'] },
  { id: 'create', ar: 'التصميم والإبداع', en: 'Design & create', hrefs: ['/designcraft.html', '/video-studio.html', '/logo-designer/', '/unitool-svg.html'] },
  { id: 'work', ar: 'التعليم والبيانات', en: 'Teach & organize', hrefs: ['/teacher-board/', '/excel-studio/', '/the-audio-reader.html', '/storage.html'] },
];
let index = 0;
export const navbarSections = groups.map(group => ({
  ...group,
  pages: group.hrefs.map(href => {
    const page = sitePages.find(page => page.href === href);
    if (!page) throw new Error(`Unknown navigation page: ${href}`);
    return { ...page, icon: icons[index++] };
  }),
}));

export function isCurrentSitePage(href: string, pathname: string) {
  return pathname === href || (href === '/index.html' && pathname === '/')
    || (href.endsWith('/') && pathname === `${href}index.html`);
}
