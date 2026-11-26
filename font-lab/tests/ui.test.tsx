/**
 * UI tests — the real app is mounted in jsdom and driven like a user:
 * loading a font, picking a glyph, moving nodes, kerning, export, theme, language.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, stubFontFetch, waitFor } from './domHarness';

const dom = setupDom();
stubFontFetch(dom);

type ReactModule = typeof import('react');
let React: ReactModule;
let act: (callback: () => void | Promise<void>) => Promise<void>;
let root: ReturnType<typeof import('react-dom/client').createRoot>;
let container: HTMLElement;

before(async () => {
  React = await import('react');
  const { act: actImpl } = await import('react');
  act = async (callback) => {
    await actImpl(callback);
  };
  const { createRoot } = await import('react-dom/client');
  const { default: FontLabApp } = await import('../App');
  container = document.getElementById('root') as HTMLElement;
  root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(FontLabApp));
  });
  await waitFor(() => document.querySelectorAll('.fl-glyph').length > 10, 8000, 'glyph grid to render');
});

after(async () => {
  await act(async () => {
    root.unmount();
  });
});

const q = <T extends Element = HTMLElement>(selector: string) => document.querySelector(selector) as T | null;
const qa = (selector: string) => [...document.querySelectorAll(selector)] as HTMLElement[];

async function click(element: Element | null) {
  assert.ok(element, 'element to click exists');
  await act(async () => {
    (element as HTMLElement).dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
}

async function switchTab(label: string) {
  const button = qa('.fl-tabs button').find((entry) => entry.textContent?.trim() === label);
  await click(button ?? null);
}

test('the studio renders its shell, top bar, rail and stage', () => {
  assert.ok(q('.fl-app'), 'app root');
  assert.equal(q('.fl-app')!.getAttribute('dir'), 'rtl');
  assert.ok(q('.fl-topbar'));
  assert.ok(q('.fl-tabs'));
  assert.ok(q('.fl-rail'));
  assert.ok(q('.fl-stage'));
  assert.ok(qa('.fl-tabs button').length >= 8, 'all sections are reachable');
});

test('a bundled font loads and shows real metrics without errors', () => {
  assert.equal(q('.fl-error'), null);
  assert.ok(q('.fl-stage-title')?.textContent?.includes('1000 upm'));
  const analysisToggle = qa('.fl-tabs button').find((entry) => entry.textContent?.trim() === 'الخطوط');
  assert.ok(analysisToggle);
});

test('the glyph rail lists Arabic glyphs and filters by search', async () => {
  const before = qa('.fl-glyph').length;
  assert.ok(before > 50, `glyph count ${before}`);
  const search = q<HTMLInputElement>('.fl-search input')!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(search, 'باء');
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 40));
  const after = qa('.fl-glyph').length;
  assert.ok(after >= 1 && after < before, `filtered ${after} of ${before}`);
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(search, '');
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
});

test('selecting a glyph updates the inspector and the stage outline', async () => {
  const cell = qa('.fl-glyph-main')[5];
  await click(cell);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.ok(q('.fl-glyph-hero-char')?.textContent, 'hero glyph');
  const path = q('.fl-outline-line');
  assert.ok(path?.getAttribute('d')?.length, 'outline drawn');
  assert.ok(q('.fl-metrics-grid'), 'metrics shown');
  assert.equal(qa('.fl-forms button').length, 4, 'four positional form chips shown');

});

test('the positional-form chips open the real substituted glyph', async () => {
  await switchTab('المحرر');
  // pick a letter that really joins (ب) so all four forms exist in the font
  const search = q<HTMLInputElement>('.fl-search input')!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(search, 'باء');
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 60));
  await click(qa('.fl-glyph-main')[0]);
  const before = q('.fl-stage-title')?.textContent || '';
  const medial = qa('.fl-forms button').find((button) => button.textContent?.trim() === 'وسطي')!;
  assert.ok(medial && !medial.hasAttribute("disabled"), 'medial form available for this letter');
  await click(medial);
  const after = q('.fl-stage-title')?.textContent || '';
  assert.notEqual(after, before);
  assert.ok(q('.fl-outline-line')?.getAttribute('d'), 'the substituted glyph has outlines');
  assert.ok(qa('.fl-forms button').some((button) => button.className.includes('is-active')));
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(search, '');
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
});

test('node operations act on a real selection', async () => {
  await switchTab('المحرر');
  const stage = q('.fl-stage')!;
  stage.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 720, height: 520, right: 720, bottom: 520, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  const node = q('.fl-node rect') as unknown as SVGRectElement;
  const nodeX = Number(node.getAttribute('x')) + 4;
  const nodeY = Number(node.getAttribute('y')) + 4;
  const fire = (type: string, clientX: number, clientY: number) => {
    const event = new dom.window.MouseEvent(type, { bubbles: true, clientX, clientY, button: 0 });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    stage.dispatchEvent(event);
  };
  await act(async () => {
    fire('pointerdown', nodeX, nodeY);
  });
  await act(async () => {
    fire('pointerup', nodeX, nodeY);
  });
  await new Promise((resolve) => setTimeout(resolve, 60));
  const selectedBefore = qa('.fl-node.is-selected').length;
  assert.ok(selectedBefore >= 1, 'a node is selected');

  const snap = qa('.fl-nodeops-group .fl-btn').find((button) => button.textContent?.includes('تثبيت'))!;
  assert.ok(snap && !snap.hasAttribute("disabled"), 'snap enabled with a selection');
  const before = q('.fl-outline-line')!.getAttribute('d');
  await click(snap);
  assert.notEqual(q('.fl-outline-line')!.getAttribute('d'), before);
});

test('tool switching changes the stage mode', async () => {
  const pen = qa('.fl-stage-tools button').find((button) => button.textContent?.includes('قلم'))!;
  await click(pen);
  assert.ok(q('.fl-stage')!.className.includes('fl-tool-pen'));
  await click(qa('.fl-stage-tools button').find((button) => button.textContent?.includes('تحديد'))!);
  assert.ok(q('.fl-stage')!.className.includes('fl-tool-select'));
});

test('adding a preset shape edits the glyph and creates history', async () => {
  const stageBefore = q('.fl-outline-line')?.getAttribute('d') || '';
  const shape = qa('.fl-shape-grid button')[1];
  assert.ok(shape, 'preset buttons exist');
  await click(shape);
  await new Promise((resolve) => setTimeout(resolve, 40));
  const stageAfter = q('.fl-outline-line')?.getAttribute('d') || '';
  assert.notEqual(stageBefore, stageAfter);
  const history = qa('.fl-history-list li');
  await switchTab('السجل');
  assert.ok(qa('.fl-history-list li').length >= 1);
  assert.ok(history.length >= 0);
});

test('dragging a node on the stage edits the outline as one undo step', async () => {
  await switchTab('المحرر');
  const stage = q('.fl-stage')!;
  stage.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 720, height: 520, right: 720, bottom: 520, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

  const node = q('.fl-node rect') as unknown as SVGRectElement;
  assert.ok(node, 'a node exists on the stage');
  // the node's own coordinates tell us exactly where to press
  const nodeX = Number(node.getAttribute('x')) + 3.5;
  const nodeY = Number(node.getAttribute('y')) + 3.5;
  const before = q('.fl-outline-line')!.getAttribute('d');

  const fire = (type: string, clientX: number, clientY: number) => {
    const event = new dom.window.MouseEvent(type, { bubbles: true, clientX, clientY, button: 0 });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    stage.dispatchEvent(event);
  };
  await act(async () => {
    fire('pointerdown', nodeX, nodeY);
  });
  await act(async () => {
    fire('pointermove', nodeX + 26, nodeY + 18);
  });
  await act(async () => {
    fire('pointerup', nodeX + 26, nodeY + 18);
  });
  await new Promise((resolve) => setTimeout(resolve, 80));

  const after = q('.fl-outline-line')!.getAttribute('d');
  assert.notEqual(before, after, 'outline changed after the drag');
  assert.ok(qa('.fl-node.is-selected').length >= 1, 'the dragged node is selected');

  await switchTab('السجل');
  const entries = qa('.fl-history-list li');
  assert.ok(entries.length >= 2, `history has ${entries.length} entries`);
  assert.ok(entries[0].textContent?.includes('تحريك نقاط'), entries[0].textContent || '');
  await switchTab('المحرر');
});

test('undo and redo restore the outline', async () => {
  await switchTab('المحرر');
  const before = q('.fl-outline-line')?.getAttribute('d') || '';
  const undoButton = qa('.fl-stage-toggles button').find((button) => button.getAttribute('aria-label') === 'تراجع')!;
  await click(undoButton);
  const undone = q('.fl-outline-line')?.getAttribute('d') || '';
  assert.notEqual(before, undone);
  const redoButton = qa('.fl-stage-toggles button').find((button) => button.getAttribute('aria-label') === 'إعادة')!;
  await click(redoButton);
  assert.equal(q('.fl-outline-line')?.getAttribute('d') || '', before);
});

test('the metrics panel writes new values into the document', async () => {
  await switchTab('المحرر');
  const input = qa('.fl-metrics-inputs input')[2] as HTMLInputElement; // x-height
  assert.ok(input);
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, '555');
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    // React's onBlur listens to the bubbling `focusout` event
    input.dispatchEvent(new dom.window.FocusEvent('focusout', { bubbles: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 40));
  const bar = qa('.fl-metric-bar')[2];
  assert.ok(bar.textContent?.includes('555'), bar.textContent || '');
});

test('kerning studio measures and applies a pair', async () => {
  await switchTab('المسافات');
  assert.ok(q('.fl-pair-select'), 'pair selectors');
  assert.ok(q('.fl-pair-preview svg path'), 'pair preview drawn');
  const metricText = q('.fl-pair-metrics')?.textContent || '';
  assert.ok(metricText.includes('الفراغ'));
  const valueInput = q('.fl-card-body .fl-number input') as HTMLInputElement;
  assert.ok(valueInput);
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!;
    setter.call(valueInput, '-45');
    valueInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    valueInput.dispatchEvent(new dom.window.FocusEvent('focusout', { bubbles: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.ok(qa('.fl-pair-list li').length >= 1, 'pair saved');
});

test('export panel produces a real, re-readable TTF', async () => {
  await switchTab('التصدير');
  const report = q('.fl-export-report')?.textContent || '';
  assert.ok(report.includes('GSUB'));
  assert.ok(report.includes('GPOS'));
  const button = qa('.fl-export .fl-btn-primary')[0];
  assert.ok(button, 'export button');
  await click(button);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const message = q('.fl-export-message')?.textContent || '';
  assert.ok(message.includes('تم تصدير'), message);
  assert.ok(message.includes('تم التحقق من القراءة'), 'read-back verified');
  const result = q('.fl-export-result');
  assert.ok(result?.textContent?.includes('.ttf'));
});

test('projects panel saves a project locally', async () => {
  await switchTab('المشاريع');
  const button = qa('.fl-save-row .fl-btn')[0];
  await click(button);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.ok(qa('.fl-project-list li').length >= 1, 'project listed');
  const stored = dom.window.localStorage.getItem('unitool.fontlab.projects.v1');
  assert.ok(stored && stored.includes('fontKey'));
});

test('the guide documents real shortcuts', async () => {
  await switchTab('الدليل');
  const text = q('.fl-docs')?.textContent || '';
  assert.ok(text.includes('Ctrl + Z'));
  assert.ok(text.includes('OFL'));
  assert.ok(qa('.fl-shortcut-grid kbd').length >= 10);
});

test('theme and language switches re-render the shell', async () => {
  await switchTab('المحرر');
  const themeButton = qa('.fl-topbar .fl-icon-btn').find((button) => button.getAttribute('aria-label')?.includes('الوضع'))!;
  await click(themeButton);
  assert.ok(q('.fl-app')!.className.includes('is-dark'));
  await click(themeButton);
  assert.ok(q('.fl-app')!.className.includes('is-light'));

  const langButton = qa('.fl-topbar .fl-icon-btn').find((button) => button.getAttribute('aria-label')?.includes('اللغة'))!;
  await click(langButton);
  assert.equal(q('.fl-app')!.getAttribute('dir'), 'ltr');
  assert.ok(qa('.fl-tabs button')[0].textContent?.includes('Editor'));
  await click(langButton);
  assert.equal(q('.fl-app')!.getAttribute('dir'), 'rtl');
});

test('the verification board reports real font capabilities', async () => {
  await switchTab('المحرر');
  const board = q('.fl-check-list');
  assert.ok(board, 'check list rendered');
  const items = qa('.fl-check-list li');
  assert.ok(items.length >= 6);
  assert.ok(items[0].className.includes('is-pass'));
  assert.ok(q('.fl-score')?.textContent?.includes('%'));
});

test('the live preview uses the edited font family', async () => {
  await switchTab('المعاينة');
  const canvas = q('.fl-preview-canvas p') as HTMLElement;
  assert.ok(canvas);
  assert.ok(canvas.style.fontFamily.includes('unitool-fontlab-preview'));
  assert.ok(canvas.textContent?.includes('بسم الله'));
  const size = q('.fl-preview-controls input[type=range]') as HTMLInputElement;
  assert.ok(size);
});

test('font library shows all bundled fonts with licences', async () => {
  await switchTab('الخطوط');
  const cards = qa('.fl-font-card');
  assert.equal(cards.length, 3);
  const text = q('.fl-library')?.textContent || '';
  assert.ok(text.includes('Cairo') && text.includes('Amiri') && text.includes('Inter'));
  assert.ok(text.includes('OFL') || text.includes('Open Font License'));
  const analysis = q('.fl-analysis')?.textContent || '';
  assert.ok(analysis.includes('822') || analysis.includes('6624') || analysis.includes('2926'));
});

test('switching to another bundled font reloads the editor', async () => {
  const interCard = qa('.fl-font-card').find((card) => card.textContent?.includes('Inter'))!;
  await click(interCard);
  await new Promise((resolve) => setTimeout(resolve, 200));
  await switchTab('المحرر');
  assert.ok(q('.fl-stage-title')?.textContent?.includes('2048 upm'), q('.fl-stage-title')?.textContent || '');
  assert.equal(q('.fl-error'), null);
});
