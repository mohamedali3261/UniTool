import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { navItems } from '../config/navigation';
import { toolCategories } from '../pages/ToolsHome/data';

interface ToolNavigationBarProps {
  currentPage: string;
  lang: 'ar' | 'en';
  onBack: () => void;
  onGoToolsHome: () => void;
}

function resolveToolLabel(pageId: string, lang: 'ar' | 'en'): string {
  for (const cat of toolCategories) {
    for (const tool of cat.tools) {
      if (tool.id === pageId) {
        return lang === 'ar' ? tool.titleAr : tool.titleEn;
      }
    }
  }
  const nav = navItems.find((item) => item.id === pageId);
  if (nav) {
    return lang === 'ar' ? nav.labelAr : nav.labelEn;
  }
  if (pageId === 'compress') {
    return lang === 'ar' ? 'ضغط وتحويل الصوتيات' : 'Audio Compressor';
  }
  return pageId;
}

export function ToolNavigationBar({
  currentPage,
  lang,
  onBack,
  onGoToolsHome,
}: ToolNavigationBarProps) {
  if (currentPage === 'toolsHome') return null;

  const ar = lang === 'ar';
  const BackArrow = ar ? ArrowRight : ArrowLeft;
  const CrumbSep = ar ? ChevronLeft : ChevronRight;
  const currentTitle = resolveToolLabel(currentPage, lang);

  return (
    <div
      data-testid="tool-back-bar"
      className="ut-tool-back-bar flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          data-testid="tool-back-button"
          onClick={onBack}
          aria-label={ar ? 'رجوع للصفحة السابقة' : 'Back to previous page'}
          className="ut-tool-back-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
        >
          <BackArrow size={14} />
          <span>{ar ? 'رجوع' : 'Back'}</span>
        </button>

        <nav
          aria-label={ar ? 'مسار الأداة' : 'Tool breadcrumb'}
          className="flex items-center gap-1 text-[11px] min-w-0 truncate"
        >
          <button
            type="button"
            onClick={onGoToolsHome}
            className="ut-tool-crumb-root inline-flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition-colors shrink-0"
          >
            <LayoutDashboard size={12} />
            <span className="hidden xs:inline sm:inline">
              {ar ? 'كل الأدوات' : 'All Tools'}
            </span>
          </button>
          <CrumbSep size={12} className="ut-tool-crumb-sep shrink-0" />
          <span className="ut-tool-crumb-current font-bold truncate">
            {currentTitle}
          </span>
        </nav>
      </div>
    </div>
  );
}
