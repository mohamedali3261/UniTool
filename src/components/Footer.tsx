interface Props {
  lang: 'ar' | 'en';
}

export function Footer({ lang }: Props) {
  return (
    <footer className="mt-auto shrink-0 border-t border-[#1F2937] bg-[#0A0C0F] px-4 py-2 text-center sm:px-6">
      <p className="text-[9px] font-mono text-gray-600">
        {lang === 'ar' ? 'تصميم' : 'Designed by'} Eng. Mohamed Ali
      </p>
    </footer>
  );
}
