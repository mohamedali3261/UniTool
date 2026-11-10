const NAV_STACK_KEY = 'unitool.nav.stack.v1';
const MAX_STACK = 80;

let memoryStack: string[] = [];

function normalizeEntry(rawUrl: string): string {
  try {
    const u = new URL(rawUrl, window.location.origin);
    let p = u.pathname || '/';
    if (p === '/') p = '/index.html';
    return `${p}${u.search}${u.hash}`;
  } catch {
    return rawUrl || '/index.html';
  }
}

function readStack(): string[] {
  try {
    const raw = sessionStorage.getItem(NAV_STACK_KEY);
    if (!raw) return memoryStack.slice();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((x): x is string => typeof x === 'string' && x.length > 0);
      memoryStack = valid;
      return valid;
    }
  } catch {
    /* Storage may be blocked in strict privacy contexts */
  }
  return memoryStack.slice();
}

function writeStack(stack: string[]): void {
  const trimmed = stack.slice(-MAX_STACK);
  memoryStack = trimmed;
  try {
    sessionStorage.setItem(NAV_STACK_KEY, JSON.stringify(trimmed));
  } catch {
    /* Keep in-memory stack */
  }
}

export function currentNormalizedUrl(): string {
  if (typeof window === 'undefined') return '/index.html';
  return normalizeEntry(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

/**
 * Records a page or route visit onto the tab's session navigation stack.
 * Also seeds same-origin document.referrer on the first visit in a tab.
 */
export function recordPageVisit(customUrl?: string): void {
  if (typeof window === 'undefined') return;
  const stack = readStack();

  if (stack.length === 0 && document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.origin === window.location.origin) {
        const refEntry = normalizeEntry(`${ref.pathname}${ref.search}${ref.hash}`);
        stack.push(refEntry);
      }
    } catch {
      /* ignore invalid referrer */
    }
  }

  const target = normalizeEntry(customUrl ?? currentNormalizedUrl());
  if (stack[stack.length - 1] !== target) {
    stack.push(target);
    writeStack(stack);
  }
}

/**
 * Keeps the session stack aligned when the user triggers browser Back / Forward.
 */
export function syncStackOnPopState(customUrl?: string): void {
  if (typeof window === 'undefined') return;
  const target = normalizeEntry(customUrl ?? currentNormalizedUrl());
  const stack = readStack();
  const idx = stack.lastIndexOf(target);
  if (idx !== -1) {
    writeStack(stack.slice(0, idx + 1));
  } else {
    stack.push(target);
    writeStack(stack);
  }
}

export function getPreviousVisitedUrl(): string | null {
  const stack = readStack();
  if (stack.length >= 2) {
    return stack[stack.length - 2];
  }
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.origin === window.location.origin) {
        const entry = normalizeEntry(`${ref.pathname}${ref.search}${ref.hash}`);
        if (entry !== currentNormalizedUrl()) return entry;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function canStepBackInSession(): boolean {
  if (typeof window === 'undefined') return false;
  return window.history.length > 1 && getPreviousVisitedUrl() !== null;
}

export function stepBackInSession(
  fallbackUrl = '/index.html',
  onFallback?: () => void,
): void {
  if (typeof window === 'undefined') return;
  if (canStepBackInSession()) {
    window.history.back();
    return;
  }
  if (onFallback) {
    onFallback();
    return;
  }
  window.location.assign(fallbackUrl);
}
