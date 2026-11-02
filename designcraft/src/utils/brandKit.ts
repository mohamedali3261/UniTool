export const BRAND_KIT_KEY = 'designcraft_brand_kit_v1';
export const MAX_BRAND_COLORS = 24;

export function normalizeBrandColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(hex)) return `#${hex.slice(1).split('').map(c => c + c).join('')}`.toUpperCase();
  return null;
}

export function parseBrandColors(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.map(normalizeBrandColor).filter((c): c is string => !!c))].slice(0, MAX_BRAND_COLORS);
  } catch {
    return [];
  }
}

export function mergeBrandColors(current: readonly string[], incoming: readonly string[]) {
  const colors = [...current];
  let added = 0;
  let skipped = 0;
  for (const value of incoming) {
    const color = normalizeBrandColor(value);
    if (!color || colors.includes(color)) continue;
    if (colors.length >= MAX_BRAND_COLORS) { skipped++; continue; }
    colors.push(color);
    added++;
  }
  return { colors, added, skipped };
}

/** Collect explicit design colors only; never inspect image data or remote resources. */
export function collectDesignColors(value: unknown): string[] {
  const found: string[] = [];
  const seen = new Set<unknown>();
  const visit = (node: unknown, key = '', depth = 0) => {
    if (depth > 30 || found.length >= MAX_BRAND_COLORS) return;
    if (typeof node === 'string') {
      if (['fill', 'stroke', 'background', 'backgroundColor', 'textBackgroundColor', 'color'].includes(key)) {
        const color = normalizeBrandColor(node);
        if (color && !found.includes(color)) found.push(color);
      }
      return;
    }
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(child => visit(child, key, depth + 1));
    } else {
      for (const [childKey, child] of Object.entries(node)) {
        if (childKey !== 'src' && childKey !== '_originalSrc') visit(child, childKey, depth + 1);
      }
    }
  };
  visit(value);
  return found;
}
