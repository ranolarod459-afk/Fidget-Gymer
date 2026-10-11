import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useWorkout } from "../state/workoutStore";
import { playRestOver } from "../utils/sounds";
import {
  scheduleRestEndNotification,
  cancelAllRestNotifications,
} from "../utils/notifications";
import { hapticRestOver } from "../utils/haptics";

/**
 * Drives the rest countdown while phase === 'playing'.
 * Re-schedules a local notification each new rest cycle and vibrates on rest-over.
 */
export function useRestTimer() {
  const phase = useWorkout((s) => s.phase);
  const tickRest = useWorkout((s) => s.tickRest);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef(false);

  // Tick every second while playing.
  useEffect(() => {
    if (phase !== "playing") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => tickRest(), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, tickRest]);

  // Schedule/cancel the notification whenever a rest cycle starts/stops.
  useEffect(() => {
    if (phase === "playing") {
      const remaining = useWorkout.getState().restRemainingSec;
      notifiedRef.current = false;
      scheduleRestEndNotification(remaining);
    } else {
      cancelAllRestNotifications();
    }
  }, [phase]);

  // Vibrate once when phase flips to restOver.
  useEffect(() => {
    if (phase === "restOver" && !notifiedRef.current) {
      notifiedRef.current = true;
      hapticRestOver();
      playRestOver();
    }
  }, [phase]);

  // Safety net: if the app was backgrounded and the OS throttled us,
  // force a tick when coming back to foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && useWorkout.getState().phase === "playing") {
        tickRest();
      }
    });
    return () => sub.remove();
  }, [tickRest]);
}
