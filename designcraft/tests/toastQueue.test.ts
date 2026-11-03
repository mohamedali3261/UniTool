import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueueToast } from '../src/utils/toastQueue';
import type { ToastMessage } from '../src/types';
const a: ToastMessage = { id: 'a', type: 'success', title: 'Background', message: 'Applied' };
test('adjacent identical notices coalesce without mutating the queue or active identity', () => {
  const source = [a];
  let queue = enqueueToast(source, { ...a, id: 'b' });
  queue = enqueueToast(queue, { ...a, id: 'c' });
  assert.equal(queue.length, 1); assert.equal(queue[0].id, 'a'); assert.equal(queue[0].count, 3);
  assert.deepEqual(source, [a]); assert.equal(a.count, undefined);
});
test('all message types and different messages retain FIFO order, including non-adjacent repeats', () => {
  let queue: ToastMessage[] = [];
  for (const type of ['success', 'info', 'warning', 'error'] as const) queue = enqueueToast(queue, { ...a, id: type, type });
  queue = enqueueToast(queue, { ...a, id: 'last' });
  queue = enqueueToast(queue, { ...a, id: 'different-body', message: 'Other' });
  assert.deepEqual(queue.map(t => t.id), ['success', 'info', 'warning', 'error', 'last', 'different-body']);
});
