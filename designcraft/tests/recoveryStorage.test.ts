import 'fake-indexeddb/auto';
import { IDBObjectStore } from 'fake-indexeddb';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveRecovery, recoveryPoints } from '../src/advanced/core/recovery';
test('identical recovery saves do not multiply snapshots; changed snapshots remain bounded', async () => {
  const first = await saveRecovery('dedupe-qa','original');
  const same = await saveRecovery('dedupe-qa','original');
  assert.equal(first.id,same.id);
  assert.equal((await recoveryPoints('dedupe-qa')).length,1);
  for(let i=0;i<8;i++) await saveRecovery('dedupe-qa','edited-'+i);
  const points = await recoveryPoints('dedupe-qa');
  assert.equal(points.length,5); assert.equal(points[0].data,'edited-7');
  const repeat = await saveRecovery('dedupe-qa','edited-7');
  assert.equal(repeat.id,points[0].id);
});
test('failed recovery writes do not remove the previous recoverable state', async () => {
  const previous = await saveRecovery('failure-qa','keep');
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function(...args: any[]) {
    if(this.name==='points') { this.transaction.abort(); return undefined as any; }
    return original.apply(this,args as any);
  };
  try { await assert.rejects(saveRecovery('failure-qa','new')); }
  finally { IDBObjectStore.prototype.put = original; }
  assert.deepEqual((await recoveryPoints('failure-qa')).map(p=>p.id),[previous.id]);
});
