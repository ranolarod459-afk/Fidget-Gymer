import React, { useEffect, useRef, useState, memo } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { playFlap, playScore, playDeath } from "../../utils/sounds";
import { colors } from "../../theme/colors";
import { useWorkout } from "../../state/workoutStore";
import { useGame } from "../../state/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import {
  createFlappy,
  flap,
  stepFlappy,
  FlappyState,
  Pipe,
  PIPE_WIDTH,
  PIPE_GAP,
  BIRD_X,
  BIRD_RADIUS,
} from "./flappyLogic";
import { hapticLight } from "../../utils/haptics";

/**
 * Minimum ms between React re-renders. Physics runs every frame regardless.
 * 28ms ≈ 35fps. Raise if still laggy, lower if you have headroom.
 */
const RENDER_THROTTLE_MS = 51;

// ----- Static background layer -----
// Rendered once, never re-renders during play.
const BoardBackground = memo(function BoardBackground({
  w,
  h,
}: {
  w: number;
  h: number;
}) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={1} height={1} fill={colors.surfaceLowest} />
    </Svg>
  );
});

// ----- Pipes layer -----
// Re-renders only when the pipes array reference changes.
const PipesLayer = memo(function PipesLayer({
  pipes,
  w,
  h,
}: {
  pipes: Pipe[];
  w: number;
  h: number;
}) {
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}>
      {pipes.map((p, i) => {
        const gapTop = p.gapY - PIPE_GAP / 2;
        const gapBottom = p.gapY + PIPE_GAP / 2;
        const capHeight = 0.025;
        const capOverhang = 0.01;
        return (
          <React.Fragment key={i}>
            <Rect
              x={p.x}
              y={0}
              width={PIPE_WIDTH}
              height={Math.max(0, gapTop - capHeight)}
              fill={colors.primary}
            />
            <Rect
              x={p.x - capOverhang}
              y={Math.max(0, gapTop - capHeight)}
              width={PIPE_WIDTH + capOverhang * 2}
              height={capHeight}
              fill={colors.primaryLight}
            />
            <Rect
              x={p.x - capOverhang}
              y={gapBottom}
              width={PIPE_WIDTH + capOverhang * 2}
              height={capHeight}
              fill={colors.primaryDark}
            />
            <Rect
              x={p.x}
              y={gapBottom + capHeight}
              width={PIPE_WIDTH}
              height={Math.max(0, 1 - gapBottom - capHeight)}
              fill={colors.primary}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
});

// ----- Bird layer -----
// Re-renders only when birdY changes (which is most frames, but the tree
// is small: 9 rects + 1 svg wrapper).
const BirdLayer = memo(function BirdLayer({
  birdY,
  w,
  h,
}: {
  birdY: number;
  w: number;
  h: number;
}) {
  const r = BIRD_RADIUS;
  const U = (r * 2) / 16;
  const bx = BIRD_X;
  const px = (dx: number) => bx - r + dx * U;
  const py = (dy: number) => birdY - r + dy * U;

  const bodyDark = "#c47a00";
  const bodyMain = colors.amber;
  const belly = colors.amberLight;
  const white = colors.text;
  const black = colors.surfaceLowest;
  const beak = colors.danger;

  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
      pointerEvents="none">
      <Rect x={px(0)} y={py(7)} width={U * 3} height={U * 3} fill={belly} />
      <Rect x={px(3)} y={py(3)} width={U * 6} height={U * 2} fill={bodyMain} />
      <Rect x={px(2)} y={py(5)} width={U * 8} height={U * 5} fill={bodyMain} />
      <Rect x={px(3)} y={py(9)} width={U * 6} height={U * 2} fill={belly} />
      <Rect x={px(3)} y={py(10)} width={U * 6} height={U * 1} fill={bodyDark} />
      <Rect x={px(8)} y={py(4)} width={U * 2} height={U * 2} fill={white} />
      <Rect x={px(9)} y={py(5)} width={U * 1} height={U * 1} fill={black} />
      <Rect x={px(10)} y={py(7)} width={U * 3} height={U * 2} fill={beak} />
      <Rect x={px(10)} y={py(9)} width={U * 2} height={U * 1} fill={bodyDark} />
    </Svg>
  );
});

// ----- Main component -----
export function FlappyGame() {
  const phase = useWorkout((s) => s.phase);
  const submitScore = useWorkout((s) => s.submitScore);
  const setStatus = useGame((s) => s.setStatus);
  const setScore = useGame((s) => s.setScore);
  const status = useGame((s) => s.status);

  const stateRef = useRef<FlappyState>(createFlappy());
  const lastRenderRef = useRef(0);

  // Snapshot of the physics state, published to React at the throttle rate.
  const [frame, setFrame] = useState<FlappyState>(() => stateRef.current);
  const alive = frame.alive;

  const [board, setBoard] = useState({ w: 0, h: 0 });
  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoard({ w: width, h: height });
  };

  const gameActive = phase === "playing" && alive;

  useGameLoop(gameActive, (delta) => {
    const prev = stateRef.current;
    const next = stepFlappy(prev, delta / 1000);
    stateRef.current = next;

    if (next.score > prev.score) {
      hapticLight();
      playScore();
      setScore(next.score);
    }

    if (!next.alive && prev.alive) {
      lastRenderRef.current = 0;
      setFrame(next);
      setStatus("dead");
      playDeath();
      submitScore("flappy", next.score);
      return;
    }

    const now = Date.now();
    if (now - lastRenderRef.current >= RENDER_THROTTLE_MS) {
      lastRenderRef.current = now;
      setFrame(next);
    }
  });

  // Reset on Play Again.
  useEffect(() => {
    if (status === "ready") {
      const fresh = createFlappy();
      stateRef.current = fresh;
      lastRenderRef.current = 0;
      setFrame(fresh);
      setScore(0);
    }
  }, [status, setScore]);

  // Reset on new workout.
  useEffect(() => {
    if (phase === "idle") {
      const fresh = createFlappy();
      stateRef.current = fresh;
      lastRenderRef.current = 0;
      setFrame(fresh);
      setStatus("ready");
      setScore(0);
    }
  }, [phase, setStatus, setScore]);

  const onFlap = () => {
    if (!stateRef.current.alive) return;
    const next = flap(stateRef.current);
    stateRef.current = next;
    lastRenderRef.current = 0;
    playFlap();
    setFrame(next);
  };

  const ready = board.w > 0 && board.h > 0;

  return (
    <View
      style={styles.wrap}
      onLayout={onBoardLayout}
      onStartShouldSetResponder={() => true}
      onResponderGrant={onFlap}>
      {ready && (
        <>
          <BoardBackground w={board.w} h={board.h} />
          <PipesLayer pipes={frame.pipes} w={board.w} h={board.h} />
          <BirdLayer birdY={frame.birdY} w={board.w} h={board.h} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.surfaceLowest,
    overflow: "hidden",
  },
});
