export function StorageArt({ lang }: { lang: 'ar' | 'en' }) {
  return <svg viewBox="0 0 500 300" width="100%" height="100%" aria-hidden="true">
    <rect x="60" y="45" width="380" height="220" rx="24" fill="#112e29" stroke="#94d8b455" />
    <path d="M110 100v115h280V100H270l-25-25H110v25Z" fill="#84cba8" opacity=".2" stroke="#94d8b4" strokeWidth="3" />
    <g fill="#b0ebc9">{[0,1,2].map(i => <rect key={i} x={145+i*76} y="128" width="52" height="57" rx="8" />)}</g>
    <path d="M250 24v55m-15-16 15 16 15-16" stroke="#daf5d6" strokeWidth="5" fill="none" strokeLinecap="round" />
    <text x="250" y="240" textAnchor="middle" fill="#c7ebd3" fontSize="15">{lang === 'ar' ? 'نسخة واحدة · كل شغلك المحفوظ' : 'ONE ZIP · YOUR SAVED WORK'}</text>
  </svg>;
}
