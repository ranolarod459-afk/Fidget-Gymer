import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameType } from "./settingsStore";

export type Phase = "idle" | "playing" | "restOver" | "paused";

interface WorkoutState {
  phase: Phase;
  restDurationSec: number;
  restRemainingSec: number;
  setsCompleted: number;
  highScores: Record<GameType, number>;

  start: (durationSec: number) => void;
  tickRest: () => void;
  userDoneWithSet: () => void;
  pause: () => void;
  resume: () => void;
  quit: () => void;
  submitScore: (game: GameType, score: number) => void;
}

export const useWorkout = create<WorkoutState>()(
  persist(
    (set, get) => ({
      phase: "idle",
      restDurationSec: 90,
      restRemainingSec: 90,
      setsCompleted: 1,
      highScores: { snake: 0, flappy: 0 },

      start: (durationSec) =>
        set({
          phase: "playing",
          restDurationSec: durationSec,
          restRemainingSec: durationSec,
          setsCompleted: 1,
        }),

      tickRest: () => {
        const { phase, restRemainingSec } = get();
        if (phase !== "playing") return;
        const next = restRemainingSec - 1;
        if (next <= 0) {
          set({ restRemainingSec: 0, phase: "restOver" });
        } else {
          set({ restRemainingSec: next });
        }
      },

      userDoneWithSet: () => {
        const { restDurationSec, setsCompleted } = get();
        set({
          phase: "playing",
          restRemainingSec: restDurationSec,
          setsCompleted: setsCompleted + 1,
        });
      },

      pause: () => {
        if (get().phase === "playing") set({ phase: "paused" });
      },

      resume: () => {
        if (get().phase === "paused") set({ phase: "playing" });
      },

      quit: () =>
        set({
          phase: "idle",
          restRemainingSec: 0,
          setsCompleted: 1,
        }),

      submitScore: (game, score) =>
        set((s) => ({
          highScores: {
            ...s.highScores,
            [game]: Math.max(s.highScores[game], score),
          },
        })),
    }),
    {
      name: "fg-workout",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist high scores across app restarts.
      partialize: (s) => ({ highScores: s.highScores }),
    },
  ),
);
