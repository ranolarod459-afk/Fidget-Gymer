import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useKeepAwake } from "expo-keep-awake";
import { CountdownOverlay } from "../components/CountdownOverlay";
import { useGame } from "../state/gameStore";
import { colors, fonts } from "../theme/colors";
import { useWorkout } from "../state/workoutStore";
import { useRestTimer } from "../hooks/useRestTimer";
import { SnakeGame } from "../games/snake/SnakeGame";
import { FlappyGame } from "../games/flappy/FlappyGame";
import { GalagaGame } from "../games/galaga/GalagaGame";
import { GameOverOverlay } from "../components/GameOverOverlay";
import { RestOverModal } from "../components/RestOverModal";
import { PauseOverlay } from "../components/PauseOverlay";
import { GamePickerOverlay } from "../components/GamePickerOverlay";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function GameScreen() {
  useKeepAwake();
  useRestTimer();

  const nav = useNavigation<any>();
  const phase = useWorkout((s) => s.phase);
  const remaining = useWorkout((s) => s.restRemainingSec);
  const total = useWorkout((s) => s.restDurationSec);
  const sets = useWorkout((s) => s.setsCompleted);
  const pause = useWorkout((s) => s.pause);
  const quit = useWorkout((s) => s.quit);
  const activeGame = useWorkout((s) => s.activeGame);
  const gameScore = useGame((s) => s.score);

  const [pickerOpen, setPickerOpen] = useState(false);
  const setUiBlocked = useWorkout((s) => s.setUiBlocked);

  useEffect(() => {
    useGame.setState({ status: "ready", score: 0 });
  }, [activeGame]);

  const progress = total > 0 ? 1 - remaining / total : 0;

  const onQuit = () => {
    quit();
    nav.goBack();
  };

  const resetGame = () => {
    useGame.setState({ status: "ready", score: 0 });
  };

  const onPlayAgain = () => {
    resetGame();
    useWorkout.getState().beginCountdown();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView
        style={styles.safe}
        edges={["top", "left", "right", "bottom"]}>
        <View style={styles.wrap}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable onPress={onQuit} style={styles.topBtn}>
              <Text style={styles.topBtnText}>[X] HOME</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setUiBlocked(true);
                setPickerOpen(true);
              }}
              style={styles.switchBtn}>
              <Text style={styles.switchBtnText}>SWITCH</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const cd = useWorkout.getState().countdown;
                if (cd !== null && cd > 0) return; // don't pause during countdown
                if (phase === "paused") {
                  useWorkout.getState().resume();
                } else {
                  pause();
                }
              }}
              style={styles.topBtn}>
              <Text style={styles.topBtnText}>
                {phase === "paused" ? "[▶] RESUME" : "[||] PAUSE"}
              </Text>
            </Pressable>
          </View>

          {/* HUD */}
          <View style={styles.hudRow}>
            <View style={styles.hudTimer}>
              <View style={styles.hudTimerHeader}>
                <Text style={styles.hudLabel}>REST TIMER</Text>
                <Text style={styles.hudSync}>● SYNC</Text>
              </View>
              <Text style={styles.hudTimerValue}>{fmt(remaining)}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, progress * 100)}%` },
                  ]}
                />
              </View>
            </View>
            <View style={styles.hudWorkout}>
              <Text style={styles.hudLabel}>WORKOUT</Text>
              <Text style={styles.hudSet}>SET {sets}</Text>
              <Text style={styles.hudReps}>READY</Text>
            </View>
          </View>

          {/* Game frame */}
          <View style={styles.frame}>
            <View style={styles.frameHeader}>
              <View style={styles.frameHeaderLeft}>
                <View style={styles.frameDot} />
                <Text style={styles.frameHeaderText}>DOT MATRIX HUD</Text>
              </View>
              <View style={styles.frameHeaderRight}>
                <Text style={styles.frameHeaderScore}>
                  GAME: {activeGame.toUpperCase()}
                </Text>
                <Text style={styles.frameHeaderLiveScore}>
                  SCORE {gameScore.toString().padStart(3, "0")}
                </Text>
              </View>
            </View>
            <View style={styles.frameInner}>
              {activeGame === "flappy" ? (
                <FlappyGame />
              ) : activeGame === "galaga" ? (
                <GalagaGame />
              ) : (
                <SnakeGame />
              )}
              <View style={styles.frameStatus}>
                <Text style={styles.frameStatusText}>TIMER: CONTINUOUS</Text>
                <Text style={[styles.frameStatusText, { color: colors.amber }]}>
                  CLK: 60HZ
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom caption */}
          <View style={styles.bottomCaption}>
            <Text style={styles.bottomCaptionText}>SERIAL: FG-884-J</Text>
            <Text style={styles.bottomCaptionText}>BATTERY: HIGH</Text>
          </View>
        </View>
      </SafeAreaView>

      <CountdownOverlay />
      <GamePickerOverlay
        visible={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setUiBlocked(false);
          useWorkout.getState().beginCountdown();
        }}
      />
      <RestOverModal />
      <GameOverOverlay onPlayAgain={onPlayAgain} onQuit={onQuit} />
      <PauseOverlay onQuit={onQuit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    position: "relative",
  },
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
  },
  topBtn: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  topBtnText: {
    fontFamily: fonts.pixel,
    fontSize: 8,
    color: colors.primary,
    letterSpacing: 0,
    textAlign: "center",
  },
  switchBtn: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
    alignItems: "center",
    justifyContent: "center",
  },
  switchBtnText: {
    fontFamily: fonts.pixel,
    fontSize: 9,
    color: colors.amber,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  hudRow: { flexDirection: "row", gap: 8 },
  hudTimer: {
    flex: 2,
    backgroundColor: colors.surfaceLow,
    padding: 10,
    borderWidth: 2,
    borderColor: "#000",
    borderTopColor: "#000",
    borderLeftColor: "#000",
    borderBottomColor: colors.surfaceHighest,
    borderRightColor: colors.surfaceHighest,
    alignItems: "center",
  },
  hudWorkout: {
    flex: 1,
    backgroundColor: colors.surfaceLow,
    padding: 10,
    borderWidth: 2,
    borderColor: "#000",
    borderTopColor: "#000",
    borderLeftColor: "#000",
    borderBottomColor: colors.surfaceHighest,
    borderRightColor: colors.surfaceHighest,
    justifyContent: "space-between",
  },
  hudTimerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hudLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  hudSync: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.amber,
    letterSpacing: 1,
  },
  hudTimerValue: {
    fontFamily: fonts.pixel,
    fontSize: 28,
    color: colors.amber,
    letterSpacing: 1,
    marginTop: 6,
    textAlign: "center",
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceHighest,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.amber,
  },
  hudSet: {
    fontFamily: fonts.pixel,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
    marginTop: 4,
  },
  hudReps: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },

  frame: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    padding: 8,
    borderWidth: 3,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
  },
  frameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  frameHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  frameDot: { width: 6, height: 6, backgroundColor: colors.primary },
  frameHeaderText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 2,
  },
  frameHeaderScore: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.amber,
    letterSpacing: 1,
  },
  frameHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  frameHeaderLiveScore: {
    fontFamily: fonts.pixel,
    fontSize: 10,
    color: colors.amber,
    letterSpacing: 1,
  },
  frameInner: {
    flex: 1,
    backgroundColor: colors.surfaceLowest,
    borderWidth: 2,
    borderColor: "#000",
    position: "relative",
    overflow: "hidden",
  },
  frameStatus: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceLowest,
  },
  frameStatusText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 1,
  },

  bottomCaption: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  bottomCaptionText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 2,
  },
});
