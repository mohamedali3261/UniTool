/**
 * TrueType writer — patches edited outlines straight into the original file.
 *
 * opentype.js can only *write* CFF outlines, which would drop GPOS (Arabic mark
 * positioning, kerning) and hinting on export. So instead of re-serialising the
 * whole font we rewrite only the tables an edit actually touches:
 *
 *   glyf + loca  → the edited glyph outlines
 *   hmtx + hhea  → their advance widths / side bearings
 *   head         → bounding box, loca format, checksum
 *
 * Every other table (GSUB, GPOS, gdef, cmap, names, hinting programs) is copied
 * byte-for-byte, so the exported font still joins and positions Arabic correctly.
 */
import type { GlyphContour, LoadedFont } from './fontEngine';
import { startOnCurve } from './outline';
import type { ProjectDocument } from './project';

export interface PatchOptions {
  /** keep the family/style names from the project document */
  rename: boolean;
}

export interface PatchResult {
  buffer: ArrayBuffer;
  warnings: string[];
  patchedGlyphs: number;
}

interface TableRecord {
  tag: string;
  checksum: number;
  offset: number;
  length: number;
}

function tagOf(view: DataView, offset: number) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

export function readTableDirectory(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const numTables = view.getUint16(4);
  const tables = new Map<string, TableRecord>();
  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = 12 + index * 16;
    tables.set(tagOf(view, recordOffset), {
      tag: tagOf(view, recordOffset),
      checksum: view.getUint32(recordOffset + 4),
      offset: view.getUint32(recordOffset + 8),
      length: view.getUint32(recordOffset + 12),
    });
  }
  return { view, numTables, tables };
}

function sliceTable(view: DataView, record: TableRecord) {
  return new Uint8Array(view.buffer, view.byteOffset + record.offset, record.length);
}

/** Incremental checksum with the padding the spec requires (multiple of 4). */
export function checksum(bytes: Uint8Array) {
  let sum = 0;
  const padded = Math.ceil(bytes.length / 4) * 4;
  for (let index = 0; index < padded; index += 4) {
    const b0 = bytes[index] || 0;
    const b1 = bytes[index + 1] || 0;
    const b2 = bytes[index + 2] || 0;
    const b3 = bytes[index + 3] || 0;
    sum = (sum + ((b0 << 24) >>> 0) + (b1 << 16) + (b2 << 8) + b3) >>> 0;
  }
  return sum >>> 0;
}

interface FlatPoint {
  x: number;
  y: number;
  onCurve: boolean;
}

function flattenContour(contour: GlyphContour): FlatPoint[] {
  const points = contour.closed ? startOnCurve(contour) : contour.points;
  return points.map((point) => ({ x: Math.round(point.x), y: Math.round(point.y), onCurve: point.onCurve }));
}

/**
 * Encodes a simple glyph. Deltas are stored per point (not per contour), exactly
 * as the spec describes, with the short/same flag optimisations applied.
 */
