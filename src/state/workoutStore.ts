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

function normalizeHighScores(
  raw: Partial<Record<GameType, number>> | undefined,
): Record<GameType, number> {
  const r = raw ?? {};
  return {
    snake: Number.isFinite(r.snake) ? (r.snake as number) : 0,
    flappy: Number.isFinite(r.flappy) ? (r.flappy as number) : 0,
    galaga: Number.isFinite(r.galaga) ? (r.galaga as number) : 0,
  };
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
        set((s) => {
          const current = s.highScores[game];
          const safeCurrent = Number.isFinite(current) ? current : 0;
          const safeScore = Number.isFinite(score) ? score : 0;
          const next = Math.max(safeCurrent, safeScore);
          if (next === current) return s;
          return {
            highScores: { ...s.highScores, [game]: next },
          };
        }),

      beginCountdown: () => set({ countdown: 3 }),

      tickCountdown: () => {
        const { countdown } = get();
        if (countdown === null) return;
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
        const p = (persisted ?? {}) as Partial<WorkoutState>;
        return {
          ...current,
          ...p,
          highScores: normalizeHighScores(p.highScores),
        };
      },
    },
  ),
);
