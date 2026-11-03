export interface RecoveryEntry { id: string; projectId: string; created: number; data: string }
/** Only disposable recovery history is trimmed, never the actual saved projects. */
export function retainedRecovery(entries: RecoveryEntry[], latest: RecoveryEntry, maxBytes = 24 * 1024 * 1024) {
  const sorted = [...entries.filter(p => p.id !== latest.id), latest].sort((a, b) =>
    a.id === latest.id ? -1 : b.id === latest.id ? 1 : b.created - a.created);
  const counts = new Map<string, number>(), kept: RecoveryEntry[] = [];
  let bytes = 0;
  for (const point of sorted) {
    const size = new Blob([point.data]).size, count = counts.get(point.projectId) || 0;
    if (kept.length && (kept.length >= 20 || count >= 5 || bytes + size > maxBytes)) continue;
    kept.push(point); counts.set(point.projectId, count + 1); bytes += size;
  }
  return kept;
}