export function encodeSimpleGlyph(contours: GlyphContour[]): Uint8Array {
  const usable = contours.map(flattenContour).filter((points) => points.length > 1);
  if (usable.length === 0) {
    const empty = new Uint8Array(10);
    const view = new DataView(empty.buffer);
    view.setInt16(0, 0);
    void view;
    return empty;
  }

  const points = usable.flat();
  const endPoints: number[] = [];
  let running = -1;
  for (const contour of usable) {
    running += contour.length;
    endPoints.push(running);
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const xMin = Math.min(...xs);
  const yMin = Math.min(...ys);
  const xMax = Math.max(...xs);
  const yMax = Math.max(...ys);

  const flags: number[] = [];
  const xBytes: number[] = [];
  const yBytes: number[] = [];

  let prevX = 0;
  let prevY = 0;
  for (const point of points) {
    let flag = point.onCurve ? 0x01 : 0x00;
    const dx = point.x - prevX;
    const dy = point.y - prevY;
    prevX = point.x;
    prevY = point.y;

    if (dx === 0) {
      flag |= 0x10; // x is same
    } else if (Math.abs(dx) < 256) {
      flag |= 0x02; // x is short
      if (dx > 0) flag |= 0x10;
      xBytes.push(Math.abs(dx));
    } else {
      xBytes.push((dx >> 8) & 0xff, dx & 0xff);
    }
    if (dy === 0) {
      flag |= 0x20;
    } else if (Math.abs(dy) < 256) {
      flag |= 0x04;
      if (dy > 0) flag |= 0x20;
      yBytes.push(Math.abs(dy));
    } else {
      yBytes.push((dy >> 8) & 0xff, dy & 0xff);
    }
    flags.push(flag);
  }

  const headerLength = 10 + endPoints.length * 2 + 2;
  const bytes = new Uint8Array(headerLength + flags.length + xBytes.length + yBytes.length);
  const view = new DataView(bytes.buffer);
  view.setInt16(0, usable.length);
  view.setInt16(2, xMin);
  view.setInt16(4, yMin);
  view.setInt16(6, xMax);
  view.setInt16(8, yMax);
  endPoints.forEach((endPoint, index) => view.setUint16(10 + index * 2, endPoint));
  view.setUint16(10 + endPoints.length * 2, 0); // no instructions
  bytes.set(flags, headerLength);
  bytes.set(xBytes, headerLength + flags.length);
  bytes.set(yBytes, headerLength + flags.length + xBytes.length);
  return bytes;
}

function roundUp4(value: number) {
  return Math.ceil(value / 4) * 4;
}

/** Rebuilds the sfnt container from a tag → bytes map. */
export function buildSfnt(tables: Map<string, Uint8Array>, version: number): Uint8Array {
  const list = [...tables.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const numTables = list.length;
  let offset = 12 + numTables * 16;
  const placed: Array<{ tag: string; bytes: Uint8Array; offset: number }> = [];
  for (const [tag, bytes] of list) {
    offset = roundUp4(offset);
    placed.push({ tag, bytes, offset });
    offset += bytes.length;
  }
  const total = roundUp4(offset);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, version);
  view.setUint16(4, numTables);
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 16 * Math.pow(2, entrySelector);
  view.setUint16(6, searchRange);
  view.setUint16(8, entrySelector);
  view.setUint16(10, numTables * 16 - searchRange);

  placed.forEach((table, index) => {
    const recordOffset = 12 + index * 16;
    const tag = table.tag;
    out[recordOffset] = tag.charCodeAt(0);
    out[recordOffset + 1] = tag.charCodeAt(1);
    out[recordOffset + 2] = tag.charCodeAt(2);
    out[recordOffset + 3] = tag.charCodeAt(3);
    view.setUint32(recordOffset + 4, checksum(table.bytes));
    view.setUint32(recordOffset + 8, table.offset);
    view.setUint32(recordOffset + 12, table.bytes.length);
    out.set(table.bytes, table.offset);
  });
  return out;
}

function patchHead(headTable: Uint8Array, indexToLocFormat: number, bbox: { x1: number; y1: number; x2: number; y2: number }) {
  const bytes = headTable.slice();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(8, 0); // checkSumAdjustment is rewritten at the end
  view.setInt16(36, Math.round(bbox.x1));
  view.setInt16(38, Math.round(bbox.y1));
  view.setInt16(40, Math.round(bbox.x2));
  view.setInt16(42, Math.round(bbox.y2));
  view.setInt16(50, indexToLocFormat);
  return bytes;
}

export function canPatch(font: LoadedFont) {
  const { tables } = readTableDirectory(font.buffer);
  return Boolean(tables.get('glyf') && tables.get('loca') && tables.get('head') && tables.get('hmtx') && tables.get('hhea'));
}

/**
 * Applies the document edits to the original TrueType bytes.
 * Glyphs without an override are copied byte-for-byte.
 */
export function patchTruetype(font: LoadedFont, doc: ProjectDocument, options: PatchOptions = { rename: true }): PatchResult {
  if (!canPatch(font)) {
    throw new Error('هذا الخط ليس TrueType (glyf) — سيتم التصدير عبر المسار البديل. / Not a TrueType (glyf) font.');
  }
  const warnings: string[] = [];
  const { view, tables } = readTableDirectory(font.buffer);
  const headRecord = tables.get('head')!;
  const head = sliceTable(view, headRecord);
  const headView = new DataView(head.buffer, head.byteOffset, head.byteLength);
  const longLoca = headView.getInt16(50) === 1;
  const numGlyphs = (() => {
    const maxp = tables.get('maxp');
    if (!maxp) return font.parsed.glyphs.length;
    const bytes = sliceTable(view, maxp);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(4);
  })();

  const locaRecord = tables.get('loca')!;
  const loca = sliceTable(view, locaRecord);
  const locaView = new DataView(loca.buffer, loca.byteOffset, loca.byteLength);
  const locaOffsets: number[] = [];
  for (let index = 0; index <= numGlyphs; index += 1) {
    locaOffsets.push(longLoca ? locaView.getUint32(index * 4) : locaView.getUint16(index * 2) * 2);
  }

  const glyfRecord = tables.get('glyf')!;
  const glyf = sliceTable(view, glyfRecord);

  const hhea = sliceTable(view, tables.get('hhea')!).slice();
  const hheaView = new DataView(hhea.buffer, hhea.byteOffset, hhea.byteLength);
  const numberOfHMetrics = hheaView.getUint16(34);
  const hmtxRecord = tables.get('hmtx')!;
  const hmtx = sliceTable(view, hmtxRecord);
  const hmtxView = new DataView(hmtx.buffer, hmtx.byteOffset, hmtx.byteLength);

  const indexByName = new Map<number, string>();
  for (const [name, index] of font.nameIndex) {
    if (!indexByName.has(index)) indexByName.set(index, name);
  }

  const glyphChunks: Uint8Array[] = [];
  const newLoca: number[] = [];
  let cursor = 0;
  let patchedGlyphs = 0;
  let globalBox = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };

  const newAdvances: number[] = [];
  const newBearings: number[] = [];

  for (let index = 0; index < numGlyphs; index += 1) {
    const name = indexByName.get(index);
    const override = name ? doc.overrides[name] : undefined;
    const start = locaOffsets[index];
    const end = locaOffsets[index + 1];
    let chunk: Uint8Array;

    if (override) {
      chunk = new Uint8Array(encodeSimpleGlyph(override.contours));
      patchedGlyphs += 1;
    } else if (end > start) {
      chunk = glyf.slice(start, end);
    } else {
      chunk = new Uint8Array(0);
    }

    if (chunk.length > 0) {
      const chunkView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      const xMin = chunkView.getInt16(2);
      const yMin = chunkView.getInt16(4);
      const xMax = chunkView.getInt16(6);
      const yMax = chunkView.getInt16(8);
      globalBox = {
        x1: Math.min(globalBox.x1, xMin),
        y1: Math.min(globalBox.y1, yMin),
        x2: Math.max(globalBox.x2, xMax),
        y2: Math.max(globalBox.y2, yMax),
      };
    }

    const padded = roundUp4(chunk.length);
    const bufferChunk = new Uint8Array(padded);
    bufferChunk.set(chunk);
    glyphChunks.push(bufferChunk);
    newLoca.push(cursor);
    cursor += padded;

    // metrics
    if (index < numberOfHMetrics) {
      newAdvances.push(hmtxView.getUint16(index * 4));
      newBearings.push(hmtxView.getInt16(index * 4 + 2));
    } else {
      const lastAdvance = hmtxView.getUint16((numberOfHMetrics - 1) * 4);
      newAdvances.push(lastAdvance);
      newBearings.push(hmtxView.getInt16(numberOfHMetrics * 4 + (index - numberOfHMetrics) * 2));
    }
    if (override) {
      newAdvances[index] = Math.max(0, Math.round(override.advanceWidth));
      if (override.contours.length > 0) {
        const xs = override.contours.flatMap((contour) => contour.points.map((point) => point.x));
        newBearings[index] = Math.round(Math.min(...xs));
      }
    }
  }
  newLoca.push(cursor);

  if (!Number.isFinite(globalBox.x1)) globalBox = { x1: 0, y1: 0, x2: 0, y2: 0 };

  const newGlyf = new Uint8Array(cursor);
  glyphChunks.forEach((chunk, index) => newGlyf.set(chunk, newLoca[index]));

  // Short loca stores offsets/2 in a uint16, so anything above 0x1fffe needs long format.
  const useLongLoca = cursor > 0x1fffe;
  const indexToLocFormat = useLongLoca ? 1 : 0;
  const newLocaBytes = new Uint8Array((numGlyphs + 1) * (useLongLoca ? 4 : 2));
  const newLocaView = new DataView(newLocaBytes.buffer);
  newLoca.forEach((offset, index) => {
    if (useLongLoca) newLocaView.setUint32(index * 4, offset);
    else newLocaView.setUint16(index * 2, offset / 2);
  });
  if (!longLoca && useLongLoca) warnings.push('تم تحويل جدول loca إلى الصيغة الطويلة. / loca table upgraded to long format.');

  const newHmtx = new Uint8Array(numGlyphs * 4);
  const newHmtxView = new DataView(newHmtx.buffer);
  for (let index = 0; index < numGlyphs; index += 1) {
    newHmtxView.setUint16(index * 4, Math.min(65535, Math.max(0, newAdvances[index] || 0)));
    newHmtxView.setInt16(index * 4 + 2, Math.min(32767, Math.max(-32768, newBearings[index] || 0)));
  }
  // Simpler & always valid: one long metric per glyph.
  hheaView.setUint16(34, numGlyphs);

  const newHead = patchHead(head, indexToLocFormat, globalBox);

  const tableMap = new Map<string, Uint8Array>();
  for (const [tag, record] of tables) {
    if (['glyf', 'loca', 'hmtx', 'hhea', 'head'].includes(tag)) continue;
    tableMap.set(tag, sliceTable(view, record).slice());
  }
  tableMap.set('glyf', newGlyf);
  tableMap.set('loca', newLocaBytes);
  tableMap.set('hmtx', newHmtx);
  tableMap.set('hhea', hhea);
  tableMap.set('head', newHead);

  if (options.rename) {
    warnings.push('أسماء الخط: تُحدَّث العائلة عبر إعادة التسمية في تبويب التصدير. / Family names are kept unless the project renames them.');
  }

  const version = view.getUint32(0);
  const bytes = buildSfnt(tableMap, version);

  // head.checkSumAdjustment = 0xB1B0AFBA - checksum(whole font)
  const finalView = new DataView(bytes.buffer);
  const directory = readTableDirectory(bytes.buffer);
  const headOffset = directory.tables.get('head')!.offset;
  let sum = checksum(bytes) >>> 0;
  const adjustment = (0xb1b0afba - sum) >>> 0;
  finalView.setUint32(headOffset + 8, adjustment);
  sum = checksum(bytes) >>> 0;
  if (sum !== 0xb1b0afba) {
    warnings.push('تنبيه: لا يمكن ضبط checksum بالكامل. / Warning: font checksum could not be fully balanced.');
  }

  const out = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { buffer: out, warnings, patchedGlyphs };
}
