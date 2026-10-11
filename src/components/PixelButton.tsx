import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, fonts } from "../theme/colors";

type Variant = "primary" | "neutral" | "danger";
type Size = "md" | "lg";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const PALETTE: Record<
  Variant,
  { bg: string; light: string; dark: string; text: string }
> = {
  primary: {
    bg: colors.primary,
    light: colors.primaryLight,
    dark: colors.primaryDark,
    text: colors.onPrimary,
  },
  neutral: {
    bg: colors.surfaceHigh,
    light: colors.surfaceHighest,
    dark: colors.surfaceLowest,
    text: colors.text,
  },
  danger: {
    bg: colors.danger,
    light: "#ffdad6",
    dark: colors.dangerDark,
    text: colors.onPrimary,
  },
};

export function PixelButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
  fullWidth,
  style,
  textStyle,
  icon,
}: Props) {
  const p = PALETTE[variant];
  const isLg = size === "lg";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg,
          paddingVertical: isLg ? 18 : 10,
          paddingHorizontal: isLg ? 20 : 14,
          width: fullWidth ? "100%" : undefined,
          transform: pressed
            ? [{ translateX: 2 }, { translateY: 2 }]
            : [{ translateX: 0 }, { translateY: 0 }],
          shadowColor: "#000",
          shadowOpacity: 1,
          shadowRadius: 0,
          shadowOffset: { width: pressed ? 0 : 3, height: pressed ? 0 : 3 },
          elevation: pressed ? 0 : 4,
          borderTopColor: p.light,
          borderLeftColor: p.light,
          borderBottomColor: p.dark,
          borderRightColor: p.dark,
          borderTopWidth: isLg ? 4 : 2,
          borderLeftWidth: isLg ? 4 : 2,
          borderBottomWidth: isLg ? 4 : 2,
          borderRightWidth: isLg ? 4 : 2,
        },
        style,
      ]}>
      {icon}
      <Text
        style={[
          {
            color: p.text,
            fontFamily: fonts.pixel,
            fontSize: isLg ? 14 : 10,
            letterSpacing: 1,
            textAlign: "center",
          },
          textStyle,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 0,
  },
});
