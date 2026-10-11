import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import { useSettings } from "../state/settingsStore";

/**
 * Pre-loaded sound effects. Loaded once on app start and reused.
 * All sounds are short (<500ms) chiptune blips.
 *
 * Uses expo-audio (the successor to expo-av).
 * Sounds respect the `soundEnabled` toggle in settings.
 */

let flapPlayer: AudioPlayer | null = null;
let scorePlayer: AudioPlayer | null = null;
let deathPlayer: AudioPlayer | null = null;
let restOverPlayer: AudioPlayer | null = null;
let startPlayer: AudioPlayer | null = null;

function soundsOn() {
  return useSettings.getState().soundEnabled;
}

export async function preloadSounds() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    });

    flapPlayer = createAudioPlayer(require("../../assets/sounds/flap.wav"));
    scorePlayer = createAudioPlayer(require("../../assets/sounds/score.wav"));
    deathPlayer = createAudioPlayer(require("../../assets/sounds/death.wav"));
    restOverPlayer = createAudioPlayer(
      require("../../assets/sounds/restover.wav"),
    );
    startPlayer = createAudioPlayer(require("../../assets/sounds/start.wav"));
  } catch (e) {
    console.warn("[sounds] preload failed", e);
  }
}

function play(player: AudioPlayer | null) {
  if (!player) return;
  if (!soundsOn()) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // ignore
  }
}

export function playFlap() {
  play(flapPlayer);
}
export function playScore() {
  play(scorePlayer);
}
export function playDeath() {
  play(deathPlayer);
}
export function playRestOver() {
  play(restOverPlayer);
}
export function playStart() {
  play(startPlayer);
}

export async function unloadSounds() {
  try {
    flapPlayer?.remove();
    scorePlayer?.remove();
    deathPlayer?.remove();
    restOverPlayer?.remove();
    startPlayer?.remove();
  } catch {
    // ignore
  }
}
