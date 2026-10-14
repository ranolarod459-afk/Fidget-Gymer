import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { colors, fonts } from "../theme/colors";
import { useWorkout } from "../state/workoutStore";
import { PixelButton } from "./PixelButton";
import { useGame } from "../state/gameStore";

const { width: W, height: H } = Dimensions.get("window");

interface Props {
  onQuit: () => void;
}

export function PauseOverlay({ onQuit }: Props) {
  const phase = useWorkout((s) => s.phase);
  const gameStatus = useGame((s) => s.status);
  const resume = useWorkout((s) => s.resume);

  // Only show Pause when no higher-priority overlay is active.
  if (phase !== "paused") return null;
  if (phase === "restOver") return null; // safety, shouldn't happen
  if (gameStatus === "dead") return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.title}>PAUSED</Text>
        <Text style={styles.hint}>Rest timer is stopped too.</Text>
        <PixelButton
          label="RESUME"
          fullWidth
          onPress={resume}
          style={{ marginTop: 16 }}
        />
        <PixelButton
          label="END WORKOUT"
          variant="neutral"
          fullWidth
          onPress={onQuit}
          style={{ marginTop: 8 }}
        />
      </View>
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
    backgroundColor: "rgba(0,0,0,0.85)",
    padding: 24,
    zIndex: 30,
  },
  card: {
    backgroundColor: colors.surfaceHigh,
    padding: 20,
    width: "100%",
    borderWidth: 3,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
  },
  title: {
    fontFamily: fonts.pixel,
    fontSize: 20,
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 1,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 8,
  },
});
