/**
 * Flappy Bird physics — pure functions, no React.
 *
 * All positions are normalized to [0, 1] relative to the play area.
 * - x: 0 = left edge, 1 = right edge
 * - y: 0 = top edge, 1 = bottom edge
 *
 * This makes the game resolution-independent: it works on any board size.
 */

// ----- Tunable constants -----

/** Downward acceleration, in normalized units / second^2. */
export const GRAVITY = 1.9;

/** Upward impulse applied on each tap, in normalized units / second. */
export const FLAP_VELOCITY = -0.6;

/** Horizontal speed of pipes, in normalized units / second. */
export const PIPE_SPEED = 0.42;

/** Width of each pipe, as a fraction of the play area width. */
export const PIPE_WIDTH = 0.16;

/** Vertical size of the gap the bird flies through. */
export const PIPE_GAP = 0.26;

/** Seconds between pipe spawns. */
export const PIPE_SPAWN_INTERVAL = 1.48;

/** Fixed x position of the bird (doesn't move horizontally). */
export const BIRD_X = 0.22;

/** Bird's visual radius — used only for drawing. */
export const BIRD_RADIUS = 0.055;

/**
 * Bird's collision radius — smaller than the visual radius so the bird's
 * hitbox is forgiving. This is why the bird can visually brush a pipe
 * without dying.
 */
export const BIRD_COLLISION_RADIUS = 0.032;

/** Maximum absolute velocity, so the bird can't teleport. */
export const MAX_VELOCITY = 1.4;

// ----- Types -----

export interface Pipe {
  /** Left edge x-position of the pipe. */
  x: number;
  /** Center of the gap, y-position. */
  gapY: number;
  /** Whether the bird has already scored off this pipe. */
  passed: boolean;
}

export interface FlappyState {
  /** Bird vertical position (center). */
  birdY: number;
  /** Bird vertical velocity (units/sec). */
  birdVel: number;
  /** Active pipes. */
  pipes: Pipe[];
  /** Score (number of pipes cleared). */
  score: number;
  /** Still alive? */
  alive: boolean;
  /** Seconds since the last pipe spawned. */
  spawnTimer: number;
}

// ----- Lifecycle -----

export function createFlappy(): FlappyState {
  return {
    birdY: 0.5,
    birdVel: 0,
    pipes: [{ x: 1.05, gapY: randomGapY(), passed: false }],
    score: 0,
    alive: true,
    spawnTimer: 0,
  };
}

function randomGapY(): number {
  const min = PIPE_GAP / 2 + 0.05;
  const max = 1 - PIPE_GAP / 2 - 0.05;
  return min + Math.random() * (max - min);
}

// ----- Actions -----

export function flap(state: FlappyState): FlappyState {
  if (!state.alive) return state;
  return { ...state, birdVel: FLAP_VELOCITY };
}

// ----- Per-frame update -----

export function stepFlappy(state: FlappyState, dtSec: number): FlappyState {
  if (!state.alive) return state;

  const dt = Math.min(dtSec, 0.05);

  // --- Bird physics ---
  let vel = state.birdVel + GRAVITY * dt;
  if (vel > MAX_VELOCITY) vel = MAX_VELOCITY;
  if (vel < -MAX_VELOCITY) vel = -MAX_VELOCITY;
  const birdY = state.birdY + vel * dt;

  // Ceiling / floor collision uses the forgiving collision radius.
  if (birdY - BIRD_COLLISION_RADIUS < 0 || birdY + BIRD_COLLISION_RADIUS > 1) {
    return { ...state, birdY, birdVel: vel, alive: false };
  }

  // --- Pipes: move, remove off-screen, spawn new ---
  let pipes = state.pipes
    .map((p) => ({ ...p, x: p.x - PIPE_SPEED * dt }))
    .filter((p) => p.x + PIPE_WIDTH > -0.05);

  let spawnTimer = state.spawnTimer + dt;
  if (spawnTimer >= PIPE_SPAWN_INTERVAL) {
    spawnTimer -= PIPE_SPAWN_INTERVAL;
    pipes = [...pipes, { x: 1.05, gapY: randomGapY(), passed: false }];
  }

  // --- Scoring & collision ---
  let score = state.score;
  let alive = true;

  for (const p of pipes) {
    // Score when the bird's left edge passes the pipe's right edge.
    if (!p.passed && p.x + PIPE_WIDTH < BIRD_X - BIRD_COLLISION_RADIUS) {
      p.passed = true;
      score += 1;
    }

    // Collision check with the forgiving hitbox.
    const overlapX =
      BIRD_X + BIRD_COLLISION_RADIUS > p.x &&
      BIRD_X - BIRD_COLLISION_RADIUS < p.x + PIPE_WIDTH;

    if (overlapX) {
      const gapTop = p.gapY - PIPE_GAP / 2;
      const gapBottom = p.gapY + PIPE_GAP / 2;
      const hitsTopPipe = birdY - BIRD_COLLISION_RADIUS < gapTop;
      const hitsBottomPipe = birdY + BIRD_COLLISION_RADIUS > gapBottom;
      if (hitsTopPipe || hitsBottomPipe) {
        alive = false;
        break;
      }
    }
  }

  return { ...state, birdY, birdVel: vel, pipes, spawnTimer, score, alive };
}
