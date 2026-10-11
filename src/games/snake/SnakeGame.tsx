import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import { playScore, playDeath, playFlap } from "../../utils/sounds";
import { colors, fonts } from "../../theme/colors";
import { useWorkout } from "../../state/workoutStore";
import { useGame } from "../../state/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import {
  createSnake,
  setDirection,
  stepSnake,
  SnakeState,
  Dir,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  TICK_MS,
} from "./snakeLogic";
import { hapticLight } from "../../utils/haptics";

export function SnakeGame() {
  const phase = useWorkout((s) => s.phase);
  const submitScore = useWorkout((s) => s.submitScore);
  const setStatus = useGame((s) => s.setStatus);
  const setScore = useGame((s) => s.setScore);
  const status = useGame((s) => s.status);

  const [state, setState] = useState<SnakeState>(() =>
    createSnake(DEFAULT_COLS, DEFAULT_ROWS),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  // Board is square and sized to the width of its container.
  const [boardSize, setBoardSize] = useState(0);
  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setBoardSize(width);
  };

  const isAlive = state.alive;
  const gameActive = phase === "playing" && isAlive;

  // Main game loop. Advances the snake on a fixed tick.
  useGameLoop(gameActive, (delta) => {
    const prev = stateRef.current;
    const acc = prev.accumulator + delta;

    if (acc < TICK_MS) {
      stateRef.current = { ...prev, accumulator: acc };
      return;
    }

    const next = stepSnake({ ...prev, accumulator: 0 });
    stateRef.current = next;
    setState(next);

    if (next.score > prev.score) {
      hapticLight();
      playScore();
      setScore(next.score);
    }
  });

  // Report death exactly once per life. Uses a ref so the state store's
  // `status` value can't cause a double-fire on Play Again.
  const deathReportedRef = useRef(false);
  useEffect(() => {
    if (!isAlive && !deathReportedRef.current) {
      deathReportedRef.current = true;
      setStatus("dead");
      playDeath();
      submitScore("snake", state.score);
    }
    if (isAlive) {
      deathReportedRef.current = false;
    }
  }, [isAlive, setStatus, submitScore, state.score]);

  // Reset on Play Again (store flips back to 'ready').
  useEffect(() => {
    if (status === "ready") {
      const fresh = createSnake(DEFAULT_COLS, DEFAULT_ROWS);
      stateRef.current = fresh;
      setState(fresh);
      setScore(0);
      deathReportedRef.current = false;
    }
  }, [status, setScore]);

  // Reset on new workout.
  useEffect(() => {
    if (phase === "idle") {
      const fresh = createSnake(DEFAULT_COLS, DEFAULT_ROWS);
      stateRef.current = fresh;
      setState(fresh);
      setStatus("ready");
      setScore(0);
      deathReportedRef.current = false;
    }
  }, [phase, setStatus, setScore]);

  // Swipe controls — work anywhere in the whole frame.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, g) => {
        const { dx, dy } = g;
        const minSwipe = 15;
        if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

        let dir: Dir;
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? "right" : "left";
        } else {
          dir = dy > 0 ? "down" : "up";
        }

        const cur = stateRef.current;
        const updated = setDirection(cur, dir);
        if (updated !== cur) {
          stateRef.current = updated;
          setState(updated);
          playFlap();
        }
      },
    }),
  ).current;

  const cols = state.cols;
  const rows = state.rows;
  const cell = boardSize > 0 ? boardSize / cols : 0;

  return (
    <View style={styles.wrap} {...pan.panHandlers}>
      {/* Board container — sized to width, aspect 1, pinned to top */}
      <View style={styles.boardContainer} onLayout={onBoardLayout}>
        {boardSize > 0 && (
          <Svg width={boardSize} height={boardSize}>
            {/* Plain dark board background — no grid rects (perf) */}
            <Rect
              x={0}
              y={0}
              width={boardSize}
              height={boardSize}
              fill={colors.surfaceLowest}
            />

            {/* Food */}
            <Rect
              x={state.food.x * cell + cell * 0.15}
              y={state.food.y * cell + cell * 0.15}
              width={cell * 0.7}
              height={cell * 0.7}
              fill={colors.amber}
            />

            {/* Snake */}
            {state.snake.map((p, i) => (
              <Rect
                key={i}
                x={p.x * cell + 1}
                y={p.y * cell + 1}
                width={cell - 2}
                height={cell - 2}
                fill={i === 0 ? colors.primaryLight : colors.primary}
                rx={2}
              />
            ))}
          </Svg>
        )}
      </View>

      {/* Control zone — fills ALL remaining vertical space. Swipe surface. */}
      <View style={styles.controlZone} pointerEvents="none">
        <Text style={styles.controlHint}>▼ SWIPE ANYWHERE TO STEER</Text>
        <View style={styles.controlDots}>
          <View style={styles.controlDot} />
          <View style={styles.controlDot} />
          <View style={styles.controlDot} />
          <View style={styles.controlDot} />
          <View style={styles.controlDot} />
        </View>
        <Text style={styles.controlSub}>THUMB ZONE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingVertical: 8,
    // no justifyContent — the board takes width, control zone flexes
  },
  boardContainer: {
    width: "100%",
    aspectRatio: 1, // square, sized from width
    alignItems: "center",
    justifyContent: "center",
  },
  controlZone: {
    flex: 1, // eats all remaining vertical space
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceHighest,
  },
  controlHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  controlDots: {
    flexDirection: "row",
    gap: 8,
  },
  controlDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.primaryDark,
  },
  controlSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 2,
    marginTop: 4,
  },
});
