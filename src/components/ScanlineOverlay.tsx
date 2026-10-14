import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { SHOW_SCANLINES } from "../theme/colors";

const STRIPE_HEIGHT = 1; // height of each visible stripe
const STRIPE_GAP = 1; // gap between stripes

export function ScanlineOverlay() {
  if (!SHOW_SCANLINES) return null;

  const { width, height } = Dimensions.get("screen");
  const total = Math.ceil(height / (STRIPE_HEIGHT + STRIPE_GAP));

  return (
    <View
      style={[StyleSheet.absoluteFill, { width, height }]}
      pointerEvents="none">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: i * (STRIPE_HEIGHT + STRIPE_GAP),
            left: 0,
            width,
            height: STRIPE_HEIGHT,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />
      ))}
    </View>
  );
}
