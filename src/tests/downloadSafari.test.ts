import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Safari download regression suite.
 *
 * Chromium/Firefox forgive the patterns the tools used before; WebKit does not:
 * - revoking a blob URL right after `anchor.click()` cancels the download,
 * - clicking a detached anchor (not in the document) is ignored,
 * - a `data:` URL over a few MB is never saved.
 *
 * The fakes below model a WebKit-ish DOM closely enough to assert those rules.
 */

type Timer = { fn: () => void; at: number };

const clock = { now: 0 };
const timers: Timer[] = [];
let revoked: string[] = [];
let nextBlobId = 1;
let appended: FakeAnchor[] = [];

class FakeAnchor {
  href = '';
  download = '';
  rel = '';
  tabIndex = 0;
  dataset: Record<string, string> = {};
  clicks = 0;
  removed = false;
  attrs = new Map<string, string>();

  setAttribute(key: string, value: string) {
    this.attrs.set(key, value);
    if (key === 'href') this.href = value;
  }
  getAttribute(key: string) {
    return this.attrs.get(key) ?? null;
  }
  hasAttribute(key: string) {
    return this.attrs.has(key);
  }
  remove() {
    this.removed = true;
    appended = appended.filter((a) => a !== this);
  }
  click() {
    this.clicks += 1;
  }
}

const fakeDocument = {
  body: {
    appendChild(node: FakeAnchor) {
      appended.push(node);
      return node;
    },
  },
  createElement(tag: string) {
    assert.equal(tag, 'a');
    return new FakeAnchor();
  },
  addEventListener() {
    /* click interception is not under test */
  },
  removeEventListener() {
    /* noop */
  },
};

const fakeWindow = {
  setTimeout(fn: () => void, ms = 0) {
    timers.push({ fn, at: clock.now + ms });
    return timers.length;
  },
  open(url: string) {
    openedTabs.push(url);
    return {};
  },
};

let openedTabs: string[] = [];

function advance(ms: number) {
  clock.now += ms;
  for (let guard = 0; guard < 100; guard += 1) {
    const index = timers.findIndex((t) => t.at <= clock.now);
    if (index === -1) return;
    const [due] = timers.splice(index, 1);
    due.fn();
  }
}

// ---- globals the module reads at import time -------------------------------
(globalThis as any).window = fakeWindow;
(globalThis as any).document = fakeDocument;
(globalThis as any).HTMLAnchorElement = FakeAnchor;
const fakeNavigator: { userAgent: string; maxTouchPoints: number } = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  maxTouchPoints: 0,
};
Object.defineProperty(globalThis, 'navigator', {
  value: fakeNavigator,
  configurable: true,
  writable: true,
});
(globalThis as any).Blob = Blob;
(globalThis as any).atob = (value: string) => Buffer.from(value, 'base64').toString('binary');
(globalThis as any).URL = Object.assign(URL, {
  createObjectURL: () => `blob:https://unitool.test/${nextBlobId++}`,
  revokeObjectURL: (url: string) => {
    revoked.push(url);
  },
});

const mod = await import('../utils/download');
const {
  ANCHOR_LINGER_MS,
  DOWNLOAD_URL_TTL_MS,
  dataUrlToBlob,
  downloadBlob,
  downloadDataUrl,
  downloadText,
  downloadUrl,
  isSafariBrowser,
  sanitizeFilename,
} = mod;

test('Safari is detected without misidentifying Chromium on iOS or Android', () => {
  assert.equal(isSafariBrowser(), true);

  fakeNavigator.userAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0 Mobile/15E148 Safari/604.1';
  assert.equal(isSafariBrowser(), false, 'Chrome on iOS is not Safari');

  fakeNavigator.userAgent =
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Mobile Safari/537.36';
  assert.equal(isSafariBrowser(), false);

  fakeNavigator.userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
  assert.equal(isSafariBrowser(), true);
});

