import React, { useEffect, useRef, useState, memo } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { colors, fonts } from "../../theme/colors";
import { useWorkout } from "../../state/workoutStore";
import { useGame } from "../../state/gameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import {
  createGalaga,
  stepGalaga,
  setPlayerTarget,
  GalagaState,
  Enemy,
  Bullet,
  PLAYER_Y,
  PLAYER_WIDTH,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
} from "./galagaLogic";
import { hapticLight } from "../../utils/haptics";
import { playScore, playDeath } from "../../utils/sounds";

const RENDER_THROTTLE_MS = 22;

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

const EnemiesLayer = memo(function EnemiesLayer({
  enemies,
  w,
  h,
}: {
  enemies: Enemy[];
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
      {enemies.map((e) => {
        const cx = e.x;
        const cy = e.y;
        const wq = ENEMY_WIDTH;
        const hq = ENEMY_HEIGHT;
        const kindColor =
          e.kind === "boss"
            ? colors.amber
            : e.kind === "soldier"
              ? colors.primaryLight
              : colors.primary;
        // Simple 4-rect enemy shape: body + wings + eye
        return (
          <React.Fragment key={e.id}>
            <Rect
              x={cx - wq / 2}
              y={cy - hq / 2}
              width={wq}
              height={hq * 0.5}
              fill={kindColor}
            />
            <Rect
              x={cx - wq / 3}
              y={cy}
              width={(wq * 2) / 3}
              height={hq * 0.5}
              fill={kindColor}
            />
            <Rect
              x={cx - wq / 8}
              y={cy + hq * 0.25}
              width={wq / 4}
              height={hq * 0.2}
              fill={colors.surfaceLowest}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
});

const BulletsLayer = memo(function BulletsLayer({
  bullets,
  w,
  h,
}: {
  bullets: Bullet[];
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
      {bullets.map((b) => (
        <Rect
          key={b.id}
          x={b.x - 0.005}
          y={b.y - 0.01}
          width={0.01}
          height={0.02}
          fill={b.hostile ? colors.danger : "#ffffff"}
        />
      ))}
    </Svg>
  );
});

const PlayerLayer = memo(function PlayerLayer({
  x,
  w,
  h,
}: {
  x: number;
  w: number;
  h: number;
}) {
  const cx = x;
  const cy = PLAYER_Y;
  const wq = PLAYER_WIDTH;
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
      pointerEvents="none">
      <Rect
        x={cx - wq / 2}
        y={cy}
        width={wq}
        height={0.025}
        fill={colors.primaryLight}
      />
      <Rect
        x={cx - wq / 4}
        y={cy - 0.02}
        width={wq / 2}
        height={0.02}
        fill={colors.primaryLight}
      />
      <Rect
        x={cx - wq / 8}
        y={cy - 0.03}
        width={wq / 4}
        height={0.012}
        fill={colors.primary}
      />
    </Svg>
  );
});

export function GalagaGame() {
  const phase = useWorkout((s) => s.phase);
  const submitScore = useWorkout((s) => s.submitScore);
  const setStatus = useGame((s) => s.setStatus);
  const setScore = useGame((s) => s.setScore);
  const status = useGame((s) => s.status);
  const countdown = useWorkout((s) => s.countdown);
  const uiBlocked = useWorkout((s) => s.uiBlocked);
  const stateRef = useRef<GalagaState>(createGalaga());
  const lastRenderRef = useRef(0);
  const deathReportedRef = useRef(false);

  const [frame, setFrame] = useState<GalagaState>(() => stateRef.current);
  const alive = frame.alive;

  const [board, setBoard] = useState({ w: 0, h: 0 });
  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoard({ w: width, h: height });
  };

  const isAlive = frame.alive;
  const countdownReady = countdown === null || countdown === 0;
  const gameActive =
    phase === "playing" && alive && countdownReady && !uiBlocked;

  useGameLoop(gameActive, (delta) => {
    const prev = stateRef.current;
    const next = stepGalaga(prev, delta / 1000);
    stateRef.current = next;

    if (next.score > prev.score) {
      hapticLight();
      playScore();
      setScore(next.score);
    }

    if (!next.alive && prev.alive) {
      lastRenderRef.current = 0;
      setFrame(next);
      return;
    }

    const now = Date.now();
    if (now - lastRenderRef.current >= RENDER_THROTTLE_MS) {
      lastRenderRef.current = now;
      setFrame(next);
    }
  });

  useEffect(() => {
    if (status === "ready") {
      const fresh = createGalaga();
      stateRef.current = fresh;
      lastRenderRef.current = 0;
      setFrame(fresh);
      setScore(0);
      deathReportedRef.current = false;
    }
  }, [status, setScore]);

  useEffect(() => {
    if (phase === "idle") {
      const fresh = createGalaga();
      stateRef.current = fresh;
      lastRenderRef.current = 0;
      setFrame(fresh);
      setStatus("ready");
      setScore(0);
      deathReportedRef.current = false;
    }
  }, [phase, setStatus, setScore]);

  // Report death once per life. Mirrors the Snake pattern exactly so the
  // high score write is not lost when the game loop returns early.
  useEffect(() => {
    if (!isAlive && !deathReportedRef.current) {
      deathReportedRef.current = true;
      setStatus("dead");
      playDeath();
      submitScore("galaga", frame.score);
    }
    if (isAlive) {
      deathReportedRef.current = false;
    }
  }, [isAlive, setStatus, submitScore, frame.score]);

  const onTouch = (e: any) => {
    if (!stateRef.current.alive) return;

    const s = useWorkout.getState();
    const g = useGame.getState();
    if (s.phase !== "playing") return;
    if (s.uiBlocked) return;
    if (s.countdown !== null && s.countdown > 0) return;
    if (g.status === "dead") return;

    const x = e.nativeEvent.locationX / board.w;
    const next = setPlayerTarget(stateRef.current, x);
    stateRef.current = next;
    lastRenderRef.current = 0;
    setFrame(next);
  };

  const ready = board.w > 0 && board.h > 0;

  return (
    <View
      style={styles.wrap}
      onLayout={onBoardLayout}
      onStartShouldSetResponder={() => {
        const s = useWorkout.getState();
        const g = useGame.getState();
        if (s.phase !== "playing") return false;
        if (s.uiBlocked) return false;
        if (s.countdown !== null && s.countdown > 0) return false;
        if (g.status === "dead") return false;
        return true;
      }}
      onMoveShouldSetResponder={() => {
        const s = useWorkout.getState();
        const g = useGame.getState();
        if (s.phase !== "playing") return false;
        if (s.uiBlocked) return false;
        if (s.countdown !== null && s.countdown > 0) return false;
        if (g.status === "dead") return false;
        return true;
      }}
      onResponderGrant={onTouch}
      onResponderMove={onTouch}>
      {ready && (
        <>
          <BoardBackground w={board.w} h={board.h} />
          <EnemiesLayer enemies={frame.enemies} w={board.w} h={board.h} />
          <BulletsLayer bullets={frame.bullets} w={board.w} h={board.h} />
          <PlayerLayer x={frame.playerX} w={board.w} h={board.h} />
        </>
      )}
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>◀ DRAG TO MOVE ▶</Text>
        <Text style={styles.hintSub}>AUTO-FIRE</Text>
      </View>
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
  hint: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 4,
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    letterSpacing: 2,
  },
  hintSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 2,
  },
});
