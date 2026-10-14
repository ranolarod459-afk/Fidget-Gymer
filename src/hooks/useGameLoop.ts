import { useEffect, useRef } from "react";

/**
 * Fires `onFrame(deltaMs)` at a fixed cadence while `active` is true.
 * The callback also receives the raw wall-clock delta since the last
 * fired frame, so physics remains accurate regardless of the throttle.
 *
 * Default cadence is 22ms (~45fps) — the same throttle the games use for
 * their React re-renders. This means physics and render happen at the
 * same rate, halving CPU work versus running physics at 60fps and only
 * re-rendering at 45fps.
 */
const DEFAULT_INTERVAL_MS = 22;

export function useGameLoop(
  active: boolean,
  onFrame: (deltaMs: number) => void,
  intervalMs: number = DEFAULT_INTERVAL_MS,
) {
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const lastFiredRef = useRef<number>(0);
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      lastFiredRef.current = 0;
      return;
    }

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);

      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
        lastFiredRef.current = ts;
        return;
      }

      // Only call the callback if we've crossed the interval threshold.
      if (ts - lastFiredRef.current < intervalMs) {
        return;
      }

      const delta = ts - lastTsRef.current;
      lastTsRef.current = ts;
      lastFiredRef.current = ts;

      cbRef.current(delta);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
      lastFiredRef.current = 0;
    };
  }, [active, intervalMs]);
}
