import { useCallback, useRef, useLayoutEffect } from "react";
/** Stable identity, fresh event handler; keeps large panels out of playback renders. */
export function useEvent<T extends (...args: any[]) => any>(handler: T): T {
  const ref = useRef(handler);
  useLayoutEffect(() => {
    ref.current = handler;
  });
  return useCallback(
    ((...args: Parameters<T>) => ref.current(...args)) as T,
    [],
  );
}
