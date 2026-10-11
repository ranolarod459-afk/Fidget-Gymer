import { useEffect, useRef } from "react";

/**
 * Fires `onFrame(deltaMs)` every animation frame while `active` is true.
 * The delta is wall-clock ms since the previous frame.
 */
export function useGameLoop(
  active: boolean,
  onFrame: (deltaMs: number) => void,
) {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
      return;
    }

    const loop = (ts: number) => {
      if (lastRef.current == null) lastRef.current = ts;
      const delta = ts - lastRef.current;
      lastRef.current = ts;
      cbRef.current(delta);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [active]);
}
