import React from "react";
import { View, Text, StyleSheet, Modal } from "react-native";
import { colors, fonts } from "../theme/colors";
import { useWorkout } from "../state/workoutStore";
import { PixelButton } from "./PixelButton";
import { hapticMedium } from "../utils/haptics";

export function RestOverModal() {
  const phase = useWorkout((s) => s.phase);
  const done = useWorkout((s) => s.userDoneWithSet);
  const sets = useWorkout((s) => s.setsCompleted);

  const visible = phase === "restOver";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.dot} />
              <Text style={styles.headerText}>SYS.ALERT</Text>
            </View>
            <Text style={styles.headerRight}>PAUSED</Text>
          </View>

          <Text style={styles.title}>REST OVER!</Text>
          <Text style={styles.sub}>SET {sets + 1} — GO LIFT</Text>
          <Text style={styles.hint}>
            Game frozen. Rerack and hit your reps.
          </Text>

          <PixelButton
            label="SET DONE — RESUME"
            fullWidth
            onPress={() => {
              hapticMedium();
              done();
            }}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: colors.surfaceHigh,
    padding: 16,
    width: "100%",
    borderWidth: 3,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.surfaceLow,
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, backgroundColor: colors.primary },
  headerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 2,
  },
  headerRight: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    letterSpacing: 2,
  },
  title: {
    fontFamily: fonts.pixel,
    fontSize: 20,
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 8,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 10,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 6,
  },
});
