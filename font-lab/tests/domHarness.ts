/**
 * A tiny browser stand-in for the Node test runner.
 *
 * The studio is a real browser app (FontFace, ResizeObserver, Blob URLs), so the
 * tests mount it in jsdom with just enough of the platform stubbed to prove the
 * components actually render and the export pipeline actually runs.
 */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

// stylesheet imports are no-ops outside the bundler
try {
  register('./cssLoader.mjs', import.meta.url);
} catch {
  /* loader already registered */
}

export function setupDom() {
  const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>', {
    url: 'https://unitool.test/font-lab/',
    pretendToBeVisual: true,
  });

  const globalAny = globalThis as any;
  globalAny.window = dom.window;
  globalAny.document = dom.window.document;
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
  globalAny.HTMLElement = dom.window.HTMLElement;
  globalAny.Element = dom.window.Element;
  globalAny.Node = dom.window.Node;
  globalAny.localStorage = dom.window.localStorage;
  globalAny.location = dom.window.location;
  globalAny.history = dom.window.history;
  globalAny.sessionStorage = dom.window.sessionStorage;
  globalAny.getComputedStyle = dom.window.getComputedStyle;
  globalAny.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 0) as unknown as number;
  globalAny.cancelAnimationFrame = (id: number) => clearTimeout(id);
  globalAny.IS_REACT_ACT_ENVIRONMENT = true;

  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalAny.ResizeObserver = ResizeObserverStub;
  dom.window.ResizeObserver = ResizeObserverStub as any;

  class FontFaceStub {
    family: string;
    constructor(family: string) {
      this.family = family;
    }
    load() {
      return Promise.resolve(this);
    }
  }
  globalAny.FontFace = FontFaceStub;
  dom.window.FontFace = FontFaceStub as any;

  const fonts = {
    add: () => undefined,
    delete: () => undefined,
    ready: Promise.resolve(),
  };
  Object.defineProperty(dom.window.document, 'fonts', { value: fonts, configurable: true });

  if (!('createObjectURL' in dom.window.URL)) {
    (dom.window.URL as any).createObjectURL = () => 'blob:stub';
    (dom.window.URL as any).revokeObjectURL = () => undefined;
  }
  globalAny.URL.createObjectURL = (dom.window.URL as any).createObjectURL;
  globalAny.URL.revokeObjectURL = (dom.window.URL as any).revokeObjectURL;

  // jsdom has no canvas implementation: the PNG path is exercised through the
  // pure SVG builder instead, so getContext returns null there.
  dom.window.HTMLCanvasElement.prototype.getContext = (() => null) as any;
  dom.window.HTMLCanvasElement.prototype.toDataURL = (() => 'data:image/png;base64,') as any;

  return dom;
}

/** Serves the bundled .ttf files to the app's `fetch(url)` calls. */
export function stubFontFetch(dom: JSDOM) {
  const fetchStub = async (input: RequestInfo | URL) => {
    const url = String(typeof input === 'string' ? input : (input as any).url || input);
    const match = url.match(/([A-Za-z0-9_-]+\.ttf)/);
    if (!match) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) } as any;
    const file = path.join(ROOT, 'assets', 'fonts', match[1]);
    if (!fs.existsSync(file)) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) } as any;
    const bytes = fs.readFileSync(file);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => buffer } as any;
  };
  (globalThis as any).fetch = fetchStub;
  dom.window.fetch = fetchStub as any;
}

export async function waitFor(check: () => boolean, timeout = 4000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out waiting for ${label}`);
}
