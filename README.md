# Fidget Gymer

A retro arcade rest-timer for the gym. Set how long you're resting between sets, play Snake or Flappy Bird while you wait, and get a notification when it's time to lift again. Built to replace idle phone-fidgeting with something genuinely engaging during rest periods.

## The Problem

Resting between sets is boring when you're training alone. The default behavior — scrolling social media, checking messages, opening random apps — fragments attention and rarely feels good. You either cut rest short or waste it entirely.

Fidget Gymer reframes that dead time: the rest timer _is_ the game boundary. Play until rest ends, get pulled back to your workout, then play again between the next set. The game pauses automatically. It resumes exactly where you left off. Over a full session, you complete a run that would otherwise be spent doom-scrolling.

## Core Loop

1. Choose a rest duration (1–5 minutes) on the home screen
2. Choose a game: Snake or Flappy Bird
3. Tap **Start Game** — the rest timer begins, the game begins
4. Play while the timer counts down in the HUD
5. When rest ends, the game **freezes mid-motion** and a "REST OVER" modal appears with a haptic vibration and chime
6. Do your set
7. Tap **Set Done — Resume** — the timer resets, the game resumes from the exact frame it froze on
8. Repeat until the workout is done

Losing the game is fully decoupled from the rest timer. If you die, you see a **GAME OVER** overlay, but the timer keeps running underneath. You can restart the run without losing your rest interval.

## Features

- Adjustable rest duration (60s to 5min presets)
- Two mini-games, each tuned for short-burst play
- Rest-end notifications that fire even when the screen is off
- Retro CRT aesthetic: pixel fonts, chunky arcade buttons, scanline overlay, green-on-black Game Boy palette
- Chiptune sound effects and haptic feedback
- Persistent high scores across sessions

## Tech Stack

- **Expo SDK 57** with **React Native** and **TypeScript** — cross-platform mobile, fast iteration with a dev client
- **React Navigation** — native stack navigation between Home and Game screens
- **Zustand + AsyncStorage** — lightweight state stores with selective persistence
- **react-native-svg** — game rendering; grid-based Snake and time-based Flappy use normalized [0,1] coordinate systems so the games scale to any board size
- **expo-audio** — pre-loaded chiptune SFX, toggled by a global sound setting
- **expo-notifications** — scheduled local notifications for rest-end alerts
- **expo-haptics, expo-keep-awake** — tactile feedback and screen-wake during workouts
- **expo-splash-screen** — custom splash on the app's dark-green palette
- **EAS Build** — cloud-built dev and preview APKs, with a managed-workflow pipeline

## Architecture

The app is built around two independent state machines:

**Workout FSM** (`src/state/workoutStore.ts`)
idle → playing → restOver → playing → ... → idle
↓
paused

**Game FSM** (`src/state/gameStore.ts`)
ready → alive → dead → ready (on Play Again) or idle (on Quit)

They interact in exactly two places:

- When rest hits zero, the workout FSM enters `restOver` and the game's render loop **freezes** (no reset)
- When the user taps "Set Done — Resume", the game's render loop resumes from the frozen frame

Losing the game only touches the game FSM. The rest timer keeps ticking. This is the app's central design constraint — a losing run never costs you a rest interval, and a rest interval never costs you your progress.

## Game Loops

Both games share a single RAF-driven hook (`src/hooks/useGameLoop.ts`) that fires `onFrame(deltaMs)` while `active` is true.

**Snake** is tick-based: physics advances one grid cell per `TICK_MS` (default 180ms), regardless of framerate. This keeps movement consistent across devices.

**Flappy** is time-based: gravity, velocity, and pipe positions integrate on `deltaSec`, so the game responds identically at 30, 60, or 120fps.

The Game component tree is split into memoized layers (background, pipes, bird) so React only re-renders what actually moved on each frame. The bird's Y position is the only truly continuous value; pipes and background render at a throttled rate.

## Project Structure

src/
├── components/ reusable UI (buttons, icons, overlays, scanlines)
├── games/
│ ├── flappy/ physics + renderer
│ └── snake/ grid logic + renderer
├── hooks/ useGameLoop, useRestTimer
├── navigation/ React Navigation stack
├── screens/ HomeScreen, GameScreen
├── state/ Zustand stores (settings, workout, game)
├── theme/ colors, fonts, scanline toggle
└── utils/ audio, haptics, notifications

## Getting Started

Requires Node 18+, JDK 17, Android SDK, and an Expo account for EAS builds.

```bash
npm install
npx expo start

For development builds (needed because the app uses native modules like expo-audio):
eas build --profile development --platform android

For a shareable, standalone APK:
eas build --profile preview --platform android

Install (for users)
Go to the Releases page

Download the latest .apk file

Open it on your Android phone

Allow install from unknown sources if prompted

Launch Fidget Gymer from your app drawer

Notes
This is a personal project built to solve a specific problem in the author's training routine. It's not on the Play Store; distribution is via GitHub Releases (sideload-only). Built entirely with free-tier tooling — Expo, EAS, and open-source dependencies. No paid services, no proprietary SDKs.
```
