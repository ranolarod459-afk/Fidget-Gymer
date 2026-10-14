/**
 * Galaga-style physics — pure functions, no React.
 *
 * Enemies spawn above the screen and descend. Three enemy types with
 * distinct behaviors:
 *   - worker  (diver): fast descent, no shooting
 *   - soldier (shooter): slower descent, shoots periodically
 *   - boss    (chaser): descends and tracks player horizontally, shoots
 *
 * Normalized [0, 1] coordinates:
 *   x: 0 = left, 1 = right
 *   y: 0 = top, 1 = bottom
 */

// ----- Tunable constants -----

export const PLAYER_SPEED = 0.9;
export const PLAYER_WIDTH = 0.08;
export const PLAYER_Y = 0.88;

export const BULLET_SPEED = 1.4;
export const PLAYER_FIRE_INTERVAL = 0.28;

export const ENEMY_BULLET_SPEED = 0.55;

export const ENEMY_WIDTH = 0.07;
export const ENEMY_HEIGHT = 0.05;

/** Enemy speeds (normalized units/sec) by type. */
export const DIVER_SPEED = 0.7;
export const SHOOTER_SPEED = 0.22;
export const CHASER_SPEED = 0.3;

/** Enemy fire cooldown ranges by type, in seconds. */
export const SHOOTER_FIRE_MIN = 1.4;
export const SHOOTER_FIRE_MAX = 1.7;
export const CHASER_FIRE_MIN = 1.4;
export const CHASER_FIRE_MAX = 2.0;

/** Chaser horizontal tracking strength. */
export const CHASER_TRACK_STRENGTH = 0.3;
/** Boss alternates between tracking and drifting every N seconds. */
export const BOSS_PHASE_DURATION = 1.5;

export const SPAWN_INTERVAL_START = 1.0;
export const SPAWN_INTERVAL_FLOOR = 0.6;
export const MAX_ENEMIES = 10;

export type EnemyKind = "worker" | "soldier" | "boss";

export interface Enemy {
  id: number;
  x: number;
  y: number;
  kind: EnemyKind;
  vx: number;
  vy: number;
  fireCd: number;
  /** Age in seconds. Used to time-limit chaser tracking. */
  age: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hostile: boolean;
}

export interface GalagaState {
  playerX: number;
  fireCd: number;

  enemies: Enemy[];
  bullets: Bullet[];

  score: number;
  alive: boolean;

  spawnTimer: number;
  nextId: number;

  /** Total enemies killed — used to ramp difficulty. */
  kills: number;
}

/** After this many seconds, a chaser stops tracking the player and
 *  drifts off, then despawns. Keeps them a temporary threat. */
export const CHASER_TRACK_DURATION = 4.0;
/** Speed at which a chaser drifts off-screen after tracking ends. */
export const CHASER_ESCAPE_SPEED = 0.4;

// ----- Helpers -----

export function enemyScore(kind: EnemyKind): number {
  if (kind === "boss") return 3;
  return 1;
}

function pickKind(kills: number): EnemyKind {
  const r = Math.random();
  if (kills < 2) {
    return "worker";
  } else if (kills < 5) {
    return r < 0.5 ? "worker" : "soldier";
  } else {
    if (r < 0.3) return "worker";
    if (r < 0.65) return "soldier";
    return "boss";
  }
}

function randomFireCd(kind: EnemyKind): number {
  if (kind === "soldier") {
    return (
      SHOOTER_FIRE_MIN + Math.random() * (SHOOTER_FIRE_MAX - SHOOTER_FIRE_MIN)
    );
  }
  if (kind === "boss") {
    return (
      CHASER_FIRE_MIN + Math.random() * (CHASER_FIRE_MAX - CHASER_FIRE_MIN)
    );
  }
  return 9999; // never fires
}

function makeEnemy(id: number, kind: EnemyKind): Enemy {
  const x = 0.15 + Math.random() * 0.7;
  const vy =
    kind === "worker"
      ? DIVER_SPEED
      : kind === "soldier"
        ? SHOOTER_SPEED
        : CHASER_SPEED;
  const vx = kind === "worker" ? (Math.random() - 0.5) * 0.4 : 0;
  return {
    id,
    x,
    y: -0.1,
    kind,
    vx,
    vy,
    fireCd: randomFireCd(kind),
    age: 0,
  };
}

// ----- Lifecycle -----

export function createGalaga(): GalagaState {
  return {
    playerX: 0.5,
    fireCd: 0,
    enemies: [],
    bullets: [],
    score: 0,
    alive: true,
    spawnTimer: 0,
    nextId: 1,
    kills: 0,
  };
}

// ----- Input -----

export function setPlayerTarget(s: GalagaState, x: number): GalagaState {
  const clamped = Math.max(PLAYER_WIDTH / 2, Math.min(1 - PLAYER_WIDTH / 2, x));
  return { ...s, playerX: clamped };
}

// ----- Per-frame update -----

