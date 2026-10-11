export type Point = { x: number; y: number };
export type Dir = "up" | "down" | "left" | "right";

export interface SnakeState {
  snake: Point[];
  dir: Dir;
  nextDir: Dir;
  food: Point;
  cols: number;
  rows: number;
  alive: boolean;
  score: number;
  /** Accumulated ms since last step — used to advance on a fixed tick. */
  accumulator: number;
}

export const TICK_MS = 180; // lower = faster snake
export const DEFAULT_COLS = 20;
export const DEFAULT_ROWS = 20;

export function createSnake(
  cols = DEFAULT_COLS,
  rows = DEFAULT_ROWS,
): SnakeState {
  const mid: Point = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
  const snake: Point[] = [
    mid,
    { x: mid.x - 1, y: mid.y },
    { x: mid.x - 2, y: mid.y },
  ];
  return {
    snake,
    dir: "right",
    nextDir: "right",
    food: spawnFood(cols, rows, snake),
    cols,
    rows,
    alive: true,
    score: 0,
    accumulator: 0,
  };
}

function spawnFood(cols: number, rows: number, snake: Point[]): Point {
  // Safety cap so a full board doesn't infinite-loop.
  for (let i = 0; i < 500; i++) {
    const p = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
  }
  return { x: 0, y: 0 };
}

export function setDirection(state: SnakeState, dir: Dir): SnakeState {
  const opposite: Record<Dir, Dir> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  // Can't reverse directly into yourself.
  if (opposite[dir] === state.dir) return state;
  return { ...state, nextDir: dir };
}

export function stepSnake(state: SnakeState): SnakeState {
  if (!state.alive) return state;

  const dir = state.nextDir;
  const head = state.snake[0];
  const delta: Record<Dir, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const next: Point = { x: head.x + delta[dir].x, y: head.y + delta[dir].y };

  // Wall collision
  if (
    next.x < 0 ||
    next.y < 0 ||
    next.x >= state.cols ||
    next.y >= state.rows
  ) {
    return { ...state, dir, alive: false, accumulator: 0 };
  }

  // Self-collision — exclude the tail since it will move this tick.
  const body = state.snake.slice(0, -1);
  if (body.some((s) => s.x === next.x && s.y === next.y)) {
    return { ...state, dir, alive: false, accumulator: 0 };
  }

  const ate = next.x === state.food.x && next.y === state.food.y;
  const newSnake = [next, ...state.snake];
  if (!ate) newSnake.pop();

  return {
    ...state,
    snake: newSnake,
    dir,
    food: ate ? spawnFood(state.cols, state.rows, newSnake) : state.food,
    score: ate ? state.score + 1 : state.score,
    accumulator: 0,
  };
}
