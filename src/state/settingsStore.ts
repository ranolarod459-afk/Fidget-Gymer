import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";

export type GameType = "snake" | "flappy" | "galaga";

interface SettingsState {
  restDurationSec: number;
  selectedGame: GameType;
  soundEnabled: boolean;
  hapticsEnabled: boolean;

  setRestDuration: (s: number) => void;
  setSelectedGame: (g: GameType) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      restDurationSec: 90,
      selectedGame: "snake",
      soundEnabled: true,
      hapticsEnabled: true,
      setRestDuration: (s) => set({ restDurationSec: s }),
      setSelectedGame: (g) => set({ selectedGame: g }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
    }),
    {
      name: "fg-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);