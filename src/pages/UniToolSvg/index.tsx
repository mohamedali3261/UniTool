import type { RefObject } from 'react';

interface Props {
  lang: 'ar' | 'en';
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onIframeLoad: () => void;
}

export function UniToolSvg({ lang, iframeRef, onIframeLoad }: Props) {
  return (
    <section className="flex flex-1 min-h-[calc(100vh-3.5rem)] flex-col bg-[#0A0C0F]">
      <div className="shrink-0 border-b border-white/[0.06] px-4 py-2.5 sm:px-6">
        <h1 className="text-sm font-semibold text-white">
          {lang === 'ar' ? 'محرر UniTool SVG' : 'UniTool SVG Editor'}
        </h1>
        <p className="mt-0.5 text-[10px] text-gray-500">
          {lang === 'ar' ? 'أنشئ وحرّر وصدّر الرسوم المتحركة بصيغة SVG.' : 'Create, edit and export animated SVGs.'}
        </p>
      </div>
      <iframe
        ref={iframeRef}
        src="/unitool-svg-editor/index.html"
        onLoad={onIframeLoad}
        title={lang === 'ar' ? 'محرر UniTool SVG' : 'UniTool SVG editor'}
        className="min-h-[calc(100vh-8rem)] w-full flex-1 shrink-0 border-0 bg-white lg:min-h-[min(900px,calc(100vh+2rem))]"
      />
    </section>
  );
}
