/**
 * Undo / redo history.
 *
 * The editor snapshots the *document* (glyph edits, advances, kerning) after each
 * committed action. Snapshots are structural clones so history entries can never
 * be mutated by later drawing, and every entry carries a bilingual label that the
 * history panel shows to the user.
 */

export interface HistoryEntry<T> {
  id: number;
  labelAr: string;
  labelEn: string;
  at: number;
  state: T;
}

export interface HistoryState<T> {
  entries: HistoryEntry<T>[];
  pointer: number;
  limit: number;
  nextId: number;
}

export function createHistory<T>(initial: T, options: { maxEntries?: number; labelAr?: string; labelEn?: string } = {}): HistoryState<T> {
  const limit = Math.max(2, options.maxEntries ?? 80);
  return {
    entries: [
      {
        id: 0,
        labelAr: options.labelAr ?? 'البداية',
        labelEn: options.labelEn ?? 'Initial state',
        at: Date.now(),
        state: clone(initial),
      },
    ],
    pointer: 0,
    limit,
    nextId: 1,
  };
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      /* fall through to JSON */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Records a new state and drops any redo branch. */
export function commit<T>(
  history: HistoryState<T>,
  state: T,
  labelAr: string,
  labelEn: string,
): HistoryState<T> {
  const trimmed = history.entries.slice(0, history.pointer + 1);
  const entry: HistoryEntry<T> = {
    id: history.nextId,
    labelAr,
    labelEn,
    at: Date.now(),
    state: clone(state),
  };
  const entries = [...trimmed, entry].slice(-history.limit);
  return { ...history, entries, pointer: entries.length - 1, nextId: history.nextId + 1 };
}

export function canUndo<T>(history: HistoryState<T>) {
  return history.pointer > 0;
}

export function canRedo<T>(history: HistoryState<T>) {
  return history.pointer < history.entries.length - 1;
}

export function undo<T>(history: HistoryState<T>): HistoryState<T> {
  if (!canUndo(history)) return history;
  return { ...history, pointer: history.pointer - 1 };
}

export function redo<T>(history: HistoryState<T>): HistoryState<T> {
  if (!canRedo(history)) return history;
  return { ...history, pointer: history.pointer + 1 };
}

export function current<T>(history: HistoryState<T>): T {
  return history.entries[history.pointer].state;
}

/** Jump to a specific entry from the history list. */
export function jumpTo<T>(history: HistoryState<T>, id: number): HistoryState<T> {
  const index = history.entries.findIndex((entry) => entry.id === id);
  if (index === -1) return history;
  return { ...history, pointer: index };
}

/** Compact list for the UI (newest first). */
export function listHistory<T>(history: HistoryState<T>) {
  return [...history.entries]
    .map((entry, index) => ({
      id: entry.id,
      labelAr: entry.labelAr,
      labelEn: entry.labelEn,
      at: entry.at,
      index,
      active: index === history.pointer,
      future: index > history.pointer,
    }))
    .reverse();
}

export function clearHistory<T>(history: HistoryState<T>, state: T, labelAr = 'مسح السجل', labelEn = 'History cleared'): HistoryState<T> {
  const base = createHistory(state, { maxEntries: history.limit, labelAr, labelEn });
  return { ...base, nextId: history.nextId + 1 };
}
