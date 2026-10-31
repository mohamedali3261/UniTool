/** بحث عربي متسامح مع التشكيل وأشكال الألف، بدون تغيير الأسماء المعروضة. */
export const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .trim();
export function matchesSearch(query: string, ...values: string[]) {
  const haystack = normalizeSearch(values.join(" "));
  return normalizeSearch(query)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}
