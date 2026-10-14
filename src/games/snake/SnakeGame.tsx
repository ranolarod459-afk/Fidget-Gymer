import React, { useEffect, useRef, useState, memo } from "react";
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

// Board dimensions constant, used both for viewBox and wall rendering.
const BOARD_SIZE = 20;
const WALL = 0.15;
const EYE_SIZE = 0.18;
const EYE_OFFSET = 0.22;

// ----- Static board (never re-renders during play) -----

const SnakeBoard = memo(function SnakeBoard({ size }: { size: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      style={StyleSheet.absoluteFill}>
      {/* Play area background */}
      <Rect
        x={0}
        y={0}
        width={BOARD_SIZE}
        height={BOARD_SIZE}
        fill={colors.surfaceLowest}
      />
      {/* Wall border — 4 rects, drawn once */}
      <Rect
        x={0}
        y={0}
        width={BOARD_SIZE}
        height={WALL}
        fill={colors.primaryDark}
      />
      <Rect
        x={0}
        y={BOARD_SIZE - WALL}
        width={BOARD_SIZE}
        height={WALL}
        fill={colors.primaryDark}
      />
      <Rect
        x={0}
        y={0}
        width={WALL}
        height={BOARD_SIZE}
        fill={colors.primaryDark}
      />
      <Rect
        x={BOARD_SIZE - WALL}
        y={0}
        width={WALL}
        height={BOARD_SIZE}
        fill={colors.primaryDark}
      />
    </Svg>
  );
});

// ----- Moving entities (food + snake) -----

const SnakeEntities = memo(function SnakeEntities({
  state,
  size,
}: {
  state: SnakeState;
  size: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      style={StyleSheet.absoluteFill}>
      {/* Food */}
      <Rect
        x={state.food.x + 0.15}
        y={state.food.y + 0.15}
        width={0.7}
        height={0.7}
        fill={colors.amber}
      />

      {/* Snake */}
      {state.snake.map((p, i) => {
        const isHead = i === 0;
        const x = p.x + 0.05;
        const y = p.y + 0.05;
        const w = 0.9;

        let eye1 = { x: 0, y: 0 };
        let eye2 = { x: 0, y: 0 };
        if (isHead) {
          if (state.dir === "right") {
            eye1 = { x: x + w - EYE_OFFSET - EYE_SIZE, y: y + EYE_OFFSET };
            eye2 = {
              x: x + w - EYE_OFFSET - EYE_SIZE,
              y: y + w - EYE_OFFSET - EYE_SIZE,
            };
          } else if (state.dir === "left") {
            eye1 = { x: x + EYE_OFFSET, y: y + EYE_OFFSET };
            eye2 = { x: x + EYE_OFFSET, y: y + w - EYE_OFFSET - EYE_SIZE };
          } else if (state.dir === "up") {
            eye1 = { x: x + EYE_OFFSET, y: y + EYE_OFFSET };
            eye2 = { x: x + w - EYE_OFFSET - EYE_SIZE, y: y + EYE_OFFSET };
          } else {
            eye1 = { x: x + EYE_OFFSET, y: y + w - EYE_OFFSET - EYE_SIZE };
            eye2 = {
              x: x + w - EYE_OFFSET - EYE_SIZE,
              y: y + w - EYE_OFFSET - EYE_SIZE,
            };
          }
        }

        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={w}
              height={w}
              fill={isHead ? colors.primaryLight : colors.primary}
              rx={0.15}
            />
            {isHead && (
              <>
                <Rect
                  x={eye1.x}
                  y={eye1.y}
                  width={EYE_SIZE}
                  height={EYE_SIZE}
                  fill={colors.surfaceLowest}
                />
                <Rect
                  x={eye2.x}
                  y={eye2.y}
                  width={EYE_SIZE}
                  height={EYE_SIZE}
                  fill={colors.surfaceLowest}
                />
              </>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
});

// ----- Main component -----

export function SnakeGame() {
  const phase = useWorkout((s) => s.phase);
  const submitScore = useWorkout((s) => s.submitScore);
  const setStatus = useGame((s) => s.setStatus);
  const setScore = useGame((s) => s.setScore);
  const status = useGame((s) => s.status);
  const countdown = useWorkout((s) => s.countdown);
  const uiBlocked = useWorkout((s) => s.uiBlocked);

  const [state, setState] = useState<SnakeState>(() =>
    createSnake(DEFAULT_COLS, DEFAULT_ROWS),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const [boardSize, setBoardSize] = useState(0);
  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setBoardSize(width);
  };

  const isAlive = state.alive;
  const countdownReady = countdown === null || countdown === 0;
  const gameActive =
    phase === "playing" && isAlive && countdownReady && !uiBlocked;

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

  useEffect(() => {
    if (status === "ready") {
      const fresh = createSnake(DEFAULT_COLS, DEFAULT_ROWS);
      stateRef.current = fresh;
      setState(fresh);
      setScore(0);
      deathReportedRef.current = false;
    }
  }, [status, setScore]);

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

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const s = useWorkout.getState();
        const g = useGame.getState();
        if (s.phase !== "playing") return false;
        if (s.uiBlocked) return false;
        if (s.countdown !== null && s.countdown > 0) return false;
        if (g.status === "dead") return false;
        return true;
      },
      onMoveShouldSetPanResponder: () => {
        const s = useWorkout.getState();
        const g = useGame.getState();
        if (s.phase !== "playing") return false;
        if (s.uiBlocked) return false;
        if (s.countdown !== null && s.countdown > 0) return false;
        if (g.status === "dead") return false;
        return true;
      },
      onPanResponderRelease: (_, gestureState) => {
        const s = useWorkout.getState();
        const gs = useGame.getState();
        if (s.phase !== "playing") return;
        if (s.uiBlocked) return;
        if (s.countdown !== null && s.countdown > 0) return;
        if (gs.status === "dead") return;

        const { dx, dy } = gestureState;
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

  return (
    <View style={styles.wrap} {...pan.panHandlers}>
      <View style={styles.boardContainer} onLayout={onBoardLayout}>
        {boardSize > 0 && (
          <>
            <SnakeBoard size={boardSize} />
            <SnakeEntities state={state} size={boardSize} />
          </>
        )}
      </View>

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
  },
  boardContainer: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  controlZone: {
    flex: 1,
    width: "100%",
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
