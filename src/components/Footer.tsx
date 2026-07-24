interface Props {
  lang: 'ar' | 'en';
}

export function Footer({ lang }: Props) {
  return (
    <>
      {/* Designed by Mohamed Ali */}
      <div className="px-4 py-2 bg-[#0A0C0F] border-t border-[#1F2937] text-center shrink-0 sm:px-6">
        <p className="text-[9px] font-mono text-gray-600">
          {lang === 'ar' ? 'تصميم' : 'Designed by'} Eng. Mohamed Ali
        </p>
      </div>

      {/* Footer Status Bar */}
      <footer className="px-4 py-1.5 bg-[#0A0C0F] border-t border-[#1F2937] flex justify-between items-center text-[8px] text-gray-600 font-mono shrink-0 sm:px-6">
        <div className="flex gap-4 sm:gap-6">
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
            LIVE
          </span>
          <span className="hidden xs:inline">44.1kHz</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
             <span className="hidden xs:inline text-blue-500/80">WASM_THREADS:8</span>
          </div>
          <span className="text-gray-700 truncate">SONIC_CORE_SYS</span>
        </div>
      </footer>
    </>
  );
}
