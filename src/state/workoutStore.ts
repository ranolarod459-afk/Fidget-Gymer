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

  activeGame: GameType;
  countdown: number | null;

  /**
   * When true, all game loops freeze but the rest timer keeps ticking.
   * Used by the game picker overlay so switching games pauses the action
   * without pausing the workout.
   */
  uiBlocked: boolean;

  start: (durationSec: number, game: GameType) => void;
  tickRest: () => void;
  userDoneWithSet: () => void;
  pause: () => void;
  resume: () => void;
  quit: () => void;
  switchGame: (game: GameType) => void;
  submitScore: (game: GameType, score: number) => void;

  beginCountdown: () => void;
  tickCountdown: () => void;
  clearCountdown: () => void;

  setUiBlocked: (blocked: boolean) => void;
}

export const useWorkout = create<WorkoutState>()(
  persist(
    (set, get) => ({
      phase: "idle",
      restDurationSec: 90,
      restRemainingSec: 90,
      setsCompleted: 1,
      highScores: { snake: 0, flappy: 0, galaga: 0 },
      activeGame: "snake",
      countdown: null,
      uiBlocked: false,

      start: (durationSec, game) =>
        set({
          phase: "playing",
          restDurationSec: durationSec,
          restRemainingSec: durationSec,
          setsCompleted: 1,
          activeGame: game,
          countdown: 3,
          uiBlocked: false,
        }),

      tickRest: () => {
        const { phase, restRemainingSec } = get();
        if (phase !== "playing") return;
        // Note: we do NOT check uiBlocked here. The rest timer keeps
        // ticking even while the picker is open.
        const next = restRemainingSec - 1;
        if (next <= 0) {
          set({ restRemainingSec: 0, phase: "restOver", countdown: null });
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
          countdown: 3,
        });
      },

      pause: () => {
        if (get().phase === "playing") set({ phase: "paused" });
      },

      resume: () => {
        if (get().phase === "paused") set({ phase: "playing", countdown: 3 });
      },

      quit: () =>
        set({
          phase: "idle",
          restRemainingSec: 0,
          setsCompleted: 1,
          countdown: null,
          uiBlocked: false,
        }),

      switchGame: (game) =>
        set({
          activeGame: game,
          countdown: 3,
        }),

      submitScore: (game, score) =>
        set((s) => ({
          highScores: {
            ...s.highScores,
            [game]: Math.max(s.highScores[game] ?? 0, score),
          },
        })),

      beginCountdown: () => set({ countdown: 3 }),

      tickCountdown: () => {
        const { countdown, uiBlocked } = get();
        if (countdown === null) return;
        if (uiBlocked) return; // freeze countdown while picker is open
        if (countdown <= 1) {
          set({ countdown: 0 });
        } else {
          set({ countdown: countdown - 1 });
        }
      },

      clearCountdown: () => set({ countdown: null }),

      setUiBlocked: (blocked) => set({ uiBlocked: blocked }),
    }),
    {
      name: "fg-workout",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ highScores: s.highScores }),
      merge: (persisted, current) => {
        const persistedAny = (persisted ?? {}) as Partial<WorkoutState>;
        const persistedHigh = (persistedAny.highScores ?? {}) as Partial<
          Record<GameType, number>
        >;
        return {
          ...current,
          ...persistedAny,
          // Ensure every game has a numeric high score, defaulting to 0.
          highScores: {
            snake: persistedHigh.snake ?? 0,
            flappy: persistedHigh.flappy ?? 0,
            galaga: persistedHigh.galaga ?? 0,
          },
        };
      },
    },
  ),
);
