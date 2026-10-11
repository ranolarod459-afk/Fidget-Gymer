import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../theme/colors";
import { useWorkout } from "../state/workoutStore";
import { PixelButton } from "./PixelButton";

interface Props {
  onQuit: () => void;
}

export function PauseOverlay({ onQuit }: Props) {
  const phase = useWorkout((s) => s.phase);
  const resume = useWorkout((s) => s.resume);

  if (phase !== "paused") return null;

  return (
    <View style={styles.overlay}>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
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