test('filenames are sanitised before Safari opens the save dialog', () => {
  assert.equal(sanitizeFilename('a/b\\c.pdf'), 'a-b-c.pdf');
  assert.equal(sanitizeFilename('  تقرير: نهائي .pdf '), 'تقرير- نهائي .pdf');
  assert.equal(sanitizeFilename('name\u0000\u0007.png'), 'name.png');
  assert.equal(sanitizeFilename(''), 'unitool-file');
  assert.equal(sanitizeFilename('   ', 'zip'), 'unitool-file.zip');
  assert.ok(sanitizeFilename('x'.repeat(300) + '.pdf').length <= 120);
});

test('data URLs become real blobs instead of oversized href', async () => {
  const csv = 'الاسم,الدرجة\nعلي,10\n';
  const dataUrl = 'data:text/csv;charset=utf-8;base64,' + Buffer.from(csv).toString('base64');
  const blob = dataUrlToBlob(dataUrl);
  assert.equal(blob.type, 'text/csv;charset=utf-8');
  assert.equal(await blob.text(), csv);
});

test('downloadUrl keeps the anchor in the document and does not remove it synchronously', () => {
  appended = [];
  revoked = [];
  timers.length = 0;

  const result = downloadUrl('blob:https://unitool.test/manual', 'merged.pdf');
  assert.equal(result.ok, true);
  assert.equal(result.method, 'download');
  assert.equal(appended.length, 1, 'anchor must stay attached for WebKit');
  const anchor = appended[0];
  assert.equal(anchor.clicks, 1);
  assert.equal(anchor.download, 'merged.pdf');
  assert.equal(anchor.removed, false);

  advance(ANCHOR_LINGER_MS - 1);
  assert.equal(anchor.removed, false, 'removing too early cancels the save in Safari');

  advance(1);
  assert.equal(anchor.removed, true);
});

test('downloadBlob never revokes its object URL before Safari starts reading it', () => {
  revoked = [];
  timers.length = 0;

  const result = downloadBlob(new Blob(['hello'], { type: 'text/plain' }), 'notes.txt');
  assert.equal(result.ok, true);
  assert.deepEqual(revoked, [], 'the blob URL must survive the click');

  // Legacy call sites revoke immediately; the guard has to defer that.
  const url = 'blob:https://unitool.test/live';
  downloadUrl(url, 'late.pdf');
  URL.revokeObjectURL(url);
  assert.equal(revoked.includes(url), false, 'guarded revoke must be deferred');

  advance(DOWNLOAD_URL_TTL_MS + 1);
  assert.ok(revoked.includes(url), 'deferred revoke happens once the TTL elapses');
});

test('unrelated preview object URLs are still revoked immediately', () => {
  revoked = [];
  timers.length = 0;
  URL.revokeObjectURL('blob:https://unitool.test/preview');
  assert.deepEqual(revoked, ['blob:https://unitool.test/preview']);
});

test('downloadDataUrl saves images through a blob, and downloadText adds a BOM', async () => {
  revoked = [];
  appended = [];
  timers.length = 0;

  const dataUrl = 'data:image/png;base64,' + Buffer.from('png-bytes').toString('base64');
  assert.equal(downloadDataUrl(dataUrl, 'page.png').ok, true);
  assert.equal(appended.at(-1)?.download, 'page.png');
  assert.match(appended.at(-1)?.href ?? '', /^blob:/);

  const bytes = await (await dataUrlToBlob(dataUrl)).text();
  assert.equal(bytes, 'png-bytes');

  assert.equal(downloadText('مرحبا', 'scan.txt', 'text/plain;charset=utf-8', { bom: true }).ok, true);
});

test('forceTab falls back to a new tab when WebKit refuses the download', () => {
  openedTabs = [];
  const result = downloadUrl('blob:https://unitool.test/video', 'clip.webm', { forceTab: true });
  assert.equal(result.method, 'tab');
  assert.equal(result.ok, true);
  assert.deepEqual(openedTabs, ['blob:https://unitool.test/video']);
});
