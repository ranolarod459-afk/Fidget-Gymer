import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { playStart } from "../utils/sounds";
import { colors, fonts } from "../theme/colors";
import { useSettings, GameType } from "../state/settingsStore";
import { useWorkout } from "../state/workoutStore";
import { useGame } from "../state/gameStore";
import { PixelButton } from "../components/PixelButton";
import {
  DumbbellIcon,
  HourglassIcon,
  SnakeIcon,
  BirdIcon,
  GalagaIcon,
} from "../components/PixelIcon";
import { ensureNotificationPermission } from "../utils/notifications";
import type { RootStackParamList } from "../navigation/RootNavigator";

const PRESETS = [60, 90, 120, 180, 240, 300];

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    restDurationSec,
    setRestDuration,
    selectedGame,
    setSelectedGame,
    soundEnabled,
    toggleSound,
    hapticsEnabled,
    toggleHaptics,
  } = useSettings();
  const start = useWorkout((s) => s.start);
  const highScores = useWorkout((s) => s.highScores);

  const onStart = async () => {
    await ensureNotificationPermission();
    playStart();
    useGame.setState({ status: "ready", score: 0 });
    start(restDurationSec, selectedGame);
    nav.navigate("Game");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Branding */}
        <View style={styles.brandCard}>
          <View style={styles.brandRow}>
            <DumbbellIcon size={28} />
            <Text style={styles.brandTitle}>FIDGET GYMER</Text>
          </View>
          <Text style={styles.brandSub}>REST. PLAY. LIFT. REPEAT.</Text>
        </View>

        {/* Rest duration */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderLeft}>
              <HourglassIcon size={14} />
              <Text style={styles.panelHeaderText}>REST TIME</Text>
            </View>
            <Text style={styles.panelHeaderRight}>[SET TIMER]</Text>
          </View>
          <View style={styles.chipGrid}>
            {PRESETS.map((s) => {
              const active = s === restDurationSec;
              return (
                <Pressable
                  key={s}
                  onPress={() => setRestDuration(s)}
                  style={[
                    styles.chip,
                    active ? styles.chipActive : styles.chipIdle,
                  ]}>
                  <Text
                    style={[
                      styles.chipText,
                      active ? styles.chipTextActive : styles.chipTextIdle,
                    ]}>
                    {fmt(s)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Game selector */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderLeft}>
              <Text style={styles.panelHeaderGlyph}>▚</Text>
              <Text style={styles.panelHeaderText}>SELECT GAME</Text>
            </View>
            <Text style={styles.panelHeaderRight}>CARTRIDGE</Text>
          </View>
          <View style={styles.gameGrid}>
            <GameCard
              type="snake"
              active={selectedGame === "snake"}
              onPress={() => setSelectedGame("snake")}
              label="SNAKE"
              sub="CLASSIC RUN"
              icon={<SnakeIcon size={56} />}
            />
            <GameCard
              type="flappy"
              active={selectedGame === "flappy"}
              onPress={() => setSelectedGame("flappy")}
              label="FLAPPY"
              sub="PIXEL WINGS"
              icon={<BirdIcon size={56} />}
            />
            <GameCard
              type="galaga"
              active={selectedGame === "galaga"}
              onPress={() => setSelectedGame("galaga")}
              label="GALAGA"
              sub="STAR SWARM"
              icon={<GalagaIcon size={56} />}
            />
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.panel}>
          <View style={styles.toggleGrid}>
            <ToggleTile
              label="SOUND"
              value={soundEnabled}
              onToggle={toggleSound}
            />
            <ToggleTile
              label="HAPTIC"
              value={hapticsEnabled}
              onToggle={toggleHaptics}
            />
          </View>
        </View>

        {/* Hi-scores */}
        <View style={styles.scorePanel}>
          <View style={styles.scoreHeader}>
            <View style={styles.panelHeaderLeft}>
              <View style={styles.scoreDot} />
              <Text style={styles.scoreHeaderText}>HI-SCORES ARCHIVE</Text>
            </View>
            <Text style={styles.scoreHeaderRight}>ROM.V1</Text>
          </View>
          <View style={styles.scoreGrid}>
            <ScoreBox
              label="SNAKE"
              value={highScores.snake}
              accent={colors.primary}
            />
            <ScoreBox
              label="FLAPPY"
              value={highScores.flappy}
              accent={colors.amber}
            />
            <ScoreBox
              label="GALAGA"
              value={Number.isFinite(highScores.galaga) ? highScores.galaga : 0}
              accent={colors.primaryLight}
            />
          </View>
        </View>

        {/* Start */}
        <View style={styles.startWrap}>
          <PixelButton
            label="▶  START GAME"
            size="lg"
            fullWidth
            onPress={onStart}
          />
          <View style={styles.startFooter}>
            <Text style={styles.footerText}>COIN: 99</Text>
            <Text style={styles.footerText}>CREDIT: READY</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Sub-components --- */

function GameCard({
  active,
  onPress,
  label,
  sub,
  icon,
}: {
  type: GameType;
  active: boolean;
  onPress: () => void;
  label: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.gameCard,
        active ? styles.gameCardActive : styles.gameCardIdle,
      ]}>
      <View style={styles.gameCardTop}>
        <Text
          style={[
            styles.gameCardBadge,
            active ? styles.badgeActive : styles.badgeIdle,
          ]}>
          {active ? "ACTIVE" : "STANDBY"}
        </Text>
        <Text
          style={[
            styles.gameCardNum,
            { color: active ? colors.primary : colors.textDim },
          ]}>
          {active ? "▶ 01" : "02"}
        </Text>
      </View>
      <View style={styles.gameCardIconWrap}>{icon}</View>
      <Text
        style={[
          styles.gameCardLabel,
          { color: active ? colors.primary : colors.textMuted },
        ]}>
        {label}
      </Text>
      <Text style={styles.gameCardSub}>{sub}</Text>
    </Pressable>
  );
}

function ToggleTile({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleTile}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View
        style={[
          styles.togglePill,
          value ? styles.togglePillOn : styles.togglePillOff,
        ]}>
        <Text
          style={[
            styles.togglePillText,
            { color: value ? colors.onPrimary : colors.textDim },
          ]}>
          {value ? "[ ON ]" : "[ OFF ]"}
        </Text>
      </View>
    </Pressable>
  );
}

function ScoreBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={styles.scoreBox}>
      <View style={styles.scoreBoxHeader}>
        <Text style={styles.scoreBoxLabel}>{label}</Text>
        <Text style={[styles.scoreBoxBest, { color: accent }]}>BEST</Text>
      </View>
      <Text style={[styles.scoreBoxValue, { color: accent }]}>
        {value.toString().padStart(4, "0")}
      </Text>
    </View>
  );
}

/* --- Styles --- */

const PANEL_SHADOW = {
  borderTopColor: colors.surfaceHighest,
  borderLeftColor: colors.surfaceHighest,
  borderBottomColor: colors.surfaceLowest,
  borderRightColor: colors.surfaceLowest,
  borderTopWidth: 2,
  borderLeftWidth: 2,
  borderBottomWidth: 2,
  borderRightWidth: 2,
} as const;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },

  brandCard: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    ...PANEL_SHADOW,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandTitle: {
    fontFamily: fonts.pixel,
    fontSize: 18,
    color: colors.primary,
    letterSpacing: -0.5,
    textShadowColor: colors.surfaceLowest,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  brandSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 6,
  },

  panel: {
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8,
    ...PANEL_SHADOW,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#000",
    borderTopColor: "#000",
    borderLeftColor: "#000",
    borderBottomColor: colors.surfaceLow,
    borderRightColor: colors.surfaceLow,
  },
  panelHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  panelHeaderGlyph: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  panelHeaderText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    letterSpacing: 1,
  },
  panelHeaderRight: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexBasis: "31%",
    flexGrow: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderTopColor: colors.primaryLight,
    borderLeftColor: colors.primaryLight,
    borderBottomColor: colors.primaryDark,
    borderRightColor: colors.primaryDark,
  },
  chipIdle: {
    backgroundColor: colors.surfaceHigh,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
  },
  chipText: {
    fontFamily: fonts.pixel,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  chipTextActive: { color: colors.onPrimary },
  chipTextIdle: { color: colors.text },

  gameGrid: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  gameCard: {
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
  gameCardActive: {
    backgroundColor: colors.surfaceLowest,
    borderTopColor: colors.primary,
    borderLeftColor: colors.primary,
    borderBottomColor: colors.primaryDark,
    borderRightColor: colors.primaryDark,
  },
  gameCardIdle: {
    backgroundColor: colors.surfaceLow,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
  },
  gameCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
  gameCardBadge: {
    fontFamily: fonts.body,
    fontSize: 11,
    paddingHorizontal: 5,
    paddingVertical: 1,
    letterSpacing: 1,
  },
  badgeActive: { backgroundColor: colors.primary, color: colors.onPrimary },
  badgeIdle: {
    backgroundColor: colors.surfaceHighest,
    color: colors.textMuted,
  },
  gameCardNum: { fontFamily: fonts.body, fontSize: 12, letterSpacing: 1 },
  gameCardIconWrap: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  gameCardLabel: {
    fontFamily: fonts.pixel,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
  gameCardSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 1,
  },

  toggleGrid: { flexDirection: "row", gap: 8 },
  toggleTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: "#000",
  },
  toggleLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    letterSpacing: 1,
  },
  togglePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  togglePillOn: {
    backgroundColor: colors.primary,
    borderTopColor: colors.primaryLight,
    borderLeftColor: colors.primaryLight,
    borderBottomColor: colors.primaryDark,
    borderRightColor: colors.primaryDark,
  },
  togglePillOff: {
    backgroundColor: colors.surfaceHigh,
    borderTopColor: colors.surfaceHighest,
    borderLeftColor: colors.surfaceHighest,
    borderBottomColor: colors.surfaceLowest,
    borderRightColor: colors.surfaceLowest,
  },
  togglePillText: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 1,
  },

  scorePanel: {
    backgroundColor: colors.surfaceLowest,
    padding: 10,
    gap: 8,
    borderWidth: 2,
    borderColor: "#000",
    borderTopColor: "#000",
    borderLeftColor: "#000",
    borderBottomColor: colors.surface,
    borderRightColor: colors.surface,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: colors.surfaceHighest,
  },
  scoreDot: { width: 8, height: 8, backgroundColor: colors.amber },
  scoreHeaderText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.amberLight,
    letterSpacing: 2,
  },
  scoreHeaderRight: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textDim,
    letterSpacing: 2,
  },
  scoreGrid: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  scoreBox: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: colors.surfaceLow,
    padding: 6,
    borderWidth: 2,
    borderColor: "#000",
    borderTopColor: "#000",
    borderLeftColor: "#000",
    borderBottomColor: colors.surfaceHighest,
    borderRightColor: colors.surfaceHighest,
  },
  scoreBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreBoxLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  scoreBoxBest: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 2,
  },
  scoreBoxValue: {
    fontFamily: fonts.pixel,
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 1,
    textAlign: "center",
  },

  startWrap: { marginTop: 4, gap: 8 },
  startFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textDim,
    letterSpacing: 2,
  },
});
