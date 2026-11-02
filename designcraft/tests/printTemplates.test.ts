import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRINT_TEMPLATES } from '../src/data/templates/print';
import { TEMPLATE_CATALOG, TEMPLATE_CATEGORIES } from '../src/data/templates';

test('16 editable print templates are registered once across five useful categories', () => {
  assert.equal(PRINT_TEMPLATES.length, 16);
  const ids = TEMPLATE_CATALOG.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const category of ['sticker', 'business-card', 'thank-you', 'product-tag', 'flyer']) {
    assert.ok(TEMPLATE_CATEGORIES.some(c => c.id === category));
    assert.ok(PRINT_TEMPLATES.some(t => t.cat === category));
  }
});
test('print dimensions match the suggested 300-DPI trim size, all artwork is editable and local', () => {
  for (const t of PRINT_TEMPLATES) {
    assert.ok(t.exactSize);
    assert.ok(t.print);
    assert.equal(t.baseW, Math.round(t.print.widthMm / 25.4 * 300));
    assert.equal(t.baseH, Math.round(t.print.heightMm / 25.4 * 300));
    assert.ok(t.nameAr && t.nameEn && t.descAr && t.descEn);
    assert.ok(t.objects.length >= 4);
    for (const o of t.objects) {
      assert.ok(['rect', 'circle', 'text'].includes(o.type));
      assert.ok(o.x >= 0 && o.x <= 1 && o.y >= 0 && o.y <= 1);
      if (o.type === 'text') assert.ok(o.text && o.size && o.fill);
    }
  }
});
