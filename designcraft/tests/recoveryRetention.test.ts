import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retainedRecovery } from '../src/utils/recoveryRetention';
const row = (id: number, projectId = 'a', data = 'snapshot') => ({ id: String(id), projectId, created: id, data });
test('recovery trimming preserves latest and bounds bytes without touching saved project objects', () => {
  const points = [row(1,'a','x'.repeat(40)), row(2,'b','y'.repeat(40))];
  const snapshot = JSON.stringify(points);
  const latest = row(3,'a','z'.repeat(40));
  const kept = retainedRecovery(points, latest, 70);
  assert.deepEqual(kept.map(p => p.id), ['3']);
  assert.equal(JSON.stringify(points), snapshot);
});
test('recovery keeps at most 5 per project and 20 overall, including timestamp ties', () => {
  const points = Array.from({length:40},(_,i)=>row(i, String(i % 5)));
  const latest = {...row(100,'0'),created:0};
  const kept = retainedRecovery(points,latest);
  assert.equal(kept.length,20); assert.equal(kept[0].id,'100');
  for(const id of ['0','1','2','3','4']) assert.ok(kept.filter(p=>p.projectId===id).length<=5);
});
