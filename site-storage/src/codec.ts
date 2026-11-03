import { secretField } from './registry';
type BinaryWriter = (blob: Blob) => Promise<string>;
type BinaryReader = (path: string) => Promise<Uint8Array>;
const typed: Record<string, any> = { Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, DataView };
export async function encode(value: any, binary: BinaryWriter, seen = new Set<any>(), depth = 0): Promise<any> {
  if (depth > 80) throw Error('Data nesting too deep');
  if (value === undefined) return ['undefined'];
  if (typeof value === 'bigint') return ['bigint', String(value)];
  if (typeof value === 'number' && !Number.isFinite(value)) return ['number', String(value)];
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return ['scalar', value];
  if (typeof value !== 'object' || seen.has(value)) throw Error('Unsupported/cyclic saved value');
  if (value instanceof Date) return ['date', value.toISOString()];
  if (value instanceof Blob) return ['blob', await binary(value), value.type, typeof File !== 'undefined' && value instanceof File ? value.name : null, (value as File).lastModified || 0];
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    if (!(value instanceof ArrayBuffer) && !Object.hasOwn(typed, value.constructor.name)) throw Error('Unsupported binary type');
    const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return ['bytes', await binary(new Blob([bytes])), value instanceof ArrayBuffer ? 'ArrayBuffer' : value.constructor.name];
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) { const values = []; for (const v of value) values.push(await encode(v, binary, seen, depth + 1)); return ['array', values]; }
    if (value instanceof Map) { const pairs = []; for (const [k, v] of value) pairs.push([await encode(k, binary, seen, depth + 1), await encode(v, binary, seen, depth + 1)]); return ['map', pairs]; }
    if (value instanceof Set) { const values = []; for (const v of value) values.push(await encode(v, binary, seen, depth + 1)); return ['set', values]; }
    if (![null, Object.prototype].includes(Object.getPrototypeOf(value))) throw Error('Unsupported object');
    const pairs = [];
    for (const [key, val] of Object.entries(value)) if (!secretField(key) && !['__proto__', 'constructor', 'prototype'].includes(key)) pairs.push([key, await encode(val, binary, seen, depth + 1)]);
    return ['object', pairs];
  } finally { seen.delete(value); }
}
export async function decode(node: any, binary: BinaryReader, depth = 0): Promise<any> {
  if (depth > 80 || !Array.isArray(node) || typeof node[0] !== 'string') throw Error('Invalid encoded data');
  const [tag, value] = node;
  if (tag === 'scalar' && (value === null || ['string', 'number', 'boolean'].includes(typeof value))) return value;
  if (tag === 'undefined') return undefined;
  if (tag === 'bigint' && /^-?\d+$/.test(value)) return BigInt(value);
  if (tag === 'number' && ['NaN', 'Infinity', '-Infinity'].includes(value)) return Number(value);
  if (tag === 'date' && typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Date(value);
  if (tag === 'bytes' || tag === 'blob') {
    const bytes = await binary(value);
    const buffer = bytes.slice().buffer;
    if (tag === 'blob') {
      if (typeof node[2] !== 'string' || (node[3] !== null && typeof node[3] !== 'string')) throw Error('Invalid binary metadata');
      return node[3] !== null ? new File([buffer], node[3], { type: node[2], lastModified: node[4] }) : new Blob([buffer], { type: node[2] });
    }
    if (node[2] === 'ArrayBuffer') return buffer;
    if (!Object.hasOwn(typed, node[2])) throw Error('Unsupported binary type');
    return new typed[node[2]](buffer);
  }
  if (['array', 'set'].includes(tag) && Array.isArray(value)) {
    const values = []; for (const item of value) values.push(await decode(item, binary, depth + 1));
    return tag === 'set' ? new Set(values) : values;
  }
  if (['object', 'map'].includes(tag) && Array.isArray(value)) {
    const pairs: any[] = [], keys = new Set();
    for (const pair of value) {
      if (!Array.isArray(pair) || pair.length !== 2) throw Error('Invalid object entry');
      const key = tag === 'map' ? await decode(pair[0], binary, depth + 1) : pair[0];
      if (tag === 'object' && (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key) || secretField(key) || keys.has(key))) throw Error('Unsafe object property');
      keys.add(key); pairs.push([key, await decode(pair[1], binary, depth + 1)]);
    }
    return tag === 'map' ? new Map(pairs) : Object.fromEntries(pairs);
  }
  throw Error('Invalid encoded data');
}
