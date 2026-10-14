import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { fonts } from "../theme/colors";
import { useWorkout } from "../state/workoutStore";
import { hapticLight } from "../utils/haptics";
import { useGame } from "../state/gameStore";

const { width: W, height: H } = Dimensions.get("window");

export function CountdownOverlay() {
  const countdown = useWorkout((s) => s.countdown);
  const tickCountdown = useWorkout((s) => s.tickCountdown);
  const clearCountdown = useWorkout((s) => s.clearCountdown);

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const phase = useWorkout((s) => s.phase);
  const gameStatus = useGame((s) => s.status);

  // Countdown only shows if NO higher-priority overlay is active.
  const uiBlocked = useWorkout((s) => s.uiBlocked);

  const higherPriorityActive =
    phase === "restOver" ||
    phase === "paused" ||
    gameStatus === "dead" ||
    uiBlocked;

  const visible = countdown !== null && countdown > 0 && !higherPriorityActive;
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      tickCountdown();
    }, 1000);
    return () => clearInterval(t);
  }, [visible, tickCountdown]);

  useEffect(() => {
    if (!visible) return;
    hapticLight();
    scale.setValue(0.6);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [countdown, visible, scale, opacity]);

  useEffect(() => {
    if (countdown === 0) {
      const t = setTimeout(() => clearCountdown(), 250);
      return () => clearTimeout(t);
    }
  }, [countdown, clearCountdown]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.Text
        style={[styles.number, { opacity, transform: [{ scale }] }]}>
        {countdown}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    height: H,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 20,
  },
  number: {
    fontFamily: fonts.pixel,
    fontSize: 140,
    color: "#ffffff",
    letterSpacing: 4,
  },
});
