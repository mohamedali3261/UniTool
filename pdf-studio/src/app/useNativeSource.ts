import { useEffect, useRef, useState } from "react";
import { openPdf, type PdfDoc } from "../core/pdf";
/** Native changes stay independent from annotation history. Byte snapshots allow explicit text undo. */
export function useNativeSource(
  original: { bytes: Uint8Array; doc: PdfDoc },
  changed: () => void,
) {
  const [value, setValue] = useState<typeof original | null>(null),
    [past, setPast] = useState<Uint8Array[]>([]),
    [busy, setBusy] = useState(false);
  const owned = useRef<PdfDoc[]>([]),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      owned.current.forEach((doc) => void doc.destroy());
    };
  }, []);
  const apply = async (bytes: Uint8Array, undo = false) => {
    if (busy) return;
    setBusy(true);
    try {
      const opened = await openPdf(
        new File([bytes.slice().buffer], "edited-source.pdf"),
      );
      if (!alive.current) {
        await opened.doc.destroy();
        return;
      }
      owned.current.push(opened.doc);
      // Keep only current/previous renderer alive during the canvas hand-off.
      if (owned.current.length > 2) void owned.current.shift()!.destroy();
      setPast((list) => {
        if (undo) return list.slice(0, -1);
        const next = [...list, (value || original).bytes].slice(-5);
        while (
          next.length > 1 &&
          next.reduce((n, b) => n + b.byteLength, 0) > 50 * 1024 * 1024
        )
          next.shift();
        return next;
      });
      setValue(opened);
      changed();
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  return {
    source: value || original,
    modified: !!value,
    busy,
    apply,
    canUndo: past.length > 0,
    undo: async () => {
      if (past.length) await apply(past[past.length - 1], true);
    },
  };
}