export function stepGalaga(s: GalagaState, dtSec: number): GalagaState {
  if (!s.alive) return s;
  const dt = Math.min(dtSec, 0.05);

  // ----- Player auto-fire -----
  let fireCd = Math.max(0, s.fireCd - dt);
  let bullets = s.bullets.map((b) => ({
    ...b,
    x: b.x + b.vx * dt,
    y: b.y + b.vy * dt,
  }));

  let nextId = s.nextId;

  if (fireCd <= 0) {
    bullets.push({
      id: nextId++,
      x: s.playerX,
      y: PLAYER_Y - 0.03,
      vx: 0,
      vy: -BULLET_SPEED,
      hostile: false,
    });
    fireCd = PLAYER_FIRE_INTERVAL;
  }

  // Remove off-screen bullets
  bullets = bullets.filter((b) => b.y > -0.15 && b.y < 1.15);

  // ----- Enemy movement -----
  const enemies: Enemy[] = [];
  const newBullets: Bullet[] = [];

  for (const e of s.enemies) {
    let x = e.x + e.vx * dt;
    let y = e.y + e.vy * dt;
    let fireCdE = e.fireCd - dt;
    const age = e.age + dt;

    // Boss alternates between tracking and drifting every
    // BOSS_PHASE_DURATION seconds. During the tracking phase, it aims
    // at the player with a per-enemy offset and jitter. During the
    // drift phase, it moves horizontally in a direction that changes
    // each cycle, so the player can't predict it.
    if (e.kind === "boss") {
      const phaseIndex = Math.floor(age / BOSS_PHASE_DURATION);
      const tracking = phaseIndex % 2 === 0;
      if (tracking) {
        const targetOffset = Math.sin(e.id * 12.9898) * 0.15;
        const targetX = Math.max(
          0.05,
          Math.min(0.95, s.playerX + targetOffset),
        );
        const dx = targetX - x;
        const jitter = Math.sin((y + e.id) * 8) * 0.03;
        x += Math.sign(dx) * Math.min(Math.abs(dx), CHASER_TRACK_STRENGTH * dt);
        x += jitter * dt;
      } else {
        const driftDir = (e.id + phaseIndex) % 2 === 0 ? 1 : -1;
        x += driftDir * CHASER_ESCAPE_SPEED * dt;
        y += 0.15 * dt;
      }
    }

    // Divers: gentle sine drift for a weaving pattern
    if (e.kind === "worker") {
      x += Math.sin((y + e.id) * 6) * 0.03 * dt;
    }

    // Despawn conditions:
    //  - off the bottom
    //  - off either side (after escape phase)
    if (y > 1.15 || x < -0.15 || x > 1.15) {
      continue;
    }

    // Fire for shooters and chasers
    if ((e.kind === "soldier" || e.kind === "boss") && fireCdE <= 0) {
      newBullets.push({
        id: nextId++,
        x,
        y: y + ENEMY_HEIGHT / 2,
        vx: 0,
        vy: ENEMY_BULLET_SPEED,
        hostile: true,
      });
      fireCdE = randomFireCd(e.kind);
    }

    enemies.push({
      ...e,
      x, // no clamping during escape phase — allow leaving the screen
      y,
      fireCd: fireCdE,
      age,
    });
  }

  bullets = [...bullets, ...newBullets];

  // ----- Bullet-enemy collisions -----
  let score = s.score;
  let kills = s.kills;
  const survivingEnemies: Enemy[] = [];
  const consumedBullets = new Set<number>();

  for (const e of enemies) {
    let killed = false;
    for (const b of bullets) {
      if (b.hostile) continue;
      if (consumedBullets.has(b.id)) continue;
      if (
        Math.abs(b.x - e.x) < ENEMY_WIDTH / 2 &&
        Math.abs(b.y - e.y) < ENEMY_HEIGHT / 2
      ) {
        consumedBullets.add(b.id);
        killed = true;
        score += enemyScore(e.kind);
        kills += 1;
        break;
      }
    }
    if (!killed) survivingEnemies.push(e);
  }
  bullets = bullets.filter((b) => !consumedBullets.has(b.id));

  // ----- Enemy bullet hits player -----
  let alive = true;
  const survivingBullets: Bullet[] = [];
  for (const b of bullets) {
    if (
      b.hostile &&
      Math.abs(b.x - s.playerX) < PLAYER_WIDTH / 2 &&
      Math.abs(b.y - PLAYER_Y) < 0.03
    ) {
      alive = false;
      continue;
    }
    survivingBullets.push(b);
  }
  bullets = survivingBullets;

  // ----- Enemy rams player -----
  if (alive) {
    for (const e of survivingEnemies) {
      if (
        Math.abs(e.x - s.playerX) < (PLAYER_WIDTH + ENEMY_WIDTH) / 2 - 0.01 &&
        Math.abs(e.y - PLAYER_Y) < 0.04
      ) {
        alive = false;
        break;
      }
    }
  }

  // ----- Timed enemy spawning -----
  const spawnInterval = Math.max(
    SPAWN_INTERVAL_FLOOR,
    SPAWN_INTERVAL_START - Math.floor(kills / 5) * 0.15,
  );
  let spawnTimer = s.spawnTimer + dt;
  let spawnedEnemies = survivingEnemies;
  if (spawnTimer >= spawnInterval && survivingEnemies.length < MAX_ENEMIES) {
    spawnTimer -= spawnInterval;
    const kind = pickKind(kills);
    spawnedEnemies = [...survivingEnemies, makeEnemy(nextId++, kind)];
  }

  return {
    ...s,
    playerX: s.playerX,
    fireCd,
    enemies: spawnedEnemies,
    bullets,
    score,
    alive,
    spawnTimer,
    nextId,
    kills,
  };
}
