import type { ToastMessage } from '../types';
/** Coalesce only adjacent identical messages; preserve the order of other events. */
export function enqueueToast(queue: ToastMessage[], incoming: ToastMessage): ToastMessage[] {
  const last = queue[queue.length - 1];
  if (last && last.type === incoming.type && last.title === incoming.title && last.message === incoming.message) {
    return [...queue.slice(0, -1), { ...last, count: (last.count || 1) + (incoming.count || 1) }];
  }
  return [...queue, incoming];
}
