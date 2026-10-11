import { create } from "zustand";

export type GameStatus = "ready" | "alive" | "dead";

interface GameState {
  status: GameStatus;
  score: number;
  // Internal — the actual game logic lives inside SnakeGame, but
  // the overlay needs to know status + score to render.
  setStatus: (s: GameStatus) => void;
  setScore: (n: number) => void;
  reset: () => void;
}

export const useGame = create<GameState>((set) => ({
  status: "ready",
  score: 0,
  setStatus: (status) => set({ status }),
  setScore: (score) => set({ score }),
  reset: () => set({ status: "ready", score: 0 }),
}));
