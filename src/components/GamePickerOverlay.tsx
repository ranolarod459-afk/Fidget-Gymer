import React from "react";
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { colors, fonts } from "../theme/colors";
import { useWorkout } from "../state/workoutStore";
import { useGame } from "../state/gameStore";
import { useSettings, GameType } from "../state/settingsStore";
import { SnakeIcon, BirdIcon, GalagaIcon } from "./PixelIcon";
import { PixelButton } from "./PixelButton";

const { width: W, height: H } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function GamePickerOverlay({ visible, onClose }: Props) {
  const activeGame = useWorkout((s) => s.activeGame);
  const switchGame = useWorkout((s) => s.switchGame);
  const setGameStatus = useGame((s) => s.setStatus);
  const setGameScore = useGame((s) => s.setScore);

  if (!visible) return null;

  const choose = (game: GameType) => {
    if (game === activeGame) {
      onClose();
      return;
    }
    setGameStatus("ready");
    setGameScore(0);
    switchGame(game);
    onClose();
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.dot} />
            <Text style={styles.headerText}>SWITCH GAME</Text>
          </View>
          <Text style={styles.headerRight}>TIMER KEEPS RUNNING</Text>
        </View>

        <View style={styles.grid}>
          <PickCard
            active={activeGame === "snake"}
            label="SNAKE"
            sub="CLASSIC RUN"
            icon={<SnakeIcon size={36} />}
            onPress={() => choose("snake")}
          />
          <PickCard
            active={activeGame === "flappy"}
            label="FLAPPY"
            sub="PIXEL WINGS"
            icon={<BirdIcon size={36} />}
            onPress={() => choose("flappy")}
          />
          <PickCard
            active={activeGame === "galaga"}
            label="GALAGA"
            sub="STAR SWARM"
            icon={<GalagaIcon size={36} />}
            onPress={() => choose("galaga")}
          />
        </View>

        <PixelButton
          label="CANCEL"
          variant="neutral"
          fullWidth
          onPress={onClose}
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

function PickCard({
  active,
  label,
  sub,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  sub: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pickCard,
        active ? styles.pickCardActive : styles.pickCardIdle,
      ]}>
      <Text
        style={[
          styles.pickBadge,
          active ? styles.pickBadgeActive : styles.pickBadgeIdle,
        ]}>
        {active ? "ACTIVE" : "SWITCH"}
      </Text>
      <View style={styles.pickIconWrap}>{icon}</View>
      <Text
        style={[
          styles.pickLabel,
          { color: active ? colors.primary : colors.textMuted },
        ]}>
        {label}
      </Text>
      <Text style={styles.pickSub}>{sub}</Text>
    </Pressable>
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
    zIndex: 45,
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
    fontSize: 11,
    color: colors.amber,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  pickCard: {
    flexBasis: "31%",
    flexGrow: 1,
    padding: 8,
    alignItems: "center",
    gap: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  pickCardActive: {
    backgroundColor: colors.surfaceLowest,
    borderTopColor: colors.primary,
    borderLeftColor: colors.primary,
    borderBottomColor: colors.primaryDark,
    borderRightColor: colors.primaryDark,
  },
  pickCardIdle: {
    backgroundColor: colors.surfaceLow,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
  },
  pickBadge: {
    fontFamily: fonts.body,
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    letterSpacing: 1,
  },
  pickBadgeActive: { backgroundColor: colors.primary, color: colors.onPrimary },
  pickBadgeIdle: {
    backgroundColor: colors.surfaceHighest,
    color: colors.textMuted,
  },
  pickIconWrap: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  pickLabel: {
    fontFamily: fonts.pixel,
    fontSize: 9,
    letterSpacing: 0,
    marginTop: 2,
    textAlign: "center",
  },
  pickSub: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.textDim,
    letterSpacing: 0,
    textAlign: "center",
  },
});
