import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { colors, fonts } from "../theme/colors";
import { useGame } from "../state/gameStore";
import { useWorkout } from "../state/workoutStore";
import { useSettings } from "../state/settingsStore";
import { PixelButton } from "./PixelButton";

const { width: W, height: H } = Dimensions.get("window");

interface Props {
  onPlayAgain: () => void;
  onQuit: () => void;
}

export function GameOverOverlay({ onPlayAgain, onQuit }: Props) {
  const status = useGame((s) => s.status);
  const score = useGame((s) => s.score);
  const selectedGame = useSettings((s) => s.selectedGame);
  const phase = useWorkout((s) => s.phase);
  const snakeHigh = useWorkout((s) => s.highScores.snake);
  const flappyHigh = useWorkout((s) => s.highScores.flappy);

  if (status !== "dead") return null;
  // RestOver always wins over GameOver.
  if (phase === "restOver") return null;

  const best = selectedGame === "snake" ? snakeHigh : flappyHigh;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.dot} />
            <Text style={styles.headerText}>ARCADE FAIL</Text>
          </View>
          <Text style={styles.headerRight}>REST STILL TICKING</Text>
        </View>

        <Text style={styles.title}>GAME OVER</Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>FINAL:</Text>
          <Text style={styles.scoreValue}>
            {score.toString().padStart(4, "0")}
          </Text>
        </View>
        <Text style={styles.highLabel}>
          BEST: {best.toString().padStart(4, "0")}
        </Text>

        <Text style={styles.hint}>
          Rest timer kept counting. Pick up where you left off when you're
          ready.
        </Text>

        <View style={styles.buttonRow}>
          <PixelButton
            label="PLAY AGAIN"
            onPress={onPlayAgain}
            style={styles.buttonHalf}
          />
          <PixelButton
            label="QUIT"
            variant="neutral"
            onPress={onQuit}
            style={styles.buttonHalf}
          />
        </View>
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
    zIndex: 40,
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
  dot: { width: 6, height: 6, backgroundColor: colors.danger },
  headerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
    letterSpacing: 2,
  },
  headerRight: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.amber,
    letterSpacing: 1,
  },
  title: {
    fontFamily: fonts.pixel,
    fontSize: 22,
    color: colors.danger,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    gap: 10,
  },
  scoreLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  scoreValue: {
    fontFamily: fonts.pixel,
    fontSize: 20,
    color: colors.amber,
    letterSpacing: 1,
  },
  highLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 6,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  buttonHalf: {
    flex: 1,
  },
});
